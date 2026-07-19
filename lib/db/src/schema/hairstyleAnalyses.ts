import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const hairstyleAnalysesTable = pgTable("hairstyle_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  photoUrl: text("photo_url"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHairstyleAnalysisSchema = createInsertSchema(hairstyleAnalysesTable).omit({ id: true, createdAt: true });
export type InsertHairstyleAnalysis = z.infer<typeof insertHairstyleAnalysisSchema>;
export type HairstyleAnalysis = typeof hairstyleAnalysesTable.$inferSelect;
