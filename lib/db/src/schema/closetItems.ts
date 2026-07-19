import { pgTable, serial, integer, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const closetItemsTable = pgTable("closet_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url"),
  name: text("name").notNull().default(""),
  category: text("category").notNull().default(""),
  subcategory: text("subcategory").notNull().default(""),
  primaryColor: text("primary_color").notNull().default(""),
  secondaryColors: jsonb("secondary_colors").$type<string[]>().notNull().default([]),
  pattern: text("pattern").notNull().default(""),
  material: text("material").notNull().default(""),
  season: text("season").notNull().default(""),
  occasion: text("occasion").notNull().default(""),
  style: text("style").notNull().default(""),
  fit: text("fit").notNull().default(""),
  gender: text("gender").notNull().default(""),
  formality: text("formality").notNull().default(""),
  description: text("description").notNull().default(""),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClosetItemSchema = createInsertSchema(closetItemsTable);
export const selectClosetItemSchema = createSelectSchema(closetItemsTable);

export type ClosetItem = typeof closetItemsTable.$inferSelect;
export type InsertClosetItem = typeof closetItemsTable.$inferInsert;
