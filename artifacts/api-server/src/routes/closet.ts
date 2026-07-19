import { Router, Request, Response } from "express";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import { db, closetItemsTable, outfitsTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { analyzeClothingWithNvidia, generateOutfitWithNvidia } from "../lib/nvidia";

const router = Router();

// ─── Session cache (same pattern as hairstyle) ────────────────────────────────
const sessionCache = new Map<string, Record<string, unknown>>();
function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 500); i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatItem(row: typeof closetItemsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    photoUrl: row.photoUrl,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    primaryColor: row.primaryColor,
    secondaryColors: row.secondaryColors,
    pattern: row.pattern,
    material: row.material,
    season: row.season,
    occasion: row.occasion,
    style: row.style,
    fit: row.fit,
    gender: row.gender,
    formality: row.formality,
    description: row.description,
    favorite: row.favorite,
    createdAt: row.createdAt.toISOString(),
  };
}

function formatOutfit(row: typeof outfitsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    occasion: row.occasion,
    weather: row.weather,
    itemIds: row.itemIds,
    score: row.score,
    colorHarmony: row.colorHarmony,
    explanation: row.explanation,
    savedAt: row.savedAt.toISOString(),
  };
}

// ─── Closet Items CRUD ─────────────────────────────────────────────────────────

// GET /closet/items — list with optional search/filter
router.get("/closet/items", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const { q, category, occasion, season, formality, favorite } = req.query as Record<string, string>;

  const conditions = [eq(closetItemsTable.userId, userId)];

  if (q) {
    conditions.push(
      or(
        ilike(closetItemsTable.name, `%${q}%`),
        ilike(closetItemsTable.category, `%${q}%`),
        ilike(closetItemsTable.primaryColor, `%${q}%`),
        ilike(closetItemsTable.season, `%${q}%`),
        ilike(closetItemsTable.occasion, `%${q}%`),
        ilike(closetItemsTable.style, `%${q}%`),
        ilike(closetItemsTable.material, `%${q}%`)
      )!
    );
  }
  if (category) conditions.push(ilike(closetItemsTable.category, `%${category}%`));
  if (occasion) conditions.push(ilike(closetItemsTable.occasion, `%${occasion}%`));
  if (season) conditions.push(ilike(closetItemsTable.season, `%${season}%`));
  if (formality) conditions.push(ilike(closetItemsTable.formality, `%${formality}%`));
  if (favorite === "true") conditions.push(eq(closetItemsTable.favorite, true));

  const rows = await db
    .select()
    .from(closetItemsTable)
    .where(and(...conditions))
    .orderBy(desc(closetItemsTable.createdAt));

  res.json(rows.map(formatItem));
});

// GET /closet/stats — wardrobe statistics
router.get("/closet/stats", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const items = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, userId));

  const total = items.length;
  const tops = items.filter(i => ["T-Shirts","Shirts","Polo","Hoodies","Sweaters","Jackets","Tops"].some(t => i.category.toLowerCase().includes(t.toLowerCase()))).length;
  const bottoms = items.filter(i => ["Jeans","Chinos","Cargo","Shorts","Joggers","Trousers","Pants","Bottoms"].some(t => i.category.toLowerCase().includes(t.toLowerCase()))).length;
  const shoes = items.filter(i => ["Sneakers","Formal Shoes","Sandals","Boots","Shoes","Footwear"].some(t => i.category.toLowerCase().includes(t.toLowerCase()))).length;
  const accessories = items.filter(i => ["Watch","Belt","Cap","Bag","Accessory","Accessories"].some(t => i.category.toLowerCase().includes(t.toLowerCase()))).length;
  const favorites = items.filter(i => i.favorite).length;

  // Color frequency
  const colorCount: Record<string, number> = {};
  for (const item of items) {
    if (item.primaryColor) {
      colorCount[item.primaryColor] = (colorCount[item.primaryColor] ?? 0) + 1;
    }
  }
  const mostWornColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Season distribution
  const seasonCount: Record<string, number> = {};
  for (const item of items) {
    if (item.season) seasonCount[item.season] = (seasonCount[item.season] ?? 0) + 1;
  }

  // Occasion distribution
  const occasionCount: Record<string, number> = {};
  for (const item of items) {
    if (item.occasion) occasionCount[item.occasion] = (occasionCount[item.occasion] ?? 0) + 1;
  }

  // Missing essentials
  const missingEssentials: string[] = [];
  if (tops < 3) missingEssentials.push("Consider adding more versatile tops (white shirt, neutral crew-neck).");
  if (bottoms < 2) missingEssentials.push("A pair of well-fitted chinos or jeans adds versatility.");
  if (shoes < 2) missingEssentials.push("A clean pair of white sneakers goes with nearly anything.");
  if (accessories === 0) missingEssentials.push("A simple watch or belt elevates most outfits.");

  const recentlyAdded = items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map(formatItem);

  res.json({
    total,
    tops,
    bottoms,
    shoes,
    accessories,
    favorites,
    mostWornColor,
    seasonDistribution: seasonCount,
    occasionDistribution: occasionCount,
    missingEssentials,
    recentlyAdded,
  });
});

// POST /closet/analyze — analyze clothing image
router.post("/closet/analyze", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { photoDataUrl } = req.body as { photoDataUrl?: string };

  if (!photoDataUrl) {
    res.status(400).json({ error: "photoDataUrl is required" });
    return;
  }

  const cacheKey = hashStr(photoDataUrl);
  const cached = sessionCache.get(cacheKey);
  if (cached) {
    res.json({ results: cached, cached: true });
    return;
  }

  let results: Record<string, unknown>;
  try {
    results = await analyzeClothingWithNvidia(photoDataUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    req.log.error({ err }, "closet analyzeClothing failed");
    res.status(503).json({ error: message });
    return;
  }

  sessionCache.set(cacheKey, results);
  if (sessionCache.size > 200) {
    const firstKey = sessionCache.keys().next().value;
    if (firstKey) sessionCache.delete(firstKey);
  }

  res.json({ results, cached: false });
});

// POST /closet/items — save a clothing item
router.post("/closet/items", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const { photoDataUrl, results } = req.body as {
    photoDataUrl?: string;
    results: Record<string, unknown>;
  };

  if (!results) {
    res.status(400).json({ error: "results is required" });
    return;
  }

  const photoUrl = photoDataUrl && photoDataUrl.length < 200000 ? photoDataUrl : null;

  const [row] = await db
    .insert(closetItemsTable)
    .values({
      userId,
      photoUrl,
      name: (results.name as string) ?? "",
      category: (results.category as string) ?? "",
      subcategory: (results.subcategory as string) ?? "",
      primaryColor: (results.primary_color as string) ?? "",
      secondaryColors: (results.secondary_colors as string[]) ?? [],
      pattern: (results.pattern as string) ?? "",
      material: (results.material as string) ?? "",
      season: (results.season as string) ?? "",
      occasion: (results.occasion as string) ?? "",
      style: (results.style as string) ?? "",
      fit: (results.fit as string) ?? "",
      gender: (results.gender as string) ?? "",
      formality: (results.formality as string) ?? "",
      description: (results.description as string) ?? "",
      favorite: false,
    })
    .returning();

  res.status(201).json(formatItem(row));
});

// GET /closet/items/:id
router.get("/closet/items/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(closetItemsTable).where(eq(closetItemsTable.id, id));
  if (!row || row.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }

  res.json(formatItem(row));
});

// PATCH /closet/items/:id — update fields (edit name, favorite toggle, etc.)
router.patch("/closet/items/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(closetItemsTable).where(eq(closetItemsTable.id, id));
  if (!existing || existing.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }

  const allowed = ["name","category","subcategory","primaryColor","season","occasion","style","fit","formality","description","favorite"] as const;
  const updates: Partial<typeof closetItemsTable.$inferInsert> = {};
  for (const key of allowed) {
    if (key in req.body) (updates as Record<string, unknown>)[key] = req.body[key];
  }

  const [row] = await db
    .update(closetItemsTable)
    .set(updates)
    .where(eq(closetItemsTable.id, id))
    .returning();

  res.json(formatItem(row));
});

// DELETE /closet/items/:id
router.delete("/closet/items/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(closetItemsTable).where(eq(closetItemsTable.id, id));
  if (!existing || existing.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(closetItemsTable).where(eq(closetItemsTable.id, id));
  res.status(204).send();
});

// ─── Outfit Generation ─────────────────────────────────────────────────────────

// POST /closet/outfits/generate — AI outfit from user's wardrobe
router.post("/closet/outfits/generate", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const { occasion, weather, preferredColors } = req.body as {
    occasion?: string;
    weather?: string;
    preferredColors?: string[];
  };

  // Fetch all user items
  const items = await db
    .select()
    .from(closetItemsTable)
    .where(eq(closetItemsTable.userId, userId));

  if (items.length < 2) {
    res.status(400).json({ error: "Add at least 2 items to your closet to generate outfits." });
    return;
  }

  let result: Record<string, unknown>;
  try {
    result = await generateOutfitWithNvidia(
      items.map(formatItem),
      occasion ?? "casual",
      weather,
      preferredColors
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Outfit generation failed";
    req.log.error({ err }, "outfit generation failed");
    res.status(503).json({ error: message });
    return;
  }

  res.json(result);
});

// ─── Saved Outfits ─────────────────────────────────────────────────────────────

// GET /closet/outfits
router.get("/closet/outfits", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const rows = await db
    .select()
    .from(outfitsTable)
    .where(eq(outfitsTable.userId, userId))
    .orderBy(desc(outfitsTable.savedAt));

  res.json(rows.map(formatOutfit));
});

// POST /closet/outfits — save an outfit
router.post("/closet/outfits", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const { name, occasion, weather, itemIds, score, colorHarmony, explanation } = req.body as {
    name?: string;
    occasion?: string;
    weather?: string;
    itemIds?: number[];
    score?: number;
    colorHarmony?: string;
    explanation?: string;
  };

  if (!itemIds || itemIds.length === 0) {
    res.status(400).json({ error: "itemIds is required" });
    return;
  }

  const [row] = await db
    .insert(outfitsTable)
    .values({
      userId,
      name: name ?? `${occasion ?? "Outfit"} Look`,
      occasion: occasion ?? "",
      weather: weather ?? null,
      itemIds,
      score: score ?? null,
      colorHarmony: colorHarmony ?? null,
      explanation: explanation ?? "",
    })
    .returning();

  res.status(201).json(formatOutfit(row));
});

// DELETE /closet/outfits/:id
router.delete("/closet/outfits/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(outfitsTable).where(eq(outfitsTable.id, id));
  if (!existing || existing.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(outfitsTable).where(eq(outfitsTable.id, id));
  res.status(204).send();
});

export default router;
