import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastPosted: timestamp("last_posted"),
  kudos: integer("kudos").default(0).notNull(),
  canViewImmediately: boolean("can_view_immediately").default(false).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  kudos: many(kudos),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Post table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  location: text("location").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  description: text("description"),
  status: text("status").notNull().default("available"), // available, partial, taken
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  items: many(items),
  images: many(images),
  comments: many(comments),
  kudos: many(kudos),
}));

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  location: true,
  latitude: true,
  longitude: true,
  description: true,
  status: true,
});

// Post items
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"), // available, taken
});

export const itemsRelations = relations(items, ({ one }) => ({
  post: one(posts, { fields: [items.postId], references: [posts.id] }),
}));

export const insertItemSchema = createInsertSchema(items).pick({
  postId: true,
  name: true,
  status: true,
});

// Post images
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imagesRelations = relations(images, ({ one }) => ({
  post: one(posts, { fields: [images.postId], references: [posts.id] }),
}));

export const insertImageSchema = createInsertSchema(images).pick({
  postId: true,
  url: true,
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  userId: true,
  content: true,
});

// Kudos
export const kudos = pgTable("kudos", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kudosRelations = relations(kudos, ({ one }) => ({
  post: one(posts, { fields: [kudos.postId], references: [posts.id] }),
  user: one(users, { fields: [kudos.userId], references: [users.id] }),
}));

export const insertKudosSchema = createInsertSchema(kudos).pick({
  postId: true,
  userId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Kudos = typeof kudos.$inferSelect;
export type InsertKudos = z.infer<typeof insertKudosSchema>;

// Extended types for frontend use
export type PostWithDetails = Post & {
  user: User;
  items: Item[];
  images: Image[];
  comments: Comment[];
  kudosCount: number;
  userKudos: boolean;
};
