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
  type BannedDevice,
  type InsertBannedDevice,
  type ModerationEvent,
  type InsertModerationEvent,
  type User,
  type InsertUser,
  type EmailCode,
  type InsertEmailCode,
  type ReviewReport,
  type InsertReviewReport,
  menuItems,
  reviews,
  reports,
  scrapeRuns,
  adminMessages,
  bannedDevices,
  moderationEvents,
  users,
  emailCodes,
  reviewReports
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  getUserStats(userId: string): Promise<{
    reviewsPosted: number;
    averageRating: number;
    photosShared: number;
    reportsSubmitted: number;
  }>;
  getUserRecentActivity(userId: string, limit?: number): Promise<any[]>;
  
  // Email Verification
  createEmailCode(codeData: InsertEmailCode): Promise<EmailCode>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  cleanupExpiredCodes(): Promise<void>;
  
  // Menu Items
  getMenuItemsByDate(date: string): Promise<MenuItem[]>;
  getMenuItemById(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  bulkCreateMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]>;
  
  // Reviews  
  getReviewsForMenuItem(menuItemId: string): Promise<Review[]>;
  getRecentReviews(limit?: number): Promise<(Review & { menuItem: MenuItem; user?: User })[]>;
  getAllReviews(limit?: number): Promise<(Review & { menuItem: MenuItem })[]>;
  createReview(review: InsertReview): Promise<Review>;
  flagReview(id: string): Promise<void>;
  deleteReview(id: string): Promise<void>;
  hideReview(id: string): Promise<void>;
  restoreReview(id: string): Promise<void>;
  
  // Review Reports
  createReviewReport(report: InsertReviewReport): Promise<ReviewReport>;
  getReviewReports(status?: string): Promise<(ReviewReport & { review: Review & { menuItem: MenuItem } })[]>;
  
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
  
  // Content Moderation
  isBannedDevice(deviceIdHash: string): Promise<boolean>;
  getBannedDevice(deviceIdHash: string): Promise<BannedDevice | undefined>;
  banDevice(ban: InsertBannedDevice): Promise<BannedDevice>;
  unbanDevice(deviceIdHash: string): Promise<void>;
  logModerationEvent(event: InsertModerationEvent): Promise<ModerationEvent>;
  getPendingReviews(): Promise<(Review & { menuItem: MenuItem })[]>;
  
  // Admin Analytics
  getAppStats(): Promise<{
    totalReviews: number;
    totalMenuItems: number;
    totalReports: number;
    recentActivity: any[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Ensure email is stored in lowercase for consistency
    const userData = { ...user, email: user.email.toLowerCase() };
    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, id));
  }

  async getUserStats(userId: string): Promise<{
    reviewsPosted: number;
    averageRating: number;
    photosShared: number;
    reportsSubmitted: number;
  }> {
    const userReviews = await db.select().from(reviews).where(eq(reviews.userId, userId));
    const averageRating = userReviews.length > 0 
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
      : 0;
    const photosShared = userReviews.filter(r => r.photoUrl).length;
    
    const userReports = await db.select().from(reviewReports).where(eq(reviewReports.reportedByUserId, userId));
    
    return {
      reviewsPosted: userReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      photosShared,
      reportsSubmitted: userReports.length,
    };
  }

  async getUserRecentActivity(userId: string, limit = 10): Promise<any[]> {
    const userReviews = await db
      .select({
        id: reviews.id,
        type: sql`'review'`.as('type'),
        itemName: menuItems.itemName,
        rating: reviews.rating,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    return userReviews.map(r => ({
      id: r.id,
      type: r.type,
      itemName: r.itemName,
      rating: r.rating,
      timeAgo: new Date(Date.now() - new Date(r.createdAt).getTime()).toISOString(),
    }));
  }

  // Email Verification
  async createEmailCode(codeData: InsertEmailCode): Promise<EmailCode> {
    // Ensure email is stored in lowercase for consistency
    const normalizedData = { ...codeData, email: codeData.email.toLowerCase() };
    const [created] = await db.insert(emailCodes).values(normalizedData).returning();
    return created;
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const [emailCode] = await db
      .select()
      .from(emailCodes)
      .where(
        and(
          eq(emailCodes.email, email.toLowerCase()),
          eq(emailCodes.code, code),
          eq(emailCodes.isUsed, false),
          gte(emailCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!emailCode) {
      return false;
    }

    // Mark the code as used
    await db
      .update(emailCodes)
      .set({ isUsed: true })
      .where(eq(emailCodes.id, emailCode.id));

    return true;
  }

  async cleanupExpiredCodes(): Promise<void> {
    const now = new Date();
    await db
      .delete(emailCodes)
      .where(sql`${emailCodes.expiresAt} <= ${now}`);
  }

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
      .where(
        and(
          eq(reviews.menuItemId, menuItemId),
          eq(reviews.isHidden, false), // Only show non-hidden reviews
          eq(reviews.isFlagged, false),
          eq(reviews.moderationStatus, 'approved') // Only return approved reviews
        )
      )
      .orderBy(desc(reviews.createdAt));
  }

  async getRecentReviews(limit = 20): Promise<(Review & { menuItem: MenuItem; user?: User })[]> {
    const results = await db
      .select({
        id: reviews.id,
        menuItemId: reviews.menuItemId,
        userId: reviews.userId,
        rating: reviews.rating,
        emoji: reviews.emoji,
        text: reviews.text,
        photoUrl: reviews.photoUrl,
        deviceId: reviews.deviceId,
        isHidden: reviews.isHidden,
        isFlagged: reviews.isFlagged,
        moderationStatus: reviews.moderationStatus,
        moderationScores: reviews.moderationScores,
        flaggedReason: reviews.flaggedReason,
        createdAt: reviews.createdAt,
        menuItem: menuItems,
        user: users,
      })
      .from(reviews)
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .leftJoin(users, eq(reviews.userId, users.id)) // Left join since not all reviews have users
      .where(
        and(
          eq(reviews.isHidden, false), // Only show non-hidden reviews
          eq(reviews.isFlagged, false),
          eq(reviews.moderationStatus, 'approved') // Only show approved reviews
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
      
    return results as (Review & { menuItem: MenuItem; user?: User })[];
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

  async hideReview(id: string): Promise<void> {
    await db
      .update(reviews)
      .set({ isHidden: true })
      .where(eq(reviews.id, id));
  }

  async restoreReview(id: string): Promise<void> {
    await db
      .update(reviews)
      .set({ isHidden: false })
      .where(eq(reviews.id, id));
  }

  // Review Reports
  async createReviewReport(report: InsertReviewReport): Promise<ReviewReport> {
    const [created] = await db.insert(reviewReports).values(report).returning();
    
    // Automatically hide the reported review
    await this.hideReview(report.reviewId);
    
    return created;
  }

  async getReviewReports(status?: string): Promise<(ReviewReport & { review: Review & { menuItem: MenuItem } })[]> {
    const baseQuery = db
      .select()
      .from(reviewReports)
      .innerJoin(reviews, eq(reviewReports.reviewId, reviews.id))
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id));

    const rawResults = status
      ? await baseQuery.where(eq(reviewReports.status, status)).orderBy(desc(reviewReports.createdAt))
      : await baseQuery.orderBy(desc(reviewReports.createdAt));

    // Transform the results to match the expected return type
    const results = rawResults.map((row: any) => ({
      id: row.review_reports.id,
      reviewId: row.review_reports.reviewId,
      reportedByUserId: row.review_reports.reportedByUserId,
      reportedByDeviceId: row.review_reports.reportedByDeviceId,
      reason: row.review_reports.reason,
      status: row.review_reports.status,
      createdAt: row.review_reports.createdAt,
      review: {
        ...row.reviews,
        menuItem: row.menu_items,
      },
    }));

    return results as (ReviewReport & { review: Review & { menuItem: MenuItem } })[];
  }

  async getAllReviews(limit = 100): Promise<(Review & { menuItem: MenuItem })[]> {
    const results = await db
      .select({
        id: reviews.id,
        menuItemId: reviews.menuItemId,
        userId: reviews.userId,
        rating: reviews.rating,
        emoji: reviews.emoji,
        text: reviews.text,
        photoUrl: reviews.photoUrl,
        deviceId: reviews.deviceId,
        isHidden: reviews.isHidden,
        isFlagged: reviews.isFlagged,
        moderationStatus: reviews.moderationStatus,
        moderationScores: reviews.moderationScores,
        flaggedReason: reviews.flaggedReason,
        createdAt: reviews.createdAt,
        menuItem: menuItems,
      })
      .from(reviews)
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
      
    return results as (Review & { menuItem: MenuItem })[];
  }

  // Content Moderation Methods
  async isBannedDevice(deviceIdHash: string): Promise<boolean> {
    const [banned] = await db
      .select()
      .from(bannedDevices)
      .where(
        and(
          eq(bannedDevices.deviceIdHash, deviceIdHash),
          // Check if ban hasn't expired OR if it's a permanent ban (NULL expiresAt)
          or(
            isNull(bannedDevices.expiresAt), // Permanent ban
            gte(bannedDevices.expiresAt, new Date()) // Temporary ban not yet expired
          )
        )
      );
    return !!banned;
  }

  async getBannedDevice(deviceIdHash: string): Promise<BannedDevice | undefined> {
    const [banned] = await db
      .select()
      .from(bannedDevices)
      .where(eq(bannedDevices.deviceIdHash, deviceIdHash));
    return banned;
  }

  async banDevice(ban: InsertBannedDevice): Promise<BannedDevice> {
    // Use PostgreSQL's upsert capability to handle race conditions and strikes increment
    const [result] = await db
      .insert(bannedDevices)
      .values(ban)
      .onConflictDoUpdate({
        target: bannedDevices.deviceIdHash,
        set: {
          strikes: sql`${bannedDevices.strikes} + 1`, // Increment strikes on repeat offense
          reason: ban.reason, // Update with latest reason
          expiresAt: ban.expiresAt, // Update expiry date
          createdAt: new Date(), // Update timestamp
        }
      })
      .returning();
    
    return result;
  }

  async unbanDevice(deviceIdHash: string): Promise<void> {
    await db
      .delete(bannedDevices)
      .where(eq(bannedDevices.deviceIdHash, deviceIdHash));
  }

  async logModerationEvent(event: InsertModerationEvent): Promise<ModerationEvent> {
    const [logged] = await db.insert(moderationEvents).values(event).returning();
    return logged;
  }

  async getPendingReviews(): Promise<(Review & { menuItem: MenuItem })[]> {
    const results = await db
      .select({
        id: reviews.id,
        menuItemId: reviews.menuItemId,
        userId: reviews.userId,
        rating: reviews.rating,
        emoji: reviews.emoji,
        text: reviews.text,
        photoUrl: reviews.photoUrl,
        deviceId: reviews.deviceId,
        isHidden: reviews.isHidden,
        isFlagged: reviews.isFlagged,
        moderationStatus: reviews.moderationStatus,
        moderationScores: reviews.moderationScores,
        flaggedReason: reviews.flaggedReason,
        createdAt: reviews.createdAt,
        menuItem: {
          id: menuItems.id,
          name: menuItems.itemName, // Alias itemName as name for Admin UI compatibility
          description: menuItems.station, // Use station as description for Admin UI
          date: menuItems.date,
          mealPeriod: menuItems.mealPeriod,
          station: menuItems.station,
          itemName: menuItems.itemName,
          calories: menuItems.calories,
          allergens: menuItems.allergens,
          sourceUrl: menuItems.sourceUrl,
          imageUrl: menuItems.imageUrl,
          isDeleted: menuItems.isDeleted,
          createdAt: menuItems.createdAt,
        },
      })
      .from(reviews)
      .innerJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .where(eq(reviews.moderationStatus, 'pending'))
      .orderBy(desc(reviews.createdAt));
      
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
