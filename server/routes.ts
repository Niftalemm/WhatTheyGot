import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReviewSchema, insertReportSchema } from "@shared/schema";
import { randomUUID } from "crypto";

function generateDeviceId(req: any): string {
  // Simple device fingerprint based on headers and IP
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.connection.remoteAddress || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  
  // Create a hash-like string (not cryptographically secure, just for basic spam prevention)
  const fingerprint = Buffer.from(`${userAgent}-${ip}-${acceptLanguage}`).toString("base64");
  return fingerprint.substring(0, 32);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Menu Items Routes
  app.get("/api/menu/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const menuItems = await storage.getMenuItemsByDate(date);
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
