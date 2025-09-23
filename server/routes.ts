import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReviewSchema, insertReportSchema, insertAdminMessageSchema, insertMenuItemSchema, insertUserSchema, insertReviewReportSchema, reviews, bannedDevices, users, User } from "@shared/schema";
import { randomUUID } from "crypto";
import { menuScraper } from "./scraper";
import jwt from "jsonwebtoken";
import { moderationProvider, createDeviceHash } from "./moderation";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Helper function to compute displayName from firstName and lastName
function computeDisplayName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";
  
  if (first && last) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  } else {
    return "Anonymous User";
  }
}

// Helper function to parse displayName into firstName and lastName
function parseDisplayName(displayName: string): { firstName: string | null, lastName: string | null } {
  if (!displayName || displayName.trim() === "" || displayName === "Anonymous User") {
    return { firstName: null, lastName: null };
  }
  
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  } else if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  } else {
    return { firstName: null, lastName: null };
  }
}

// Extend Express Request types
interface AdminRequest extends Request {
  admin?: any;
}

interface UserRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
  } | User;
}

function generateDeviceId(req: any): string {
  // Simple device fingerprint based on headers and IP
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.connection.remoteAddress || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  
  // Create a hash-like string (not cryptographically secure, just for basic spam prevention)
  const fingerprint = Buffer.from(`${userAgent}-${ip}-${acceptLanguage}`).toString("base64");
  return fingerprint.substring(0, 32);
}

// JWT secret key - required in production for admin auth
const JWT_SECRET = process.env.JWT_SECRET;
const isDev = process.env.NODE_ENV === 'development';

if (!JWT_SECRET && !isDev) {
  console.error("CRITICAL: JWT_SECRET required in production for admin authentication");
  process.exit(1);
}

// Use dev secret only in development
const jwtSecret = JWT_SECRET || 'dev-jwt-secret-key';

// Type assertion for TypeScript since we verified it exists or defaulted
const verifiedJwtSecret: string = jwtSecret;
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

// User authentication middleware using JWT
function requireUser(req: UserRequest, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, verifiedJwtSecret) as any;
    
    // Verify this is a user token
    if (decoded.type !== 'user') {
      return res.status(401).json({ error: "Invalid user token" });
    }
    
    // Attach user info to request - compute displayName from firstName and lastName
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      displayName: computeDisplayName(decoded.firstName, decoded.lastName),
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired. Please sign in again." });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      return res.status(401).json({ error: "Token verification failed" });
    }
  }
}

// Secure admin authentication middleware using JWT
function requireAdmin(req: AdminRequest, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, verifiedJwtSecret) as any;
    
    // Verify this is an admin token
    if (decoded.type !== 'admin') {
      return res.status(401).json({ error: "Invalid admin token" });
    }
    
    // Attach admin info to request for potential future use
    req.admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Admin token expired. Please login again." });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid admin token" });
    } else {
      return res.status(401).json({ error: "Token verification failed" });
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit authentication with OAuth providers
  const { setupAuth, isAuthenticated } = await import('./replitAuth');
  await setupAuth(app);
  
  // Set up email service
  const { sendVerificationCode } = await import('./sendgrid');

  // Replit Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Sign up - send verification code
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, displayName } = req.body;
      
      if (!email || !displayName) {
        return res.status(400).json({ error: "Email and display name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code (use existing emailCodes table)
      await storage.createEmailCode({
        email: email.toLowerCase(),
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      
      // Send verification email
      const emailSent = await sendVerificationCode(email, code);
      
      // Store user data temporarily in session for after verification
      (req.session as any).pendingUser = { email, displayName };
      
      // In development mode, include the code for testing
      const response: any = {
        message: "Verification code sent to your email",
        needsVerification: true,
        emailSent,
      };
      
      if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
        response.devCode = code;
        console.log(`🔑 Verification code for ${email}: ${code}`);
      }
      
      res.json(response);
    } catch (error: any) {
      console.error("User signup error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });
  
  // Verify code and complete signup
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }
      
      // Verify the code
      const isValid = await storage.verifyEmailCode(email, code);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }
      
      // Get pending user data from session
      const pendingUser = (req.session as any)?.pendingUser;
      if (!pendingUser || pendingUser.email !== email) {
        return res.status(400).json({ error: "No pending signup found for this email" });
      }
      
      // Create the user
      const user = await storage.createUser({
        email: email.toLowerCase(),
        displayName: pendingUser.displayName,
      });
      
      // Set session
      (req.session as any).userId = user.id;
      delete (req.session as any).pendingUser;
      
      res.status(201).json({
        user,
        message: "Account created and verified successfully",
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Failed to verify account" });
    }
  });

  // Sign in with email
  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "No account found with this email" });
      }
      
      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        user,
        message: "Signed in successfully",
      });
    } catch (error: any) {
      console.error("User signin error:", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });

  // Sign out
  app.post('/api/auth/signout', (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to sign out' });
      }
      res.json({ message: 'Signed out successfully' });
    });
  });

  // Helper function to get current meal period in America/Chicago timezone
  function getCurrentMealPeriod(): string {
    // Get current time in America/Chicago timezone (handles CDT/CST automatically)
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60; // Convert to decimal hours
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's Friday (5) for different dinner hours
    const dinnerEnd = dayOfWeek === 5 ? 20 : 21; // 8 PM Friday, 9 PM other days
    
    if (hour >= 7 && hour < 9.5) {
      return "breakfast";
    } else if (hour >= 11 && hour < 14) {
      return "lunch";
    } else if (hour >= 14 && hour < 16) {
      return "liteDinner";
    } else if (hour >= 17 && hour < dinnerEnd) {
      return "dinner";
    } else {
      // Default to next meal period if outside operating hours
      if (hour < 7) return "breakfast";
      if (hour < 11) return "lunch";
      if (hour < 17) return "dinner";
      return "breakfast"; // After dinner, show tomorrow's breakfast
    }
  }

  // Menu Items Routes
  app.get("/api/menu/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const { meal, current } = req.query;
      
      let menuItems = await storage.getMenuItemsByDate(date);
      
      // Apply meal period filtering if requested
      if (current === 'true') {
        const currentMeal = getCurrentMealPeriod();
        menuItems = menuItems.filter(item => {
          // Map lite dinner to dinner for frontend display
          const itemMeal = item.mealPeriod === "liteDinner" ? "dinner" : item.mealPeriod;
          const targetMeal = currentMeal === "liteDinner" ? "dinner" : currentMeal;
          return itemMeal === targetMeal;
        });
      } else if (meal) {
        menuItems = menuItems.filter(item => {
          // Map lite dinner to dinner for frontend display
          const itemMeal = item.mealPeriod === "liteDinner" ? "dinner" : item.mealPeriod;
          return itemMeal === meal;
        });
      }
      
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-item/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const menuItem = await storage.getMenuItemById(id);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      res.status(500).json({ error: "Failed to fetch menu item" });
    }
  });

  // Reviews Routes
  app.get("/api/reviews/:menuItemId", async (req, res) => {
    try {
      const { menuItemId } = req.params;
      const reviews = await storage.getReviewsForMenuItem(menuItemId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const reviews = await storage.getRecentReviews(limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      res.status(500).json({ error: "Failed to fetch recent reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const deviceId = generateDeviceId(req);
      const deviceIdHash = createDeviceHash(deviceId);
      
      // Get authenticated user if available
      let userId = null;
      if ((req.session as any)?.userId) {
        userId = (req.session as any).userId;
      }
      
      // Check if device is banned
      const isBanned = await storage.isBannedDevice(deviceIdHash);
      if (isBanned) {
        return res.status(403).json({ 
          error: "Your device has been temporarily restricted from posting reviews. Please contact support if you believe this is an error." 
        });
      }

      // Use deviceIdHash instead of raw deviceId for privacy
      const reviewData = { ...req.body, deviceId: deviceIdHash };
      
      // Validate the request body
      const validated = insertReviewSchema.parse(reviewData);
      
      // Run content moderation on the review text
      let moderationResult = null;
      if (validated.text && validated.text.trim()) {
        moderationResult = await moderationProvider.checkText(validated.text, 'review');
        console.log(`Moderation result for review: ${moderationResult.action} - ${moderationResult.reason}`);
      }

      // Determine moderation status based on AI result
      let moderationStatus: 'approved' | 'pending' | 'rejected' = 'approved';
      if (moderationResult) {
        switch (moderationResult.action) {
          case 'approved':
            moderationStatus = 'approved';
            break;
          case 'shadow':
            moderationStatus = 'pending'; // Shadow-banned reviews go to pending queue
            break;
          case 'rejected':
            moderationStatus = 'rejected';
            
            // For rejected content, we still create the review for audit purposes but don't return it to user
            const rejectedReviewToCreate = {
              ...validated,
              deviceId: deviceIdHash,
              moderationStatus: 'rejected',
              moderationScores: moderationResult.scores,
              flaggedReason: moderationResult.reason,
            };

            const rejectedReview = await storage.createReview(rejectedReviewToCreate);
            
            // Check if device is already banned to prevent duplicate ban crash
            const existingBan = await storage.getBannedDevice(deviceIdHash);
            if (!existingBan) {
              // For rejected content, ban the device temporarily only if not already banned
              await storage.banDevice({
                deviceIdHash,
                reason: `Auto-ban: ${moderationResult.reason}`,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour ban
              });
            }
            
            // Log the moderation event with proper review ID for audit trail
            await storage.logModerationEvent({
              contentType: 'review',
              contentId: rejectedReview.id, // Use proper review ID for audit trail
              deviceIdHash,
              scores: moderationResult.scores,
              action: 'rejected',
              reason: moderationResult.reason,
            });

            return res.status(400).json({ 
              error: "Your review contains inappropriate content and cannot be posted. Your account has been temporarily restricted." 
            });
        }
      }

      // Create the review with moderation data and user association
      const reviewToCreate = {
        ...validated,
        userId, // Associate with authenticated user if available
        deviceId: userId ? null : deviceIdHash, // Only use deviceId if no user
        moderationStatus,
        moderationScores: moderationResult ? moderationResult.scores : null,
        flaggedReason: moderationResult?.action === 'shadow' ? moderationResult.reason : null,
      };

      const review = await storage.createReview(reviewToCreate);
      
      // Log moderation event for approved/pending reviews
      if (moderationResult) {
        await storage.logModerationEvent({
          contentType: 'review',
          contentId: review.id,
          deviceIdHash,
          scores: moderationResult.scores,
          action: moderationResult.action,
          reason: moderationResult.reason,
        });
      }

      // For pending reviews, inform user their review is under review
      if (moderationStatus === 'pending') {
        return res.status(201).json({
          ...review,
          message: "Your review has been submitted and is under review. It will appear once approved."
        });
      }

      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid review data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Reports Routes
  app.post("/api/reports", async (req, res) => {
    try {
      const deviceId = generateDeviceId(req);
      const deviceIdHash = createDeviceHash(deviceId);
      const reportData = { ...req.body, deviceId: deviceIdHash };
      
      // Validate the request body
      const validated = insertReportSchema.parse(reportData);
      
      const report = await storage.createReport(validated);
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating report:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid report data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/reports/open", async (req, res) => {
    try {
      const reports = await storage.getOpenReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching open reports:", error);
      res.status(500).json({ error: "Failed to fetch open reports" });
    }
  });

  // Scraper Routes - now require admin authentication for security
  app.post("/api/scrape/run", requireAdmin, async (req, res) => {
    try {
      console.log("Manual scrape triggered by admin");
      await menuScraper.runDailyScrape();
      res.json({ 
        success: true, 
        message: "Scrape completed successfully" 
      });
    } catch (error) {
      console.error("Manual scrape failed:", error);
      res.status(500).json({ 
        error: "Scrape failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/scrape/runs", async (req, res) => {
    try {
      const runs = await storage.getRecentScrapeRuns(10);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching scrape runs:", error);
      res.status(500).json({ error: "Failed to fetch scrape runs" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  });

  // Initialize with sample data on first run
  app.get("/api/init", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingItems = await storage.getMenuItemsByDate(today);
      
      if (existingItems.length === 0) {
        console.log("No menu items found, running initial scrape...");
        await menuScraper.runDailyScrape();
        res.json({ 
          message: "Initialized with sample menu data",
          date: today
        });
      } else {
        res.json({ 
          message: "Menu data already exists",
          date: today,
          itemCount: existingItems.length
        });
      }
    } catch (error) {
      console.error("Initialization failed:", error);
      res.status(500).json({ error: "Failed to initialize" });
    }
  });

  // ========== USER AUTHENTICATION ROUTES ==========
  
  // User signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(validatedData);
      
      // Generate JWT token using firstName and lastName
      const token = jwt.sign(
        {
          type: 'user',
          userId: user.id,
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          iat: Math.floor(Date.now() / 1000),
        },
        verifiedJwtSecret,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: computeDisplayName(user.firstName, user.lastName),
          bio: user.bio,
          createdAt: user.createdAt,
        },
        message: "Account created successfully",
        expiresIn: JWT_EXPIRES_IN,
      });
    } catch (error: any) {
      console.error("User signup error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid signup data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // User signin
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email - handle null email
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "No account found with this email" });
      }
      
      // Generate JWT token using firstName and lastName
      const token = jwt.sign(
        {
          type: 'user',
          userId: user.id,
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          iat: Math.floor(Date.now() / 1000),
        },
        verifiedJwtSecret,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: computeDisplayName(user.firstName, user.lastName),
          bio: user.bio,
          createdAt: user.createdAt,
        },
        message: "Signed in successfully",
        expiresIn: JWT_EXPIRES_IN,
      });
    } catch (error: any) {
      console.error("User signin error:", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });

  // User profile routes
  app.get("/api/auth/profile", requireUser, async (req: UserRequest, res: Response) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const stats = await storage.getUserStats(req.user!.id);
      const recentActivity = await storage.getUserRecentActivity(req.user!.id);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: computeDisplayName(user.firstName, user.lastName),
          bio: user.bio,
          createdAt: user.createdAt,
        },
        stats,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/auth/profile", requireUser, async (req: UserRequest, res: Response) => {
    try {
      const { displayName, bio } = req.body;
      
      // Parse displayName into firstName and lastName if provided
      let updateData: any = { bio };
      if (displayName !== undefined) {
        const { firstName, lastName } = parseDisplayName(displayName);
        updateData.firstName = firstName;
        updateData.lastName = lastName;
      }
      
      // Update user profile
      await storage.updateUser(req.user!.id, updateData);
      
      // Fetch updated user
      const updatedUser = await storage.getUserById(req.user!.id);
      
      res.json({
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          displayName: computeDisplayName(updatedUser!.firstName, updatedUser!.lastName),
          bio: updatedUser!.bio,
          createdAt: updatedUser!.createdAt,
        },
        message: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Simplified review reporting route (works without authentication for now)
  app.post("/api/review-reports", async (req, res) => {
    try {
      const { reviewId, reason, details } = req.body;
      
      if (!reviewId || !reason) {
        return res.status(400).json({ error: "Review ID and reason are required" });
      }
      
      const deviceId = generateDeviceId(req);
      const deviceIdHash = createDeviceHash(deviceId);
      
      const reportData = {
        reviewId,
        reportedByDeviceId: deviceIdHash, // Use device ID until auth is implemented
        reason: reason.trim(),
      };
      
      // Use the correct schema for review reports
      const validated = insertReviewReportSchema.parse(reportData);
      const report = await storage.createReviewReport(validated);
      
      res.status(201).json({
        ...report,
        message: "Review reported successfully. It has been hidden and will be reviewed by moderators.",
      });
    } catch (error: any) {
      console.error("Error creating review report:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid report data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Review reports route (for authenticated users when auth is implemented)
  app.post("/api/reviews/:reviewId/report", requireUser, async (req: UserRequest, res) => {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Report reason is required" });
      }
      
      const reportData = {
        reviewId,
        reportedByUserId: req.user!.id,
        reason: reason.trim(),
      };
      
      const report = await storage.createReviewReport(reportData);
      
      res.status(201).json({
        ...report,
        message: "Review reported successfully. It has been hidden and will be reviewed by moderators.",
      });
    } catch (error: any) {
      console.error("Error reporting review:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid report data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to report review" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Admin authentication - secure JWT implementation
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return res.status(500).json({ error: "Admin password not configured. Please set ADMIN_PASSWORD in Replit Secrets." });
      }
      
      if (password !== adminPassword) {
        return res.status(401).json({ error: "Invalid admin password" });
      }
      
      // Generate secure JWT token
      const token = jwt.sign(
        {
          type: 'admin',
          iat: Math.floor(Date.now() / 1000),
          // Add additional claims if needed
        },
        verifiedJwtSecret,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.json({ 
        token,
        message: "Admin authentication successful",
        expiresIn: JWT_EXPIRES_IN 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin token validation endpoint
  app.get("/api/admin/validate", requireAdmin, (req: AdminRequest, res) => {
    res.json({ 
      valid: true, 
      admin: req.admin,
      message: "Token is valid" 
    });
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAppStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Manual menu item management
  app.post("/api/admin/menu-items", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(validatedData);
      res.json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.post("/api/admin/menu-items/bulk", requireAdmin, async (req, res) => {
    try {
      const { items } = req.body;
      const validatedItems = items.map((item: any) => insertMenuItemSchema.parse(item));
      const menuItems = await storage.bulkCreateMenuItems(validatedItems);
      res.json(menuItems);
    } catch (error) {
      console.error("Error bulk creating menu items:", error);
      res.status(500).json({ error: "Failed to create menu items" });
    }
  });

  // Public endpoint for fetching active admin messages (for users to see)
  app.get("/api/messages", async (req, res) => {
    try {
      const { page } = req.query;
      const messages = await storage.getActiveAdminMessages(page as string);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Admin message management
  app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getAllAdminMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAdminMessageSchema.parse(req.body);
      const message = await storage.createAdminMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating admin message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.put("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await storage.updateAdminMessage(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating admin message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdminMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting admin message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Admin report management
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getOpenReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.put("/api/admin/reports/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.resolveReport(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  // Admin review management
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const reviews = await storage.getAllReviews(limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReview(id);
      res.json({ 
        success: true,
        message: "Review deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Content moderation admin routes
  app.get("/api/admin/moderation/pending", requireAdmin, async (req, res) => {
    try {
      const pendingReviews = await storage.getPendingReviews();
      res.json(pendingReviews);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ error: "Failed to fetch pending reviews" });
    }
  });

  app.post("/api/admin/moderation/approve/:reviewId", requireAdmin, async (req, res) => {
    try {
      const { reviewId } = req.params;
      
      // Update review status to approved
      await db.update(reviews)
        .set({ 
          moderationStatus: 'approved',
          flaggedReason: null 
        })
        .where(eq(reviews.id, reviewId));

      // Log moderation event
      await storage.logModerationEvent({
        contentType: 'review',
        contentId: reviewId,
        action: 'approve',
        reason: 'Manually approved by admin',
        adminId: 'admin'
      });

      res.json({ 
        success: true,
        message: "Review approved successfully" 
      });
    } catch (error) {
      console.error("Error approving review:", error);
      res.status(500).json({ error: "Failed to approve review" });
    }
  });

  app.post("/api/admin/moderation/reject/:reviewId", requireAdmin, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { reason, banDevice } = req.body;
      
      // Update review status to rejected
      await db.update(reviews)
        .set({ 
          moderationStatus: 'rejected',
          flaggedReason: reason || 'Rejected by admin'
        })
        .where(eq(reviews.id, reviewId));

      // Get review to find device hash
      const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
      if (review && banDevice && review.deviceId) {
        const deviceIdHash = createDeviceHash(review.deviceId);
        await storage.banDevice({
          deviceIdHash,
          reason: reason || 'Rejected content by admin',
          strikes: 1,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day ban
        });
      }

      // Log moderation event
      await storage.logModerationEvent({
        contentType: 'review',
        contentId: reviewId,
        action: 'reject',
        reason: reason || 'Manually rejected by admin',
        adminId: 'admin'
      });

      res.json({ 
        success: true,
        message: "Review rejected successfully" 
      });
    } catch (error) {
      console.error("Error rejecting review:", error);
      res.status(500).json({ error: "Failed to reject review" });
    }
  });

  app.get("/api/admin/moderation/banned", requireAdmin, async (req, res) => {
    try {
      const bannedDevicesList = await db.select().from(bannedDevices).orderBy(desc(bannedDevices.createdAt));
      res.json(bannedDevicesList);
    } catch (error) {
      console.error("Error fetching banned devices:", error);
      res.status(500).json({ error: "Failed to fetch banned devices" });
    }
  });

  app.delete("/api/admin/moderation/unban/:deviceIdHash", requireAdmin, async (req, res) => {
    try {
      const { deviceIdHash } = req.params;
      await storage.unbanDevice(deviceIdHash);

      // Log moderation event
      await storage.logModerationEvent({
        contentType: 'device',
        contentId: deviceIdHash,
        deviceIdHash,
        action: 'unban',
        reason: 'Unbanned by admin',
        adminId: 'admin'
      });

      res.json({ 
        success: true,
        message: "Device unbanned successfully" 
      });
    } catch (error) {
      console.error("Error unbanning device:", error);
      res.status(500).json({ error: "Failed to unban device" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
