import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable, achievementsTable } from "@workspace/db";
import { CreateAnalysisBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { analyzeImageWithNvidia, computeGlowScore } from "../lib/nvidia";
import { awardXp, updateStreak, checkAndUnlockAchievements } from "../lib/xp";
import { Request, Response } from "express";

const router = Router();

function formatAnalysis(row: typeof analysesTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    photoUrl: row.photoUrl,
    results: row.results,
    glowScore: row.glowScore != null ? Number(row.glowScore) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/analyses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const rows = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId))
    .orderBy(desc(analysesTable.createdAt));

  res.json(rows.map(formatAnalysis));
});

router.post("/analyses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let results: Record<string, unknown>;
  try {
    results = await analyzeImageWithGemini(parsed.data.photoDataUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    res.status(503).json({ error: message });
    return;
  }

  const glowScore = computeGlowScore(results);

  // Store thumbnail (first 100KB of the data URL, else null)
  const photoUrl = parsed.data.photoDataUrl.length < 100000
    ? parsed.data.photoDataUrl
    : null;

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      userId,
      photoUrl,
      results,
      glowScore: String(glowScore),
    })
    .returning();

  // Award XP and check achievements
  await awardXp(userId, 100);
  await updateStreak(userId);

  // Check analysis count achievements
  const analysisCount = await db
    .select({ id: analysesTable.id })
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId));

  const existingAchievements = await db
    .select({ type: achievementsTable.type })
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, userId));
  const unlockedTypes = new Set(existingAchievements.map(a => a.type));

  if (!unlockedTypes.has("first_analysis")) {
    await db.insert(achievementsTable).values({ userId, type: "first_analysis" });
  }
  if (analysisCount.length >= 5 && !unlockedTypes.has("5_analyses")) {
    await db.insert(achievementsTable).values({ userId, type: "5_analyses" });
  }

  res.status(201).json(formatAnalysis(analysis));
});

router.get("/analyses/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, id));

  if (!row || row.userId !== userId) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(formatAnalysis(row));
});

export default router;
