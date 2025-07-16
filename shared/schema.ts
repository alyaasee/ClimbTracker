import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password"),
  email: text("email").unique(),
  firstName: text("first_name"),
  isVerified: boolean("is_verified").default(false),
  verificationCode: text("verification_code"),
  codeExpiresAt: timestamp("code_expires_at"),
  currentStreak: integer("current_streak").default(0),
  lastClimbDate: date("last_climb_date"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const climbs = pgTable("climbs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gym: text("gym").notNull(),
  routeType: text("route_type").notNull(), // "Boulder", "Top Rope", "Lead", "Auto Belay"
  grade: text("grade").notNull(), // "5a", "5b", "5c", "6a", "6b", "6c", "7a", etc.
  outcome: text("outcome").notNull(), // "Send", "Flash", "Project", "Attempt"
  notes: text("notes"),
  mediaUrl: text("media_url"), // URL for uploaded photo/video
  climbDate: date("climb_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  climbs: many(climbs),
}));

export const climbRelations = relations(climbs, ({ one }) => ({
  user: one(users, {
    fields: [climbs.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
});

export const authUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
});

export const insertClimbSchema = createInsertSchema(climbs).pick({
  gym: true,
  routeType: true,
  grade: true,
  outcome: true,
  notes: true,
  mediaUrl: true,
  climbDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClimb = z.infer<typeof insertClimbSchema>;
export type Climb = typeof climbs.$inferSelect;
