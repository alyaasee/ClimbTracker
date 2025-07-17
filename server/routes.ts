import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClimbSchema } from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Clean up expired sessions periodically
  setInterval(async () => {
    try {
      await storage.deleteExpiredSessions();
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
    }
  }, 60 * 60 * 1000); // Run every hour

  // Generate a 6-digit verification code
  function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper function for development user lookup
  async function getDevelopmentUser(email?: string): Promise<User | null> {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    // Priority: passed email > environment variable > default
    const userEmail = email || process.env.DEV_USER_EMAIL || 'lyhakim@gmail.com';
    return await storage.getUserByEmail(userEmail);
  }

  // Auth routes
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists, if not create one
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createAuthUser(email, name);
      } else if (name && name.trim()) {
        // Always update user's name if provided in login
        await storage.updateUserName(user.id, name.trim());
        user = await storage.getUserByEmail(email);
      }

      // Generate verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.updateVerificationCode(email, code, expiresAt);

      // In a real app, you'd send this via email service
      console.log(`Verification code for ${email}: ${code}`);
      
      res.json({ message: "Verification code sent" });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      const user = await storage.verifyUser(email, code);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      // Update last login time
      await storage.updateLastLogin(user.id);

      // Create persistent session
      const session = await storage.createSession(user.id, user.email || '');

      res.cookie('sessionId', session.id, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ message: "Successfully verified" });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        // Development-only bypass - strictly gated
        if (process.env.NODE_ENV === 'development') {
          const user = await getDevelopmentUser();
          if (user) {
            return res.json({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              isAuthenticated: true,
            });
          }
        }
        return res.status(401).json({ error: "Not authenticated" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        // Development-only bypass - strictly gated
        if (process.env.NODE_ENV === 'development') {
          const user = await getDevelopmentUser();
          if (user) {
            return res.json({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              isAuthenticated: true,
            });
          }
        }
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        await storage.deleteSession(sessionId);
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        profileImageUrl: user.profileImageUrl,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Auth user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Middleware to check authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        // Development-only bypass - strictly gated
        if (process.env.NODE_ENV === 'development') {
          const user = await getDevelopmentUser();
          if (user) {
            req.user = user;
            return next();
          }
        }
        return res.status(401).json({ error: "Not authenticated" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        // Development-only bypass - strictly gated
        if (process.env.NODE_ENV === 'development') {
          const user = await getDevelopmentUser();
          if (user) {
            req.user = user;
            return next();
          }
        }
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        await storage.deleteSession(sessionId);
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: "Authentication error" });
    }
  };

  // Get current user data
  app.get("/api/user", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Recalculate streak to ensure it's up to date
      const currentStreak = await storage.calculateWeeklyStreak(user.id);
      if (currentStreak !== user.currentStreak) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await storage.updateUserStreak(user.id, currentStreak, today);
        // Refresh user data
        const updatedUser = await storage.getUser(user.id);
        return res.json(updatedUser);
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get all climbs for user
  app.get("/api/climbs", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const climbs = await storage.getClimbsByUser(user.id);
      
      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');
      
      res.json(climbs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get climbs" });
    }
  });

  // Create a new climb
  app.post("/api/climbs", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const validatedData = insertClimbSchema.parse(req.body);
      const climb = await storage.createClimb({
        ...validatedData,
        userId: user.id,
      });

      // Update user streak using weekly calculation
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);

      res.json(climb);
    } catch (error) {
      res.status(400).json({ error: "Invalid climb data" });
    }
  });

  // Update a climb
  app.put("/api/climbs/:id", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const id = parseInt(req.params.id);
      const validatedData = insertClimbSchema.partial().parse(req.body);
      const climb = await storage.updateClimb(id, validatedData);
      
      if (!climb) {
        return res.status(404).json({ error: "Climb not found" });
      }
      
      // Recalculate streak after update (in case date changed)
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);
      
      res.json(climb);
    } catch (error) {
      res.status(400).json({ error: "Invalid climb data" });
    }
  });

  // Delete a climb
  app.delete("/api/climbs/:id", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const id = parseInt(req.params.id);
      await storage.deleteClimb(id);
      
      // Recalculate streak after deletion
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete climb" });
    }
  });

  // Get today's stats
  app.get("/api/stats/today", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const today = format(new Date(), 'yyyy-MM-dd');
      const stats = await storage.getTodayStats(user.id, today);
      
      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=60');
      res.set('Vary', 'Authorization');
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get today's stats" });
    }
  });

  // Get monthly stats
  app.get("/api/stats/monthly", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const stats = await storage.getMonthlyStats(user.id, year, month);
      
      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');
      
      res.json(stats);
    } catch (error) {
      console.error("Monthly stats error:", error);
      res.status(500).json({ error: "Failed to get monthly stats" });
    }
  });

  // Get available months with climbs
  app.get("/api/stats/available-months", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const months = await storage.getAvailableMonths(user.id);
      
      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');
      
      res.json(months);
    } catch (error) {
      res.status(500).json({ error: "Failed to get available months" });
    }
  });

  // Get grade progression data
  app.get("/api/stats/grade-progression", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const progressionData = await storage.getGradeProgressionData(user.id, year, month);
      
      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');
      
      res.json(progressionData);
    } catch (error) {
      console.error("Grade progression error:", error);
      res.status(500).json({ error: "Failed to get grade progression data" });
    }
  });

  // Update user profile
  app.put("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const { firstName, profileImageUrl } = req.body;
      
      const profileData: { firstName?: string; profileImageUrl?: string } = {};
      
      if (firstName !== undefined) {
        profileData.firstName = firstName.trim();
      }
      
      if (profileImageUrl !== undefined) {
        profileData.profileImageUrl = profileImageUrl;
      }
      
      const updatedUser = await storage.updateUserProfile(user.id, profileData);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
