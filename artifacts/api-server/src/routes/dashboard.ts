import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, analysesTable, missionsTable, dailyLogsTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { Request, Response } from "express";

const router = Router();

router.get("/dashboard", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const today = new Date().toISOString().slice(0, 10);

  const [user, todayLog, todayMissions, recentAnalysis] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).then(rows => rows[0]),
    db.select().from(dailyLogsTable).where(
      and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, today))
    ).then(rows => rows[0] ?? null),
    db.select().from(missionsTable).where(
      and(eq(missionsTable.userId, userId), eq(missionsTable.date, today))
    ),
    db.select().from(analysesTable)
      .where(eq(analysesTable.userId, userId))
      .orderBy(desc(analysesTable.createdAt))
      .limit(1)
      .then(rows => rows[0] ?? null),
  ]);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const completedMissionsToday = todayMissions.filter(m => m.completed).length;
  const totalMissionsToday = todayMissions.length;

  const userOut = {
    ...user,
    height: user.height != null ? Number(user.height) : null,
    weight: user.weight != null ? Number(user.weight) : null,
    lastActiveDate: user.lastActiveDate ?? null,
    createdAt: user.createdAt.toISOString(),
  };

  res.json({
    user: userOut,
    glowScore: recentAnalysis?.glowScore != null ? Number(recentAnalysis.glowScore) : null,
    streak: user.streak,
    totalXp: user.totalXp,
    level: user.level,
    completedMissionsToday,
    totalMissionsToday,
    waterMlToday: todayLog?.waterMl != null ? Number(todayLog.waterMl) : null,
    sleepHoursLast: todayLog?.sleepHours != null ? Number(todayLog.sleepHours) : null,
    recentAnalysis: recentAnalysis
      ? {
          id: recentAnalysis.id,
          userId: recentAnalysis.userId,
          photoUrl: recentAnalysis.photoUrl,
          results: recentAnalysis.results,
          glowScore: recentAnalysis.glowScore != null ? Number(recentAnalysis.glowScore) : null,
          createdAt: recentAnalysis.createdAt.toISOString(),
        }
      : null,
  });
});

export default router;
