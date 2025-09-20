import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, json, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for simple auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Simple user authentication with email verification
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Email verification codes for secure authentication (keeping for backward compatibility)
export const emailCodes = pgTable("email_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIndex: sql`CREATE INDEX IF NOT EXISTS email_codes_email_idx ON email_codes (email)`,
  expiryIndex: sql`CREATE INDEX IF NOT EXISTS email_codes_expires_at_idx ON email_codes (expires_at)`,
}));

// Menu Items from Sodexo scraping
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  mealPeriod: text("meal_period").notNull(), // breakfast, lunch, dinner
  station: text("station").notNull(),
  itemName: text("item_name").notNull(),
  calories: integer("calories"),
  allergens: json("allergens").$type<string[]>().default([]),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url"),
  isDeleted: boolean("is_deleted").default(false), // Soft delete for admin management
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews from students
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // User who wrote the review, set null on user delete to preserve review history
  rating: integer("rating").notNull(), // 1-5
  emoji: text("emoji"), // Single emoji reaction
  text: text("text"),
  photoUrl: text("photo_url"),
  deviceId: text("device_id"), // Keep for backward compatibility, but now optional
  isHidden: boolean("is_hidden").default(false), // Hide when reported (before admin review)
  isFlagged: boolean("is_flagged").default(false),
  moderationStatus: text("moderation_status").default("approved"), // approved, shadow, rejected, pending
  moderationScores: json("moderation_scores").$type<Record<string, number>>(), // AI toxicity scores
  flaggedReason: text("flagged_reason"), // Reason for flagging/rejection
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure accountability: either user_id or device_id must be present
  identityCheck: sql`CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)`,
  // Ensure rating is in valid range
  ratingCheck: sql`CHECK (rating BETWEEN 1 AND 5)`,
  // Add indexes for performance
  menuItemIndex: sql`CREATE INDEX IF NOT EXISTS reviews_menu_item_id_idx ON reviews (menu_item_id)`,
  userIndex: sql`CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id)`,
  hiddenIndex: sql`CREATE INDEX IF NOT EXISTS reviews_is_hidden_idx ON reviews (is_hidden)`,
}));

// Review reports for user-reported content
export const reviewReports = pgTable("review_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  reportedByUserId: varchar("reported_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reportedByDeviceId: text("reported_by_device_id"), // Fallback if user not logged in
  reason: text("reason").notNull(), // User's reason for reporting
  status: text("status").default("pending"), // pending, reviewed, dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure accountability: either reported_by_user_id or reported_by_device_id must be present
  reporterIdentityCheck: sql`CHECK (reported_by_user_id IS NOT NULL OR reported_by_device_id IS NOT NULL)`,
  // Add indexes for performance
  reviewIndex: sql`CREATE INDEX IF NOT EXISTS review_reports_review_id_idx ON review_reports (review_id)`,
  statusIndex: sql`CREATE INDEX IF NOT EXISTS review_reports_status_idx ON review_reports (status)`,
}));

// Reports for incorrect menu info
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  issueType: text("issue_type").notNull(), // incorrect-info, not-available, wrong-allergens, etc.
  issueText: text("issue_text"),
  deviceId: text("device_id").notNull(),
  status: text("status").default("open"), // open, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scrape runs for tracking automated updates
export const scrapeRuns = pgTable("scrape_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull(), // running, completed, failed
  itemsAdded: integer("items_added").default(0),
  errors: json("errors").$type<string[]>().default([]),
});

// Admin messages for announcements to users
export const adminMessages = pgTable("admin_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // announcement, alert, info, warning
  isActive: boolean("is_active").default(true),
  showOn: json("show_on").$type<string[]>().default([]), // pages to show on: ['reviews', 'menu', 'all']
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Banned devices for content moderation
export const bannedDevices = pgTable("banned_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceIdHash: text("device_id_hash").notNull().unique(), // Hashed device identifier
  reason: text("reason").notNull(), // Reason for ban (hate speech, spam, etc.)
  strikes: integer("strikes").default(1), // Number of violations
  expiresAt: timestamp("expires_at"), // When ban expires (null = permanent)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Moderation events for audit trail
export const moderationEvents = pgTable("moderation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(), // review, message, etc.
  contentId: varchar("content_id").notNull(), // ID of the content being moderated
  deviceIdHash: text("device_id_hash"), // Hashed device identifier
  action: text("action").notNull(), // auto_reject, auto_shadow, approve, reject, ban, unban
  scores: json("scores").$type<Record<string, number>>(), // AI moderation scores
  reason: text("reason"), // Human readable reason
  adminId: text("admin_id"), // Admin who took action (if manual)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  reviewReports: many(reviewReports),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  reviews: many(reviews),
  reports: many(reports),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  menuItem: one(menuItems, {
    fields: [reviews.menuItemId],
    references: [menuItems.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  reviewReports: many(reviewReports),
}));

export const reviewReportsRelations = relations(reviewReports, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewReports.reviewId],
    references: [reviews.id],
  }),
  reportedByUser: one(users, {
    fields: [reviewReports.reportedByUserId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [reports.menuItemId],
    references: [menuItems.id],
  }),
}));

// Simple auth user types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
}).extend({
  email: z.string().email(),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(200).optional(),
  profileImageUrl: z.string().url().optional(),
});

export const insertEmailCodeSchema = createInsertSchema(emailCodes).omit({
  id: true,
  createdAt: true,
  isUsed: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  isHidden: true,
  isFlagged: true,
  moderationStatus: true,
  moderationScores: true,
  flaggedReason: true,
}).extend({
  rating: z.number().min(1).max(5),
  text: z.string().max(500).optional(),
});

export const insertReviewReportSchema = createInsertSchema(reviewReports).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  reason: z.string().min(1).max(200),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertScrapeRunSchema = createInsertSchema(scrapeRuns).omit({
  id: true,
  startedAt: true,
});

export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBannedDeviceSchema = createInsertSchema(bannedDevices).omit({
  id: true,
  createdAt: true,
});

export const insertModerationEventSchema = createInsertSchema(moderationEvents).omit({
  id: true,
  createdAt: true,
});

// Types (keeping backward compatibility)
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmailCode = typeof emailCodes.$inferSelect;
export type InsertEmailCode = z.infer<typeof insertEmailCodeSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReviewReport = typeof reviewReports.$inferSelect;
export type InsertReviewReport = z.infer<typeof insertReviewReportSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type InsertScrapeRun = z.infer<typeof insertScrapeRunSchema>;

export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;

export type BannedDevice = typeof bannedDevices.$inferSelect;
export type InsertBannedDevice = z.infer<typeof insertBannedDeviceSchema>;

export type ModerationEvent = typeof moderationEvents.$inferSelect;
export type InsertModerationEvent = z.infer<typeof insertModerationEventSchema>;
