import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ id: true, unlockedAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;

export const ACHIEVEMENT_DEFINITIONS = [
  { type: "first_analysis", label: "First Impression", description: "Complete your first AI glow analysis" },
  { type: "5_analyses", label: "Dedicated", description: "Complete 5 AI glow analyses" },
  { type: "7_day_streak", label: "Week Warrior", description: "Maintain a 7-day active streak" },
  { type: "30_day_streak", label: "Consistency Master", description: "Maintain a 30-day active streak" },
  { type: "100_xp", label: "Rising Star", description: "Earn 100 XP total" },
  { type: "1000_xp", label: "Transformation Started", description: "Earn 1000 XP total" },
  { type: "5000_xp", label: "Glow Legend", description: "Earn 5000 XP total" },
  { type: "first_mission", label: "Mission Possible", description: "Complete your first daily mission" },
  { type: "10_missions", label: "Mission Master", description: "Complete 10 daily missions" },
  { type: "first_photo", label: "Progress Begins", description: "Upload your first progress photo" },
] as const;
