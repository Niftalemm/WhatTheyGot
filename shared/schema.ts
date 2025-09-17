import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews from students
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  emoji: text("emoji"), // Single emoji reaction
  text: text("text"),
  photoUrl: text("photo_url"),
  deviceId: text("device_id").notNull(), // For basic spam prevention
  isFlagged: boolean("is_flagged").default(false),
  moderationStatus: text("moderation_status").default("approved"), // approved, shadow, rejected, pending
  moderationScores: json("moderation_scores").$type<Record<string, number>>(), // AI toxicity scores
  flaggedReason: text("flagged_reason"), // Reason for flagging/rejection
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  reviews: many(reviews),
  reports: many(reports),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [reviews.menuItemId],
    references: [menuItems.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [reports.menuItemId],
    references: [menuItems.id],
  }),
}));

// Insert schemas for validation
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  isFlagged: true,
  moderationStatus: true,
  moderationScores: true,
  flaggedReason: true,
}).extend({
  rating: z.number().min(1).max(5),
  text: z.string().max(500).optional(),
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

// Types
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

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
