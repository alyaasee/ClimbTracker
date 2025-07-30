import { users, climbs, sessions, type User, type InsertUser, type Climb, type InsertClimb, type Session } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { storageService } from "./supabase";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streak: number, lastClimbDate: string): Promise<void>;
  calculateWeeklyStreak(userId: number): Promise<number>;
  
  // Auth methods
  createAuthUser(email: string, firstName?: string): Promise<User>;
  getUserByEmailOrCreate(email: string, firstName?: string): Promise<User>;
  updateVerificationCode(email: string, code: string, expiresAt: Date): Promise<void>;
  verifyUser(email: string, code: string): Promise<User | null>;
  updateLastLogin(userId: number): Promise<void>;
  updateUserName(userId: number, firstName: string): Promise<void>;
  updateUserProfile(userId: number, profileData: { firstName?: string; profileImageUrl?: string }): Promise<User>;
  
  // Session methods
  createSession(userId: number, email: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  deleteSession(sessionId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  createClimb(climb: InsertClimb & { userId: number }): Promise<Climb>;
  getClimbsByUser(userId: number): Promise<Climb[]>;
  getClimbsByUserAndDateRange(userId: number, startDate: string, endDate: string): Promise<Climb[]>;
  getClimbsByUserAndDate(userId: number, date: string): Promise<Climb[]>;
  updateClimb(id: number, userId: number, climb: Partial<InsertClimb>): Promise<Climb | undefined>;
  deleteClimb(id: number, userId: number): Promise<void>;
  
  getTodayStats(userId: number, date: string): Promise<{
    climbs: number;
    flashes: number;
    sends: number;
    projects: number;
  }>;
  
  getMonthlyStats(userId: number, year: number, month: number): Promise<{
    totalClimbs: number;
    maxGrade: string;
    successRate: number;
    routeTypeBreakdown: { routeType: string; count: number; percentage: number }[];
  }>;
  
  getAvailableMonths(userId: number): Promise<{ year: number; month: number; monthName: string }[]>;
  
  getGradeProgressionData(userId: number, upToYear: number, upToMonth: number): Promise<{
    month: string;
    year: number;
    monthNum: number;
    maxGrade: string;
    gradeValue: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAuthUser(email: string, firstName?: string): Promise<User> {
    // Use provided firstName or keep email as the primary identifier
    const userFirstName = firstName || email.split('@')[0];
    
    const [user] = await db
      .insert(users)
      .values({
        email,
        firstName: userFirstName,
        isVerified: false,
      })
      .returning();
    return user;
  }

  async updateVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        verificationCode: code, 
        codeExpiresAt: expiresAt 
      })
      .where(eq(users.email, email));
  }

  async verifyUser(email: string, code: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.verificationCode, code),
          gte(users.codeExpiresAt, new Date())
        )
      );

    if (!user) return null;

    // Update user as verified and clear verification code
    const [verifiedUser] = await db
      .update(users)
      .set({ 
        isVerified: true, 
        verificationCode: null as string | null, 
        codeExpiresAt: null as Date | null 
      })
      .where(eq(users.id, user.id))
      .returning();

    return verifiedUser;
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserName(userId: number, firstName: string): Promise<void> {
    await db
      .update(users)
      .set({ firstName })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: number, profileData: { firstName?: string; profileImageUrl?: string; isVerified?: boolean }): Promise<User> {
    console.log(`DEBUG: Updating user ${userId} with data:`, profileData);
    const [updatedUser] = await db
      .update(users)
      .set(profileData)
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`Failed to update user ${userId} - user not found`);
    }
    
    console.log(`DEBUG: Successfully updated user ${userId}:`, { id: updatedUser.id, isVerified: updatedUser.isVerified });
    return updatedUser;
  }

  async getUserByEmailOrCreate(email: string, firstName?: string): Promise<User> {
    // Try to find existing user by email
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }
    
    // If not found, create new user
    return await this.createAuthUser(email, firstName);
  }

  async updateUserStreak(userId: number, streak: number, lastClimbDate: string): Promise<void> {
    await db
      .update(users)
      .set({ currentStreak: streak, lastClimbDate })
      .where(eq(users.id, userId));
  }

  async calculateWeeklyStreak(userId: number): Promise<number> {
    const climbs = await this.getClimbsByUser(userId);
    
    if (climbs.length === 0) return 0;

    // Get unique dates when user climbed
    const uniqueDates = Array.from(new Set(climbs.map(climb => climb.climbDate))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Helper function to get the Sunday of a given date's week
    const getSundayOfWeek = (dateStr: string): Date => {
      const date = new Date(dateStr + 'T00:00:00.000Z'); // Ensure UTC parsing
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - day;
      const sunday = new Date(date);
      sunday.setUTCDate(diff);
      sunday.setUTCHours(0, 0, 0, 0);
      return sunday;
    };

    // Group dates by week and count unique days per week
    const weeklyData: { [weekKey: string]: Set<string> } = {};
    
    uniqueDates.forEach(dateStr => {
      const sunday = getSundayOfWeek(dateStr);
      const weekKey = sunday.toISOString().split('T')[0]; // Use Sunday's date as week key
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = new Set();
      }
      weeklyData[weekKey].add(dateStr);
    });

    // Calculate current streak for the current week only (Sunday to Saturday)
    const today = new Date();
    const currentWeekStart = getSundayOfWeek(today.toISOString().split('T')[0]);
    const currentWeekKey = currentWeekStart.toISOString().split('T')[0];
    
    // Return the number of unique days in the current week
    if (weeklyData[currentWeekKey]) {
      return weeklyData[currentWeekKey].size;
    }
    
    return 0;
  }

  async createClimb(climb: InsertClimb & { userId: number }): Promise<Climb> {
    // SECURITY: Verify userId is valid to prevent unauthorized climb creation
    if (!climb.userId || climb.userId <= 0) {
      throw new Error("Invalid user ID for climb creation");
    }
    
    // Additional security: Verify user exists before creating climb
    const user = await this.getUser(climb.userId);
    if (!user) {
      throw new Error("User not found - cannot create climb");
    }
    
    const [newClimb] = await db
      .insert(climbs)
      .values(climb)
      .returning();
    return newClimb;
  }

  async getClimbsByUser(userId: number): Promise<Climb[]> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for climbs query");
    }
    
    return await db
      .select()
      .from(climbs)
      .where(eq(climbs.userId, userId))
      .orderBy(desc(climbs.climbDate), desc(climbs.createdAt));
  }

  async getClimbsByUserAndDateRange(userId: number, startDate: string, endDate: string): Promise<Climb[]> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for date range query");
    }
    
    return await db
      .select()
      .from(climbs)
      .where(
        and(
          eq(climbs.userId, userId),
          gte(climbs.climbDate, startDate),
          lte(climbs.climbDate, endDate)
        )
      )
      .orderBy(desc(climbs.climbDate), desc(climbs.createdAt));
  }

  async getClimbsByUserAndDate(userId: number, date: string): Promise<Climb[]> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for date query");
    }
    
    return await db
      .select()
      .from(climbs)
      .where(
        and(
          eq(climbs.userId, userId),
          eq(climbs.climbDate, date)
        )
      );
  }

  async updateClimb(id: number, userId: number, climb: Partial<InsertClimb>): Promise<Climb | undefined> {
    // SECURITY: Verify userId is valid to prevent unauthorized updates
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for climb update");
    }
    
    const [updatedClimb] = await db
      .update(climbs)
      .set(climb)
      .where(and(eq(climbs.id, id), eq(climbs.userId, userId)))
      .returning();
    return updatedClimb || undefined;
  }

  async deleteClimb(id: number, userId: number): Promise<void> {
    // SECURITY: Verify userId is valid to prevent unauthorized deletions
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for climb deletion");
    }
    
    const result = await db.delete(climbs).where(and(eq(climbs.id, id), eq(climbs.userId, userId)));
    
    // Verify that a record was actually deleted (ensures user owned the climb)
    if (result.rowCount === 0) {
      throw new Error("Climb not found or you don't have permission to delete it");
    }
  }

  async getTodayStats(userId: number, date: string): Promise<{
    climbs: number;
    flashes: number;
    sends: number;
    projects: number;
  }> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for stats query");
    }
    const todayClimbs = await this.getClimbsByUserAndDate(userId, date);
    
    return {
      climbs: todayClimbs.length,
      flashes: todayClimbs.filter(c => c.outcome === "Flash").length,
      sends: todayClimbs.filter(c => c.outcome === "Send").length,
      projects: todayClimbs.filter(c => c.outcome === "Project").length,
    };
  }

  async getMonthlyStats(userId: number, year: number, month: number): Promise<{
    totalClimbs: number;
    maxGrade: string;
    successRate: number;
    routeTypeBreakdown: { routeType: string; count: number; percentage: number }[];
  }> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for monthly stats query");
    }
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const monthlyClimbs = await this.getClimbsByUserAndDateRange(userId, startDate, endDate);
    
    // If no climbs for this month, return empty stats
    if (monthlyClimbs.length === 0) {
      return {
        totalClimbs: 0,
        maxGrade: '5c',
        successRate: 0,
        routeTypeBreakdown: [],
      };
    }
    
    // Grade ordering for finding max grade
    const gradeOrder = ['5c', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7b', '7c'];
    
    let maxGrade = '5c';
    let successfulClimbs = 0;
    
    // Count route types
    const routeTypeCounts: { [key: string]: number } = {};
    
    monthlyClimbs.forEach(climb => {
      if (gradeOrder.indexOf(climb.grade) > gradeOrder.indexOf(maxGrade)) {
        maxGrade = climb.grade;
      }
      if (climb.outcome === 'Send' || climb.outcome === 'Flash') {
        successfulClimbs++;
      }
      
      routeTypeCounts[climb.routeType] = (routeTypeCounts[climb.routeType] || 0) + 1;
    });

    const successRate = Math.round((successfulClimbs / monthlyClimbs.length) * 100);

    // Create route type breakdown with percentages
    const routeTypeBreakdown = Object.entries(routeTypeCounts)
      .map(([routeType, count]) => ({
        routeType,
        count,
        percentage: Math.round((count / monthlyClimbs.length) * 100)
      }))
      .filter(item => item.percentage >= 5) // Only show slices >= 5%
      .sort((a, b) => b.count - a.count);

    return {
      totalClimbs: monthlyClimbs.length,
      maxGrade,
      successRate,
      routeTypeBreakdown,
    };
  }

  async getAvailableMonths(userId: number): Promise<{ year: number; month: number; monthName: string }[]> {
    // SECURITY: Verify userId is valid to prevent data leakage
    if (!userId || userId <= 0) {
      throw new Error("Invalid user ID for available months query");
    }
    const climbs = await this.getClimbsByUser(userId);
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthsSet = new Set<string>();
    climbs.forEach(climb => {
      const date = new Date(climb.climbDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      monthsSet.add(`${year}-${month}`);
    });
    
    return Array.from(monthsSet)
      .map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        return {
          year,
          month,
          monthName: monthNames[month - 1]
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  async getGradeProgressionData(userId: number, upToYear: number, upToMonth: number): Promise<{
    month: string;
    year: number;
    monthNum: number;
    maxGrade: string;
    gradeValue: number;
  }[]> {
    try {
      const availableMonths = await this.getAvailableMonths(userId);
      const gradeOrder = ['5c', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7b', '7c'];
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      
      const progressionData = [];
      
      for (const monthData of availableMonths) {
        // Only include months up to the selected month
        if (monthData.year > upToYear || (monthData.year === upToYear && monthData.month > upToMonth)) {
          continue;
        }
        
        try {
          const monthlyStats = await this.getMonthlyStats(userId, monthData.year, monthData.month);

          
          // Convert grade to display value (higher number = higher grade)
          const gradeIndex = gradeOrder.indexOf(monthlyStats.maxGrade);
          const gradeValue = gradeIndex !== -1 ? gradeIndex + 1 : 0;
          
          progressionData.push({
            month: monthNames[monthData.month - 1],
            year: monthData.year,
            monthNum: monthData.month,
            maxGrade: monthlyStats.maxGrade,
            gradeValue: gradeValue
          });
        } catch (error) {
          console.error(`Error getting monthly stats for ${monthData.year}-${monthData.month}:`, error);
        }
      }
      
      return progressionData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      });
    } catch (error) {
      console.error("Error in getGradeProgressionData:", error);
      throw error;
    }
  }

  // Session management methods
  async createSession(userId: number, email: string): Promise<Session> {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [session] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        userId,
        email,
        expiresAt,
      })
      .returning();

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) return null;

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db
      .delete(sessions)
      .where(sql`expires_at < NOW()`);
  }
}

export const storage = new DatabaseStorage();
