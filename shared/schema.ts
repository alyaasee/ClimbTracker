import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  currentStreak: integer("current_streak").default(0),
  lastClimbDate: date("last_climb_date"),
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
  firstName: true,
});

export const insertClimbSchema = createInsertSchema(climbs).pick({
  gym: true,
  routeType: true,
  grade: true,
  outcome: true,
  notes: true,
  climbDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClimb = z.infer<typeof insertClimbSchema>;
export type Climb = typeof climbs.$inferSelect;
