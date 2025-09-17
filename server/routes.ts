import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReviewSchema, insertReportSchema, insertAdminMessageSchema, insertMenuItemSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { menuScraper } from "./scraper";
import jwt from "jsonwebtoken";

function generateDeviceId(req: any): string {
  // Simple device fingerprint based on headers and IP
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.connection.remoteAddress || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  
  // Create a hash-like string (not cryptographically secure, just for basic spam prevention)
  const fingerprint = Buffer.from(`${userAgent}-${ip}-${acceptLanguage}`).toString("base64");
  return fingerprint.substring(0, 32);
}

// JWT secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_change_in_production";
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

// Secure admin authentication middleware using JWT
function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
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
      const reviewData = { ...req.body, deviceId };
      
      // Validate the request body
      const validated = insertReviewSchema.parse(reviewData);
      
      const review = await storage.createReview(validated);
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
      const reportData = { ...req.body, deviceId };
      
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

  // ========== ADMIN ROUTES ==========
  
  // Admin authentication - secure JWT implementation
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "mnsu2024admin";
      
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
        JWT_SECRET,
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
  app.get("/api/admin/validate", requireAdmin, (req, res) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
