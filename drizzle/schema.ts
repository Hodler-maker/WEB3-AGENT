import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  walletAddress: varchar("walletAddress", { length: 42 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const rssSources = mysqlTable("rss_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  language: varchar("language", { length: 10 }).default("FR").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const publishedPosts = mysqlTable("published_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  originalUrl: varchar("originalUrl", { length: 767 }).notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  conceptOfDay: text("conceptOfDay"),
  impactTip: text("impactTip"),
  imageUrl: text("imageUrl"),
  linkedinUrn: varchar("linkedinUrn", { length: 255 }),
  status: varchar("status", { length: 50 }).default("success").notNull(),
  errorDetails: text("errorDetails"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyName: varchar("keyName", { length: 255 }).notNull(),
  keyValue: text("keyValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agentLogs = mysqlTable("agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  level: varchar("level", { length: 50 }).default("info").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type RssSource = typeof rssSources.$inferSelect;
export type InsertRssSource = typeof rssSources.$inferInsert;
export type PublishedPost = typeof publishedPosts.$inferSelect;
export type InsertPublishedPost = typeof publishedPosts.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;
export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;
