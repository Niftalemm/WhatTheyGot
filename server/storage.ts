import { 
  type MenuItem, 
  type InsertMenuItem, 
  type Review, 
  type InsertReview,
  type Report,
  type InsertReport,
  type ScrapeRun,
  type InsertScrapeRun,
  type AdminMessage,
  type InsertAdminMessage,
  menuItems,
  reviews,
  reports,
  scrapeRuns,
  adminMessages
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
  getAllReviews(limit?: number): Promise<(Review & { menuItem: MenuItem })[]>;
  createReview(review: InsertReview): Promise<Review>;
  flagReview(id: string): Promise<void>;
  deleteReview(id: string): Promise<void>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getOpenReports(): Promise<(Report & { menuItem: MenuItem })[]>;
  resolveReport(id: string): Promise<void>;
  
  // Scrape Runs
  createScrapeRun(run: InsertScrapeRun): Promise<ScrapeRun>;
  updateScrapeRun(id: string, updates: Partial<ScrapeRun>): Promise<void>;
  getRecentScrapeRuns(limit?: number): Promise<ScrapeRun[]>;
  
  // Admin Messages
  createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage>;
  getActiveAdminMessages(page?: string): Promise<AdminMessage[]>;
  getAllAdminMessages(): Promise<AdminMessage[]>;
  updateAdminMessage(id: string, updates: Partial<AdminMessage>): Promise<void>;
  deleteAdminMessage(id: string): Promise<void>;
  
  // Admin Analytics
  getAppStats(): Promise<{
    totalReviews: number;
    totalMenuItems: number;
    totalReports: number;
    recentActivity: any[];
  }>;
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

  async deleteReview(id: string): Promise<void> {
    await db
      .delete(reviews)
      .where(eq(reviews.id, id));
  }

  async getAllReviews(limit = 100): Promise<(Review & { menuItem: MenuItem })[]> {
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
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
      
    return results as (Review & { menuItem: MenuItem })[];
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

  // Admin Messages
  async createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage> {
    const [created] = await db.insert(adminMessages).values(message as any).returning();
    return created;
  }

  async getActiveAdminMessages(page?: string): Promise<AdminMessage[]> {
    let query = db
      .select()
      .from(adminMessages)
      .where(eq(adminMessages.isActive, true))
      .orderBy(desc(adminMessages.createdAt));
    
    const messages = await query;
    
    if (page) {
      return messages.filter(msg => 
        msg.showOn && (msg.showOn.includes('all') || msg.showOn.includes(page))
      );
    }
    
    return messages;
  }

  async getAllAdminMessages(): Promise<AdminMessage[]> {
    return await db
      .select()
      .from(adminMessages)
      .orderBy(desc(adminMessages.createdAt));
  }

  async updateAdminMessage(id: string, updates: Partial<AdminMessage>): Promise<void> {
    await db
      .update(adminMessages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminMessages.id, id));
  }

  async deleteAdminMessage(id: string): Promise<void> {
    await db.delete(adminMessages).where(eq(adminMessages.id, id));
  }

  // Admin Analytics
  async getAppStats(): Promise<{
    totalReviews: number;
    totalMenuItems: number;
    totalReports: number;
    recentActivity: any[];
  }> {
    // Get totals
    const totalReviews = await db.select().from(reviews).then(rows => rows.length);
    const totalMenuItems = await db.select().from(menuItems).then(rows => rows.length);
    const totalReports = await db.select().from(reports).then(rows => rows.length);
    
    // Get recent activity (reviews, reports)
    const recentReviews = await db
      .select({
        id: reviews.id,
        content: reviews.text,
        rating: reviews.rating,
        createdAt: reviews.createdAt,
        menuItemId: reviews.menuItemId
      })
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    const recentReportsData = await db
      .select({
        id: reports.id,
        content: reports.issueText,
        issueType: reports.issueType,
        createdAt: reports.createdAt,
        menuItemId: reports.menuItemId
      })
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(10);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentReviews.map(r => ({ ...r, type: 'review' })),
      ...recentReportsData.map(r => ({ ...r, type: 'report' }))
    ]
      .sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime())
      .slice(0, 15);

    return {
      totalReviews,
      totalMenuItems,
      totalReports,
      recentActivity
    };
  }
}

export const storage = new DatabaseStorage();
