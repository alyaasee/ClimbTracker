import { users, climbs, type User, type InsertUser, type Climb, type InsertClimb } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number, streak: number, lastClimbDate: string): Promise<void>;
  
  createClimb(climb: InsertClimb & { userId: number }): Promise<Climb>;
  getClimbsByUser(userId: number): Promise<Climb[]>;
  getClimbsByUserAndDateRange(userId: number, startDate: string, endDate: string): Promise<Climb[]>;
  getClimbsByUserAndDate(userId: number, date: string): Promise<Climb[]>;
  updateClimb(id: number, climb: Partial<InsertClimb>): Promise<Climb | undefined>;
  deleteClimb(id: number): Promise<void>;
  
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
  }>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStreak(userId: number, streak: number, lastClimbDate: string): Promise<void> {
    await db
      .update(users)
      .set({ currentStreak: streak, lastClimbDate })
      .where(eq(users.id, userId));
  }

  async createClimb(climb: InsertClimb & { userId: number }): Promise<Climb> {
    const [newClimb] = await db
      .insert(climbs)
      .values(climb)
      .returning();
    return newClimb;
  }

  async getClimbsByUser(userId: number): Promise<Climb[]> {
    return await db
      .select()
      .from(climbs)
      .where(eq(climbs.userId, userId))
      .orderBy(desc(climbs.climbDate), desc(climbs.createdAt));
  }

  async getClimbsByUserAndDateRange(userId: number, startDate: string, endDate: string): Promise<Climb[]> {
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

  async updateClimb(id: number, climb: Partial<InsertClimb>): Promise<Climb | undefined> {
    const [updatedClimb] = await db
      .update(climbs)
      .set(climb)
      .where(eq(climbs.id, id))
      .returning();
    return updatedClimb || undefined;
  }

  async deleteClimb(id: number): Promise<void> {
    await db.delete(climbs).where(eq(climbs.id, id));
  }

  async getTodayStats(userId: number, date: string): Promise<{
    climbs: number;
    flashes: number;
    sends: number;
    projects: number;
  }> {
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
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const monthlyClimbs = await this.getClimbsByUserAndDateRange(userId, startDate, endDate);
    
    // Grade ordering for finding max grade
    const gradeOrder = ['5a', '5b', '5c', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b', '8c'];
    
    let maxGrade = '5a';
    let successfulClimbs = 0;
    
    monthlyClimbs.forEach(climb => {
      if (gradeOrder.indexOf(climb.grade) > gradeOrder.indexOf(maxGrade)) {
        maxGrade = climb.grade;
      }
      if (climb.outcome === 'Send' || climb.outcome === 'Flash') {
        successfulClimbs++;
      }
    });

    const successRate = monthlyClimbs.length > 0 ? Math.round((successfulClimbs / monthlyClimbs.length) * 100) : 0;

    return {
      totalClimbs: monthlyClimbs.length,
      maxGrade,
      successRate,
    };
  }
}

export const storage = new DatabaseStorage();
