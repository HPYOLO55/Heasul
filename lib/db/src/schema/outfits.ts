import { pgTable, serial, integer, text, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const outfitsTable = pgTable("outfits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  occasion: text("occasion").notNull().default(""),
  weather: text("weather"),
  itemIds: jsonb("item_ids").$type<number[]>().notNull().default([]),
  score: real("score"),
  colorHarmony: text("color_harmony"),
  explanation: text("explanation").notNull().default(""),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const insertOutfitSchema = createInsertSchema(outfitsTable);
export const selectOutfitSchema = createSelectSchema(outfitsTable);

export type Outfit = typeof outfitsTable.$inferSelect;
export type InsertOutfit = typeof outfitsTable.$inferInsert;
