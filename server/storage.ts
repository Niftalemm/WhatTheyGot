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
  type UpsertUser,
  type InsertUser,
  type EmailCode,
  type InsertEmailCode,
  type ReviewReport,
  type InsertReviewReport,
  type CalorieEntry,
  type InsertCalorieEntry,
  type PollVote,
  type InsertPollVote,
  menuItems,
  reviews,
  reports,
  scrapeRuns,
  adminMessages,
  bannedDevices,
  moderationEvents,
  users,
  emailCodes,
  reviewReports,
  calorieEntries,
  pollVotes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  
  // Menu Item Cleanup
  cleanupExpiredMenuItems(date: string): Promise<number>;
  getExpiredMealPeriods(date: string): Promise<string[]>;
  
  // Menu Items
  getMenuItemsByDate(date: string): Promise<MenuItem[]>;
  getMenuItemById(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  bulkCreateMenuItems(items: InsertMenuItem[]): Promise<MenuItem[]>;
  deleteExpiredMenuItems(date: string, expiredPeriods: string[]): Promise<number>;
  deleteMenuItem(id: string): Promise<void>;
  updateMenuItemPhoto(id: string, imageUrl: string | null): Promise<void>;
  
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

  // Calorie Entries
  getTodaysCalorieEntries(userId?: string, deviceId?: string): Promise<CalorieEntry[]>;
  createCalorieEntry(entry: InsertCalorieEntry): Promise<CalorieEntry>;
  updateCalorieEntryQuantity(id: string, quantity: number): Promise<void>;
  deleteCalorieEntry(id: string): Promise<void>;

  // Poll Votes
  castPollVote(vote: InsertPollVote): Promise<PollVote>;
  getPollResults(pollId: string): Promise<{ option: string; count: number }[]>;
  getUserPollVote(pollId: string, userId?: string, deviceId?: string): Promise<PollVote | undefined>;
  cleanupOldCalorieEntries(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations for simple auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Legacy user methods (keeping for backward compatibility)
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Ensure email is stored in lowercase for consistency (only if email is provided)
    const userData = { 
      ...user, 
      email: user.email ? user.email.toLowerCase() : user.email 
    };
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

  async deleteExpiredMenuItems(date: string, expiredPeriods: string[]): Promise<number> {
    if (expiredPeriods.length === 0) return 0;
    
    const result = await db
      .delete(menuItems)
      .where(
        and(
          eq(menuItems.date, date),
          sql`${menuItems.mealPeriod} = ANY(${expiredPeriods})`
        )
      );
    
    // Return count of deleted items (note: reviews are cascade deleted automatically)
    return result.rowCount || 0;
  }

  async getExpiredMealPeriods(date: string): Promise<string[]> {
    // Get current time in America/Chicago timezone
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Only check current day - don't clean up future days
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return [];
    
    const expiredPeriods: string[] = [];
    
    // Operating hours (same as scraper)
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
      lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM  
      liteDinner: { start: 14, end: 16 }, // 2:00 PM - 4:00 PM
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 } // 5:00 PM - 9:00 PM (8 PM Friday)
    };
    
    // Cleanup triggers immediately at the exact minute a meal's operating hour ends
    // Delete all reviews and messages created before the closing hour for that meal
    if (hour >= operatingHours.breakfast.end) {
      expiredPeriods.push('breakfast');
    }
    
    if (hour >= operatingHours.lunch.end) {
      expiredPeriods.push('lunch');
    }
    
    if (hour >= operatingHours.liteDinner.end) {
      expiredPeriods.push('liteDinner');
    }
    
    if (hour >= operatingHours.dinner.end) {
      expiredPeriods.push('dinner');
    }
    
    return expiredPeriods;
  }

  async cleanupExpiredMenuItems(date: string): Promise<number> {
    const expiredPeriods = await this.getExpiredMealPeriods(date);
    if (expiredPeriods.length === 0) return 0;
    
    console.log(`Cleaning up expired meal periods for ${date}:`, expiredPeriods);
    const deletedCount = await this.deleteExpiredMenuItems(date, expiredPeriods);
    console.log(`Deleted ${deletedCount} expired menu items and their reviews`);
    
    return deletedCount;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  async updateMenuItemPhoto(id: string, imageUrl: string | null): Promise<void> {
    await db.update(menuItems).set({ imageUrl }).where(eq(menuItems.id, id));
  }

  isMealPeriodOpen(mealPeriod: string): { isOpen: boolean; reason?: string; nextOpening?: string } {
    // Get current time in America/Chicago timezone
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Operating hours (same as scraper and cleanup logic)
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
      lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM  
      liteDinner: { start: 14, end: 16 }, // 2:00 PM - 4:00 PM
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 } // 5:00 PM - 9:00 PM (8 PM Friday)
    };

    const mealHours = operatingHours[mealPeriod as keyof typeof operatingHours];
    if (!mealHours) {
      return { isOpen: false, reason: "Invalid meal period" };
    }

    // Check if currently within operating hours
    if (hour >= mealHours.start && hour < mealHours.end) {
      return { isOpen: true };
    }

    // Calculate next opening time
    let nextOpening = "";
    const formatTime = (hourNum: number) => {
      const hours = Math.floor(hourNum);
      const minutes = Math.round((hourNum - hours) * 60);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
      return `${displayHour}${displayMinutes} ${period}`;
    };

    if (hour < mealHours.start) {
      // Before opening time today
      nextOpening = `today at ${formatTime(mealHours.start)}`;
    } else {
      // After closing time - next opening is tomorrow
      nextOpening = `tomorrow at ${formatTime(mealHours.start)}`;
    }

    const periodName = mealPeriod === 'liteDinner' ? 'Lite Dinner' : 
                      mealPeriod.charAt(0).toUpperCase() + mealPeriod.slice(1);
                      
    return {
      isOpen: false,
      reason: `${periodName} reviews are only available during serving hours (${formatTime(mealHours.start)} - ${formatTime(mealHours.end)})`,
      nextOpening: `Reviews will be available ${nextOpening}`
    };
  }

  // Reviews
  async getReviewsForMenuItem(menuItemId: string): Promise<(Review & { user?: User })[]> {
    // First get the approved reviews
    const reviewResults = await db
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

    // Then get related users for each review
    const results = [];
    for (const review of reviewResults) {
      let user = null;
      if (review.userId) {
        const [userResult] = await db
          .select()
          .from(users)
          .where(eq(users.id, review.userId));
        user = userResult;
      }

      results.push({
        ...review,
        user,
      });
    }

    return results as (Review & { user?: User })[];
  }

  async getRecentReviews(limit = 20): Promise<(Review & { menuItem: MenuItem; user?: User })[]> {
    console.log('getRecentReviews called with limit:', limit);
    
    // First get the approved reviews
    const reviewResults = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.isHidden, false), // Only show non-hidden reviews
          eq(reviews.isFlagged, false),
          eq(reviews.moderationStatus, 'approved') // Only show approved reviews
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    console.log('Raw review results count:', reviewResults.length);
    console.log('First review:', reviewResults[0]);

    // Then get related menu items and users
    const results = [];
    for (const review of reviewResults) {
      const [menuItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, review.menuItemId));
      
      let user = null;
      if (review.userId) {
        const [userResult] = await db
          .select()
          .from(users)
          .where(eq(users.id, review.userId));
        user = userResult;
      }

      results.push({
        ...review,
        menuItem,
        user,
      });
    }

    console.log('Final results count:', results.length);
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

  // Calorie Entries
  async getTodaysCalorieEntries(userId?: string, deviceId?: string): Promise<CalorieEntry[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let whereConditions = [eq(calorieEntries.mealDate, today)];

    // Filter by user identity (userId or deviceId)
    if (userId) {
      whereConditions.push(eq(calorieEntries.userId, userId));
    } else if (deviceId) {
      whereConditions.push(eq(calorieEntries.deviceId, deviceId));
    }

    return await db
      .select()
      .from(calorieEntries)
      .where(and(...whereConditions))
      .orderBy(desc(calorieEntries.savedAt));
  }

  async createCalorieEntry(entry: InsertCalorieEntry): Promise<CalorieEntry> {
    const [created] = await db.insert(calorieEntries).values(entry).returning();
    return created;
  }

  async updateCalorieEntryQuantity(id: string, quantity: number): Promise<void> {
    await db
      .update(calorieEntries)
      .set({ quantity })
      .where(eq(calorieEntries.id, id));
  }

  async deleteCalorieEntry(id: string): Promise<void> {
    await db.delete(calorieEntries).where(eq(calorieEntries.id, id));
  }

  async cleanupOldCalorieEntries(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const result = await db
      .delete(calorieEntries)
      .where(sql`${calorieEntries.mealDate} < ${today}`);
    
    return result.rowCount || 0;
  }

  // Poll Votes
  async castPollVote(vote: InsertPollVote): Promise<PollVote> {
    // First, try to update existing vote for this user/device and poll
    const whereClause = vote.userId 
      ? and(eq(pollVotes.pollId, vote.pollId), eq(pollVotes.userId, vote.userId))
      : and(eq(pollVotes.pollId, vote.pollId), eq(pollVotes.deviceId, vote.deviceId!));

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(pollVotes)
      .where(whereClause)
      .limit(1);

    if (existingVote.length > 0) {
      // Update existing vote
      const [updated] = await db
        .update(pollVotes)
        .set({ selectedOption: vote.selectedOption })
        .where(eq(pollVotes.id, existingVote[0].id))
        .returning();
      return updated;
    } else {
      // Create new vote
      const [created] = await db.insert(pollVotes).values(vote).returning();
      return created;
    }
  }

  async getPollResults(pollId: string): Promise<{ option: string; count: number }[]> {
    const results = await db
      .select({
        option: pollVotes.selectedOption,
        count: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .groupBy(pollVotes.selectedOption);

    return results;
  }

  async getUserPollVote(pollId: string, userId?: string, deviceId?: string): Promise<PollVote | undefined> {
    const whereClause = userId 
      ? and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId))
      : and(eq(pollVotes.pollId, pollId), eq(pollVotes.deviceId, deviceId!));

    const result = await db
      .select()
      .from(pollVotes)
      .where(whereClause)
      .limit(1);

    return result[0];
  }
}

export const storage = new DatabaseStorage();
