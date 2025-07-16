import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClimbSchema } from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a default user for demo purposes
  app.get("/api/user", async (req, res) => {
    try {
      let user = await storage.getUserByUsername("demo");
      if (!user) {
        user = await storage.createUser({
          username: "demo",
          password: "password",
          firstName: "Alyaa",
        });
      }
      
      // Recalculate streak to ensure it's up to date
      const currentStreak = await storage.calculateWeeklyStreak(user.id);
      if (currentStreak !== user.currentStreak) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await storage.updateUserStreak(user.id, currentStreak, today);
        user = await storage.getUserByUsername("demo"); // Refresh user data
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get all climbs for user
  app.get("/api/climbs", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const climbs = await storage.getClimbsByUser(user.id);
      res.json(climbs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get climbs" });
    }
  });

  // Create a new climb
  app.post("/api/climbs", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

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
  app.put("/api/climbs/:id", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

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
  app.delete("/api/climbs/:id", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

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
  app.get("/api/stats/today", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const stats = await storage.getTodayStats(user.id, today);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get today's stats" });
    }
  });

  // Get monthly stats
  app.get("/api/stats/monthly", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const stats = await storage.getMonthlyStats(user.id, year, month);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get monthly stats" });
    }
  });

  // Get available months with climbs
  app.get("/api/stats/available-months", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const months = await storage.getAvailableMonths(user.id);
      res.json(months);
    } catch (error) {
      res.status(500).json({ error: "Failed to get available months" });
    }
  });

  // Get grade progression data
  app.get("/api/stats/grade-progression", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const progressionData = await storage.getGradeProgressionData(user.id, year, month);
      res.json(progressionData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get grade progression data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
