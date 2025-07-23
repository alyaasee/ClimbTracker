import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClimbSchema, type User } from "@shared/schema";
import { format } from "date-fns";
import OpenAI from "openai";
import { Resend } from "resend";

export async function registerRoutes(app: Express): Promise<Server> {
  // Development bypass control
  let developmentBypassDisabled = false;

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

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
    if (process.env.NODE_ENV !== 'development' || developmentBypassDisabled) {
      return null;
    }

    // Priority: passed email > environment variable > default
    const userEmail = email || process.env.DEV_USER_EMAIL || 'lyhakim@gmail.com';
    const user = await storage.getUserByEmail(userEmail);
    return user || null;
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

      // FORCE LOG THE CODE - NO CONDITIONS
      console.log(`\n🔑🔑🔑 VERIFICATION CODE for ${email}: ${code} 🔑🔑🔑`);
      console.log(`⏰ Code expires at: ${expiresAt.toISOString()}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'undefined'}`);
      console.log(`Current time: ${new Date().toISOString()}\n`);

      await storage.updateVerificationCode(email, code, expiresAt);

      // Send verification code via email
      try {
        await resend.emails.send({
          from: 'CLIMB-CADE <onboarding@resend.dev>',
          to: email,
          subject: 'Your CLIMB-CADE Verification Code',
          html: `
            <div style="font-family: 'Space Mono', monospace; max-width: 600px; margin: 0 auto; background: #FCFCF9;">
              <div style="background: linear-gradient(135deg, #CEE4D2 0%, #EF7326 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #1F1F1F; margin: 0; font-size: 28px; font-weight: bold;">🧗 CLIMB-CADE</h1>
              </div>

              <div style="background: #FCFCF9; padding: 40px 20px; border-left: 4px solid #EF7326;">
                <h2 style="color: #1F1F1F; margin-top: 0; font-family: 'Space Mono', monospace;">Your Verification Code</h2>
                <p style="color: #1F1F1F; font-size: 16px; line-height: 1.5; font-family: 'Space Mono', monospace;">
                  Hi ${name || 'Climber'}! Welcome to CLIMB-CADE. Use the code below to complete your login:
                </p>

                <div style="background: #CEE4D2; border: 3px solid #1F1F1F; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                  <span style="font-size: 32px; font-weight: bold; color: #1F1F1F; letter-spacing: 8px; font-family: 'Space Mono', monospace;">${code}</span>
                </div>

                <p style="color: #1F1F1F; font-size: 14px; line-height: 1.5; font-family: 'Space Mono', monospace;">
                  This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
                </p>

                <div style="border-top: 2px solid #EF7326; margin-top: 30px; padding-top: 20px;">
                  <p style="color: #1F1F1F; font-size: 12px; margin: 0; font-family: 'Space Mono', monospace;">
                    Happy climbing! Made by Alyaa 🏔️
                  </p>
                </div>
              </div>
            </div>
          `
        });

        console.log(`Verification code sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        console.error("Email error details:", JSON.stringify(emailError, null, 2));
        // Don't throw error in development, just log it
        if (process.env.NODE_ENV !== 'development') {
          throw new Error("Failed to send verification email");
        }
      }

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

      console.log(`DEBUG: Attempting to verify code ${code} for ${email}`);

      // Development bypass for testing
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
      if (isDevelopment && code === '000000') {
        console.log(`DEBUG: Using development bypass code for ${email}`);
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createAuthUser(email, 'Dev User');
        }
        
        // Create session for bypass
        const session = await storage.createSession(user.id, user.email || '');
        res.cookie('sessionId', session.id, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.json({ message: "Successfully verified (dev bypass)" });
      }

      const user = await storage.verifyUser(email, code);
      if (!user) {
        console.log(`DEBUG: Failed to verify code ${code} for ${email}`);
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      console.log(`DEBUG: Successfully verified code for ${email}`);

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
              profileImageUrl: user.profileImageUrl,
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
              profileImageUrl: user.profileImageUrl,
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

  // Logout route
  app.post("/api/logout", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        await storage.deleteSession(sessionId);
      }
      // Clear the session cookie
      res.clearCookie('sessionId', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
      
      // Disable development bypass after logout
      if (process.env.NODE_ENV === 'development') {
        developmentBypassDisabled = true;
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

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

  // Get daily motivational quote
  app.get("/api/quote", requireAuth, async (req: any, res) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      if (!process.env.OPENAI_API_KEY) {
        // Fallback quotes with date-based selection for consistency
        const fallbackQuotes = [
          "Oh great, another day of pretending gravity doesn't exist. How wonderfully delusional of us climbers.",
          "Ah yes, because clearly what this world needed was more people voluntarily dangling from rocks. Brilliant life choices all around.",
          "Today's agenda: Ignore basic physics, defy common sense, and somehow call it 'fun.' Classic climber logic.",
          "Nothing says 'I make excellent decisions' like paying money to hang off a cliff. Peak adulting right there.",
          "Oh wonderful, another opportunity to discover creative new ways to question your life choices mid-route."
        ];

        // Use date to ensure same quote per day but different quotes on different days
        const dateHash = today.split('-').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
        const quoteIndex = dateHash % fallbackQuotes.length;

        return res.json({ 
          quote: fallbackQuotes[quoteIndex],
          fallback: true 
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a brilliantly sarcastic motivational coach for rock climbers. Your humor is dry, witty, and delightfully cynical while still being genuinely motivating. Think of yourself as a climbing coach who graduated from the school of sarcasm with honors. Generate a short, hilariously sarcastic yet oddly inspiring quote about climbing. Keep it under 60 words and make sure it's both amusing and motivating despite the heavy dose of sarcasm."
          },
          {
            role: "user",
            content: `Give me a sarcastic motivational climbing quote for ${today}. Make it unique to today and really lean into the sarcastic humor while still being motivational.`
          }
        ],
        max_tokens: 120,
        temperature: 0.8,
        // Use date as seed for consistency  
        seed: parseInt(today.replace(/-/g, '')) % 1000000,
      });

      const quote = completion.choices[0]?.message?.content || 
        "Congratulations! You've chosen a hobby where success is measured by how high you can go before gravity reminds you who's boss. How refreshingly optimistic.";

      // Cache for 24 hours but with date-specific headers
      res.set('Cache-Control', 'private, max-age=86400');
      res.set('Vary', 'Authorization, Date');
      res.json({ quote, fallback: false, date: today });
    } catch (error) {
      console.error("Daily quote error:", error);
      // Enhanced fallback quotes with more sarcasm
      const fallbackQuotes = [
        "Oh wonderful, another day of voluntarily fighting gravity. Because that always ends well for humans.",
        "Today's forecast: 100% chance of falling with a slight possibility of not completely embarrassing yourself.",
        "Remember, every expert was once a beginner who refused to give up. How annoyingly persistent of them.",
        "Climbing: Because apparently walking on flat ground is too mainstream for some people.",
        "Today you'll either reach new heights or discover exciting new ways to become one with the ground. Character building!",
        "Ah yes, let's pay money to make our hands bleed and our muscles scream. What could possibly go wrong?",
        "Nothing says 'sound judgment' like looking at a vertical wall and thinking 'I should definitely climb that.'",
        "Today's goal: Defy physics, ignore logic, and somehow call it exercise. Peak human behavior right there."
      ];

      // Use date-based selection for consistent daily quotes
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateHash = today.split('-').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
      const quoteIndex = dateHash % fallbackQuotes.length;

      res.json({ quote: fallbackQuotes[quoteIndex], fallback: true, date: today });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}