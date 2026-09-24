import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core"

// ─── Better Auth tables (camelCase columns are required by Better Auth) ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  impersonatedBy: text("impersonatedBy"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  verified: boolean("verified").notNull().default(false),
  failedVerificationCount: integer("failedVerificationCount").notNull().default(0),
  lockedUntil: timestamp("lockedUntil"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

// ─── Application tables ───

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  service: text("service"),
  message: text("message"),
  source: text("source").notNull().default("direct"),
  status: text("status").notNull().default("new"),
  assigneeId: text("assignee_id"),
  value: integer("value").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const leadEvents = pgTable("lead_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  type: text("type").notNull(),
  actorId: text("actor_id"),
  actorName: text("actor_name"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: text("actor_id"),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  description: text("description").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  email: text("email").notNull(),
  success: boolean("success").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  device: text("device"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  source: text("source").notNull().default("direct"),
  referrer: text("referrer"),
  device: text("device"),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const contentSections = pgTable("content_sections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull().default({}),
  published: jsonb("published").$type<Record<string, unknown>>().notNull().default({}),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedBy: text("updated_by"),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const contentRevisions = pgTable("content_revisions", {
  id: serial("id").primaryKey(),
  sectionSlug: text("section_slug").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  authorId: text("author_id"),
  authorName: text("author_name"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: integer("price").notNull().default(0),
  priceLabel: text("price_label"),
  category: text("category"),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email"),
  subject: text("subject"),
  body: text("body").notNull(),
  direction: text("direction").notNull().default("in"),
  read: boolean("read").notNull().default(false),
  authorId: text("author_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default(""),
  year: integer("year").notNull().default(2026),
  technologies: text("technologies").array().notNull().default([]),
  coverUrl: text("coverUrl").notNull().default(""),
  gallery: text("gallery").array().notNull().default([]),
  videoUrl: text("videoUrl"),
  accent: text("accent").notNull().default("lime"),
  published: boolean("published").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export type NewProject = typeof projects.$inferInsert

export type Lead = typeof leads.$inferSelect
export type LeadEvent = typeof leadEvents.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
export type LoginAttempt = typeof loginAttempts.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type ContentSection = typeof contentSections.$inferSelect
export type ContentRevision = typeof contentRevisions.$inferSelect
export type Service = typeof services.$inferSelect
export type Message = typeof messages.$inferSelect
export type Project = typeof projects.$inferSelect
export type AppUser = typeof user.$inferSelect
