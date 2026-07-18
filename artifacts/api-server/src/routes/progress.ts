import { Router } from "express";
import { eq, desc, and, gte } from "drizzle-orm";
import { db, analysesTable, dailyLogsTable, progressPhotosTable, achievementsTable } from "@workspace/db";
import { CreateProgressPhotoBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { Request, Response } from "express";

const router = Router();

router.get("/progress", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [analyses, logs] = await Promise.all([
    db.select()
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId))
      .orderBy(analysesTable.createdAt),
    db.select()
      .from(dailyLogsTable)
      .where(and(eq(dailyLogsTable.userId, userId), gte(dailyLogsTable.date, thirtyDaysAgoStr)))
      .orderBy(dailyLogsTable.date),
  ]);

  const glowScoreHistory = analyses
    .filter(a => a.glowScore != null)
    .map(a => ({
      date: a.createdAt.toISOString().slice(0, 10),
      score: Number(a.glowScore),
    }));

  const waterHistory = logs
    .filter(l => l.waterMl != null)
    .map(l => ({ date: l.date, waterMl: Number(l.waterMl) }));

  const sleepHistory = logs
    .filter(l => l.sleepHours != null)
    .map(l => ({ date: l.date, sleepHours: Number(l.sleepHours) }));

  // Build streak history from daily logs (last 30 days)
  const streakHistory = logs.map(l => ({
    date: l.date,
    completed: l.waterMl != null || l.sleepHours != null,
  }));

  res.json({ glowScoreHistory, waterHistory, sleepHistory, streakHistory });
});

router.get("/progress/photos", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const photos = await db
    .select()
    .from(progressPhotosTable)
    .where(eq(progressPhotosTable.userId, userId))
    .orderBy(desc(progressPhotosTable.createdAt));

  res.json(photos.map(p => ({
    id: p.id,
    userId: p.userId,
    photoUrl: p.photoUrl,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/progress/photos", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const parsed = CreateProgressPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [photo] = await db
    .insert(progressPhotosTable)
    .values({
      userId,
      photoUrl: parsed.data.photoDataUrl,
      note: parsed.data.note ?? null,
    })
    .returning();

  // Check first photo achievement
  const unlockedTypes = new Set(
    (await db
      .select({ type: achievementsTable.type })
      .from(achievementsTable)
      .where(eq(achievementsTable.userId, userId))).map(a => a.type)
  );
  if (!unlockedTypes.has("first_photo")) {
    await db.insert(achievementsTable).values({ userId, type: "first_photo" });
  }

  res.status(201).json({
    id: photo.id,
    userId: photo.userId,
    photoUrl: photo.photoUrl,
    note: photo.note,
    createdAt: photo.createdAt.toISOString(),
  });
});

export default router;
