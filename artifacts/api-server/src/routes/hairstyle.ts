import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, hairstyleAnalysesTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { analyzeHairstyleWithNvidia } from "../lib/nvidia";
import { Request, Response } from "express";

const router = Router();

// Simple in-process session cache: hash(dataUrl) → results
const sessionCache = new Map<string, Record<string, unknown>>();

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 500); i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

function formatRow(row: typeof hairstyleAnalysesTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    photoUrl: row.photoUrl,
    results: row.results,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /hairstyle/analyses — list all saved analyses for the user
router.get("/hairstyle/analyses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const rows = await db
    .select()
    .from(hairstyleAnalysesTable)
    .where(eq(hairstyleAnalysesTable.userId, userId))
    .orderBy(desc(hairstyleAnalysesTable.createdAt));

  res.json(rows.map(formatRow));
});

// POST /hairstyle/analyze — analyze photo and optionally save
router.post("/hairstyle/analyze", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const { photoDataUrl, save = false } = req.body as { photoDataUrl?: string; save?: boolean };

  if (!photoDataUrl || typeof photoDataUrl !== "string") {
    res.status(400).json({ error: "photoDataUrl is required" });
    return;
  }

  // Check session cache first
  const cacheKey = hashStr(photoDataUrl);
  const cached = sessionCache.get(cacheKey);
  if (cached) {
    res.json({ results: cached, cached: true });
    return;
  }

  let results: Record<string, unknown>;
  try {
    results = await analyzeHairstyleWithNvidia(photoDataUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    req.log.error({ err, message }, "hairstyle analyzeImage failed");
    res.status(503).json({ error: message });
    return;
  }

  // Store in session cache
  sessionCache.set(cacheKey, results);
  if (sessionCache.size > 100) {
    // Evict oldest entry to avoid unbounded growth
    const firstKey = sessionCache.keys().next().value;
    if (firstKey) sessionCache.delete(firstKey);
  }

  // Optionally persist to DB
  let savedId: number | null = null;
  if (save) {
    const photoUrl = photoDataUrl.length < 100000 ? photoDataUrl : null;
    const [row] = await db
      .insert(hairstyleAnalysesTable)
      .values({ userId, photoUrl, results })
      .returning();
    savedId = row.id;
  }

  res.json({ results, cached: false, savedId });
});

// POST /hairstyle/analyses — save a previously-analyzed result
router.post("/hairstyle/analyses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const { photoDataUrl, results } = req.body as { photoDataUrl?: string; results?: Record<string, unknown> };

  if (!results) {
    res.status(400).json({ error: "results is required" });
    return;
  }

  const photoUrl = photoDataUrl && photoDataUrl.length < 100000 ? photoDataUrl : null;

  const [row] = await db
    .insert(hairstyleAnalysesTable)
    .values({ userId, photoUrl, results })
    .returning();

  res.status(201).json(formatRow(row));
});

// GET /hairstyle/analyses/:id
router.get("/hairstyle/analyses/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(hairstyleAnalysesTable)
    .where(eq(hairstyleAnalysesTable.id, id));

  if (!row || row.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(formatRow(row));
});

export default router;
