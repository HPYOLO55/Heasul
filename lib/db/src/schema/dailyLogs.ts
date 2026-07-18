import { pgTable, serial, integer, text, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const dailyLogsTable = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(), // YYYY-MM-DD
  waterMl: numeric("water_ml"),
  sleepHours: numeric("sleep_hours"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userDateUnique: unique("daily_logs_user_date").on(table.userId, table.date),
}));

export const insertDailyLogSchema = createInsertSchema(dailyLogsTable).omit({ id: true, createdAt: true });
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type DailyLog = typeof dailyLogsTable.$inferSelect;
