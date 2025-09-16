import { 
  type MenuItem, 
  type InsertMenuItem, 
  type Review, 
  type InsertReview,
  type Report,
  type InsertReport,
  type ScrapeRun,
  type InsertScrapeRun,
  menuItems,
  reviews,
  reports,
  scrapeRuns
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // Menu Items
  getMenuItemsByDate(date: string): Promise<MenuItem[]>;
  getMenuItemById(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  bulkCreateMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]>;
  
  // Reviews  
  getReviewsForMenuItem(menuItemId: string): Promise<Review[]>;
  getRecentReviews(limit?: number): Promise<(Review & { menuItem: MenuItem })[]>;
  createReview(review: InsertReview): Promise<Review>;
  flagReview(id: string): Promise<void>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getOpenReports(): Promise<(Report & { menuItem: MenuItem })[]>;
  resolveReport(id: string): Promise<void>;
  
  // Scrape Runs
  createScrapeRun(run: InsertScrapeRun): Promise<ScrapeRun>;
  updateScrapeRun(id: string, updates: Partial<ScrapeRun>): Promise<void>;
  getRecentScrapeRuns(limit?: number): Promise<ScrapeRun[]>;
}

export class DatabaseStorage implements IStorage {
  // Menu Items
  async getMenuItemsByDate(date: string): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.date, date));
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item as any).returning();
    return created;
  }

  async bulkCreateMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]> {
    if (items.length === 0) return [];
    return await db.insert(menuItems).values(items as any).returning();
  }

  // Reviews
  async getReviewsForMenuItem(menuItemId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.menuItemId, menuItemId))
      .orderBy(desc(reviews.createdAt));
  }

  async getRecentReviews(limit = 20): Promise<(Review & { menuItem: MenuItem })[]> {
    const results = await db
      .select({
        id: reviews.id,
        menuItemId: reviews.menuItemId,
        rating: reviews.rating,
        emoji: reviews.emoji,
        text: reviews.text,
        photoUrl: reviews.photoUrl,
        deviceId: reviews.deviceId,
        isFlagged: reviews.isFlagged,
        createdAt: reviews.createdAt,
        menuItem: menuItems,
      })
      .from(reviews)
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .where(eq(reviews.isFlagged, false))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
      
    return results as (Review & { menuItem: MenuItem })[];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async flagReview(id: string): Promise<void> {
    await db
      .update(reviews)
      .set({ isFlagged: true })
      .where(eq(reviews.id, id));
  }

  // Reports
  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async getOpenReports(): Promise<(Report & { menuItem: MenuItem })[]> {
    const results = await db
      .select({
        id: reports.id,
        menuItemId: reports.menuItemId,
        issueType: reports.issueType,
        issueText: reports.issueText,
        deviceId: reports.deviceId,
        status: reports.status,
        createdAt: reports.createdAt,
        menuItem: menuItems,
      })
      .from(reports)
      .innerJoin(menuItems, eq(reports.menuItemId, menuItems.id))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt));
      
    return results as (Report & { menuItem: MenuItem })[];
  }

  async resolveReport(id: string): Promise<void> {
    await db
      .update(reports)
      .set({ status: "resolved" })
      .where(eq(reports.id, id));
  }

  // Scrape Runs
  async createScrapeRun(run: InsertScrapeRun): Promise<ScrapeRun> {
    const [created] = await db.insert(scrapeRuns).values(run as any).returning();
    return created;
  }

  async updateScrapeRun(id: string, updates: Partial<Omit<ScrapeRun, 'id'>>): Promise<void> {
    await db
      .update(scrapeRuns)
      .set(updates)
      .where(eq(scrapeRuns.id, id));
  }

  async getRecentScrapeRuns(limit = 10): Promise<ScrapeRun[]> {
    return await db
      .select()
      .from(scrapeRuns)
      .orderBy(desc(scrapeRuns.startedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
