import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, dailyLogsTable } from "@workspace/db";
import { UpsertTodayLogBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { updateStreak } from "../lib/xp";
import { Request, Response } from "express";

const router = Router();

function formatLog(row: typeof dailyLogsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    waterMl: row.waterMl != null ? Number(row.waterMl) : null,
    sleepHours: row.sleepHours != null ? Number(row.sleepHours) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/daily-logs/today", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const today = new Date().toISOString().slice(0, 10);

  const [log] = await db
    .select()
    .from(dailyLogsTable)
    .where(and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, today)));

  if (!log) {
    // Return empty log for today
    res.json({
      id: 0,
      userId,
      date: today,
      waterMl: null,
      sleepHours: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  res.json(formatLog(log));
});

router.put("/daily-logs/today", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const today = new Date().toISOString().slice(0, 10);

  const parsed = UpsertTodayLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  // Check if log exists for today
  const [existing] = await db
    .select()
    .from(dailyLogsTable)
    .where(and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, today)));

  let log;
  if (existing) {
    [log] = await db
      .update(dailyLogsTable)
      .set({
        ...(data.waterMl !== undefined && { waterMl: String(data.waterMl) }),
        ...(data.sleepHours !== undefined && { sleepHours: String(data.sleepHours) }),
      })
      .where(and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, today)))
      .returning();
  } else {
    [log] = await db
      .insert(dailyLogsTable)
      .values({
        userId,
        date: today,
        ...(data.waterMl !== undefined && { waterMl: String(data.waterMl) }),
        ...(data.sleepHours !== undefined && { sleepHours: String(data.sleepHours) }),
      })
      .returning();
  }

  await updateStreak(userId);

  res.json(formatLog(log));
});

router.get("/daily-logs", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const logs = await db
    .select()
    .from(dailyLogsTable)
    .where(eq(dailyLogsTable.userId, userId))
    .orderBy(desc(dailyLogsTable.date))
    .limit(30);

  res.json(logs.map(formatLog));
});

export default router;
