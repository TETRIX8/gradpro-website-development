import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull().default(''),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default(''),
  year: integer('year').notNull().default(2026),
  technologies: text('technologies').array().notNull().default([]),
  coverUrl: text('coverUrl').notNull().default(''),
  gallery: text('gallery').array().notNull().default([]),
  videoUrl: text('videoUrl'),
  accent: text('accent').notNull().default('lime'),
  published: boolean('published').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  projectType: text('projectType'),
  budget: text('budget'),
  message: text('message').notNull(),
  fileUrl: text('fileUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type Lead = typeof leads.$inferSelect
