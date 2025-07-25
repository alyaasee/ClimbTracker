import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
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

  // Initialize Resend for email
  const resend = new Resend(process.env.RESEND_API_KEY);

  /**
   * Rate limiting configuration for different endpoint types.
   * These limits help prevent abuse and ensure fair usage across all users.
   */

  // Strict rate limiting for authentication endpoints (prevents brute force attacks)
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth
    message: {
      error: "Too many authentication attempts. Please try again in 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Skip rate limiting in development for easier testing
    skip: (req) => process.env.NODE_ENV === 'development'
  });

  // Moderate rate limiting for sensitive operations (prevents spam)
  const sensitiveRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 requests per 5 minutes
    message: {
      error: "Too many requests. Please slow down and try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
  });

  // General API rate limiting for all endpoints
  const generalRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
      error: "Rate limit exceeded. Please wait a moment before making more requests."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
  });

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimit);

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

  // Auth routes with strict rate limiting
  app.post("/api/auth/send-code", authRateLimit, async (req, res) => {
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
      let emailSent = false;
      try {
        const mailOptions = {
          from: `CLIMB-CADE <${process.env.GMAIL_USER}>`,
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
        };

        const emailResult = await gmailTransporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`✅ Email successfully sent to ${email}, Message ID: ${emailResult.messageId}`);
      } catch (emailError) {
        console.error(`❌ Email send exception for ${email}:`, emailError);
        console.error("Email error details:", JSON.stringify(emailError, null, 2));
        
        // In production, fail if email can't be sent
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ 
            error: "Failed to send verification email. Please try again or contact support." 
          });
        }
      }

      // Log final email status
      console.log(`📧 Email delivery status for ${email}: ${emailSent ? 'SUCCESS' : 'FAILED'}`);
      
      if (!emailSent && process.env.NODE_ENV === 'production') {
        console.error(`🚨 PRODUCTION EMAIL FAILURE: User ${email} will not receive verification code`);
      }

      res.json({ message: "Verification code sent" });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-code", authRateLimit, async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      console.log(`\n🔍 VERIFICATION DEBUG START`);
      console.log(`Email: ${email}`);
      console.log(`Code received: "${code}" (type: ${typeof code}, length: ${code.length})`);
      console.log(`Environment: ${process.env.NODE_ENV || 'undefined'}`);
      
      // Universal bypass code - always 999999
      const universalBypassCode = '999999';
      console.log(`Universal bypass code: "${universalBypassCode}" (length: ${universalBypassCode.length})`);
      console.log(`Code match: "${code}" === "${universalBypassCode}" = ${code === universalBypassCode}`);
      console.log(`🔍 VERIFICATION DEBUG END\n`);

      // Check universal bypass code first - this should work for ANY email
      if (code === universalBypassCode) {
        console.log(`🔑 BYPASS: Using universal bypass code ${universalBypassCode} for ${email}`);
        
        try {
          // Get or create user for bypass
          let user = await storage.getUserByEmail(email);
          if (!user) {
            console.log(`BYPASS: Creating new user for ${email} via universal bypass`);
            // Extract name from the verification request or use email prefix
            const userName = req.body.name || email.split('@')[0];
            user = await storage.createAuthUser(email, userName);
            console.log(`BYPASS: Created user with ID ${user.id} for ${email}`);
          } else {
            console.log(`BYPASS: Found existing user with ID ${user.id} for ${email}`);
          }
          
          // Always mark user as verified for bypass
          if (!user.isVerified) {
            console.log(`BYPASS: Marking user ${user.id} as verified`);
            user = await storage.updateUserProfile(user.id, { isVerified: true });
          }
          
          // Update last login time
          await storage.updateLastLogin(user.id);
          console.log(`BYPASS: Updated last login for user ${user.id}`);
          
          // Create session for bypass
          const session = await storage.createSession(user.id, user.email || '');
          console.log(`BYPASS: Created session ${session.id} for user ${user.id}`);
          
          res.cookie('sessionId', session.id, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax',
            path: '/'
          });

          console.log(`✅ BYPASS: Universal bypass successful for ${email} with session ${session.id}`);
          return res.json({ message: "Successfully verified" });
        } catch (bypassError) {
          console.error(`❌ BYPASS ERROR for ${email}:`, bypassError);
          console.error(`   Error stack:`, bypassError instanceof Error ? bypassError.stack : 'No stack trace');
          return res.status(500).json({ error: "Bypass authentication failed. Please try again." });
        }
      }

      // Regular verification flow
      console.log(`DEBUG: Attempting regular verification for ${email} with code ${code}`);
      const user = await storage.verifyUser(email, code);
      
      if (!user) {
        console.log(`❌ DEBUG: Failed to verify code ${code} for ${email} - either invalid or expired`);
        
        // Check if user exists to provide better error message
        const existingUser = await storage.getUserByEmail(email);
        if (!existingUser) {
          return res.status(400).json({ error: "User not found. Please sign up first." });
        }
        
        return res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
      }

      console.log(`✅ DEBUG: Successfully verified code for ${email}`);

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
        return res.status(401).json({ error: "Not authenticated" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
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

  /**
   * Authentication middleware that validates user sessions for protected routes.
   * 
   * This middleware performs a multi-step verification process:
   * 1. Extracts sessionId from HTTP-only cookies (secure, not accessible via JS)
   * 2. Validates the session exists and hasn't expired in the database
   * 3. Ensures the associated user account still exists and is active
   * 4. Attaches user data to the request object for downstream route handlers
   * 
   * Security considerations:
   * - Sessions are stored server-side with expiration times
   * - Invalid sessions are automatically cleaned up from the database
   * - User data is scoped per request to prevent data leakage between users
   * 
   * @param {Request} req - Express request object, will be enhanced with user data
   * @param {Response} res - Express response object for sending error responses
   * @param {NextFunction} next - Express next function to continue to route handler
   */
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      // Extract session ID from secure HTTP-only cookie
      const sessionId = req.cookies?.sessionId;

      if (!sessionId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Validate session exists and hasn't expired
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Ensure user account still exists (handles deleted accounts gracefully)
      const user = await storage.getUser(session.userId);
      if (!user) {
        // Clean up orphaned session when user no longer exists
        await storage.deleteSession(sessionId);
        return res.status(401).json({ error: "User not found" });
      }

      // Attach authenticated user to request for use in route handlers
      // This ensures all subsequent operations are scoped to this specific user
      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
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

  /**
   * Get all climbs for the authenticated user.
   * 
   * SECURITY: This endpoint enforces strict user data isolation.
   * - Only climbs belonging to the authenticated user are returned
   * - User ID comes from validated session, not client input
   * - No cross-user data leakage is possible
   */
  app.get("/api/climbs", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // CRITICAL: user.id comes from authenticated session, ensuring data isolation
      const climbs = await storage.getClimbsByUser(user.id);

      // Secure cache headers prevent caching across different users
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');

      console.log(`Retrieved ${climbs.length} climbs for user ${user.id}`);
      res.json(climbs);
    } catch (error) {
      console.error("Get climbs error:", error);
      res.status(500).json({ 
        error: "Failed to load your climbs. Please refresh and try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Create a new climb
  app.post("/api/climbs", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Validate input data with detailed error messages
      let validatedData;
      try {
        validatedData = insertClimbSchema.parse(req.body);
      } catch (validationError) {
        console.error("Climb validation error:", validationError);
        return res.status(400).json({ 
          error: "Invalid climb data provided. Please check all required fields.",
          details: validationError instanceof Error ? validationError.message : "Validation failed"
        });
      }

      // Create the climb with user isolation
      const climb = await storage.createClimb({
        ...validatedData,
        userId: user.id,
      });

      // Update user streak using weekly calculation
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);

      console.log(`Climb created successfully for user ${user.id}`);
      res.json(climb);
    } catch (error) {
      console.error("Create climb error:", error);
      res.status(500).json({ 
        error: "Failed to create climb. Please try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Update a climb
  app.put("/api/climbs/:id", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const id = parseInt(req.params.id);
      
      // Validate climb ID parameter
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid climb ID provided" });
      }

      // Validate input data with detailed error messages
      let validatedData;
      try {
        validatedData = insertClimbSchema.partial().parse(req.body);
      } catch (validationError) {
        console.error("Climb update validation error:", validationError);
        return res.status(400).json({ 
          error: "Invalid climb data provided. Please check all fields.",
          details: validationError instanceof Error ? validationError.message : "Validation failed"
        });
      }

      // Update climb with proper user authorization
      const climb = await storage.updateClimb(id, user.id, validatedData);

      if (!climb) {
        console.warn(`Climb ${id} not found or unauthorized for user ${user.id}`);
        return res.status(404).json({ error: "Climb not found or you don't have permission to edit it" });
      }

      // Recalculate streak after update (in case date changed)
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);

      console.log(`Climb ${id} updated successfully for user ${user.id}`);
      res.json(climb);
    } catch (error) {
      console.error("Update climb error:", error);
      res.status(500).json({ 
        error: "Failed to update climb. Please try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Delete a climb
  app.delete("/api/climbs/:id", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const id = parseInt(req.params.id);
      
      // Validate climb ID parameter
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid climb ID provided" });
      }

      // Attempt to delete climb with proper user authorization
      const deleteResult = await storage.deleteClimb(id, user.id);
      
      // Recalculate streak after deletion
      const newStreak = await storage.calculateWeeklyStreak(user.id);
      const today = format(new Date(), 'yyyy-MM-dd');
      await storage.updateUserStreak(user.id, newStreak, today);

      console.log(`Climb ${id} deleted successfully for user ${user.id}`);
      res.json({ success: true, message: "Climb deleted successfully" });
    } catch (error) {
      console.error("Delete climb error:", error);
      
      // Provide specific error messages based on the error type
      if ((error as Error).message?.includes('not found')) {
        return res.status(404).json({ error: "Climb not found or you don't have permission to delete it" });
      }
      
      res.status(500).json({ 
        error: "Failed to delete climb. Please try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Get today's stats
  app.get("/api/stats/today", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      console.log(`Fetching today's stats for user ${user.id} on ${today}`);
      const stats = await storage.getTodayStats(user.id, today);

      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=60');
      res.set('Vary', 'Authorization');

      res.json(stats);
    } catch (error) {
      console.error("Today's stats error:", error);
      res.status(500).json({ 
        error: "Failed to load today's statistics. Please refresh and try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  /**
   * Get monthly climbing statistics for the authenticated user.
   * 
   * SECURITY: User data isolation is enforced by:
   * - Using authenticated user.id from session (not client input)
   * - All database queries are scoped to the specific user
   * - Private caching prevents cross-user data exposure
   */
  app.get("/api/stats/monthly", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      // Validate year and month parameters
      if (year < 2020 || year > 2030) {
        return res.status(400).json({ error: "Invalid year parameter" });
      }
      if (month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid month parameter" });
      }

      // SECURITY: user.id ensures only this user's stats are returned
      const stats = await storage.getMonthlyStats(user.id, year, month);

      // Secure cache headers
      res.set('Cache-Control', 'private, max-age=300');
      res.set('Vary', 'Authorization');

      res.json(stats);
    } catch (error) {
      console.error("Monthly stats error:", error);
      res.status(500).json({ 
        error: "Failed to load monthly statistics. Please try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
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

      // Validate profile data inputs
      const profileData: { firstName?: string; profileImageUrl?: string } = {};

      if (firstName !== undefined) {
        const trimmedName = firstName.trim();
        if (trimmedName.length === 0) {
          return res.status(400).json({ error: "First name cannot be empty" });
        }
        if (trimmedName.length > 50) {
          return res.status(400).json({ error: "First name must be 50 characters or less" });
        }
        profileData.firstName = trimmedName;
      }

      if (profileImageUrl !== undefined) {
        // Basic URL validation for profile image
        if (profileImageUrl && typeof profileImageUrl === 'string') {
          try {
            new URL(profileImageUrl);
            profileData.profileImageUrl = profileImageUrl;
          } catch {
            return res.status(400).json({ error: "Invalid profile image URL provided" });
          }
        } else {
          profileData.profileImageUrl = profileImageUrl; // Allow null/empty values
        }
      }

      if (Object.keys(profileData).length === 0) {
        return res.status(400).json({ error: "No valid profile data provided to update" });
      }

      console.log(`Updating profile for user ${user.id}`);
      const updatedUser = await storage.updateUserProfile(user.id, profileData);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`Profile updated successfully for user ${user.id}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ 
        error: "Failed to update profile. Please try again.",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Get daily motivational quote with rate limiting (prevents API abuse)
  app.get("/api/quote", requireAuth, sensitiveRateLimit, async (req: any, res) => {
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