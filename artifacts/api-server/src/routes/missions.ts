import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, missionsTable, achievementsTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { awardXp, updateStreak } from "../lib/xp";
import { Request, Response } from "express";

const router = Router();

const DEFAULT_MISSIONS = [
  { missionText: "Drink 3L of water today", missionType: "hydration", xpReward: 50 },
  { missionText: "Walk for 30 minutes outside", missionType: "fitness", xpReward: 75 },
  { missionText: "Get 8 hours of sleep tonight", missionType: "sleep", xpReward: 100 },
  { missionText: "Apply sunscreen before going outside", missionType: "skincare", xpReward: 50 },
  { missionText: "Complete your morning skincare routine", missionType: "skincare", xpReward: 60 },
];

function formatMission(row: typeof missionsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    missionText: row.missionText,
    missionType: row.missionType,
    xpReward: row.xpReward,
    date: row.date,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

router.get("/missions/today", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const today = new Date().toISOString().slice(0, 10);

  let missions = await db
    .select()
    .from(missionsTable)
    .where(and(eq(missionsTable.userId, userId), eq(missionsTable.date, today)));

  // Generate default missions for today if none exist
  if (missions.length === 0) {
    const inserted = await db
      .insert(missionsTable)
      .values(
        DEFAULT_MISSIONS.map(m => ({
          ...m,
          userId,
          date: today,
          completed: false,
        }))
      )
      .returning();
    missions = inserted;
  }

  res.json(missions.map(formatMission));
});

router.post("/missions/:id/complete", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [mission] = await db
    .select()
    .from(missionsTable)
    .where(and(eq(missionsTable.id, id), eq(missionsTable.userId, userId)));

  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  if (mission.completed) {
    res.json(formatMission(mission));
    return;
  }

  const [updated] = await db
    .update(missionsTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(missionsTable.id, id))
    .returning();

  // Award XP and update streak
  await awardXp(userId, mission.xpReward);
  await updateStreak(userId);

  // Check mission achievements
  const completedCount = await db
    .select({ id: missionsTable.id })
    .from(missionsTable)
    .where(and(eq(missionsTable.userId, userId), eq(missionsTable.completed, true)));

  const unlockedTypes = new Set(
    (await db
      .select({ type: achievementsTable.type })
      .from(achievementsTable)
      .where(eq(achievementsTable.userId, userId))).map(a => a.type)
  );

  if (!unlockedTypes.has("first_mission")) {
    await db.insert(achievementsTable).values({ userId, type: "first_mission" });
  }
  if (completedCount.length >= 10 && !unlockedTypes.has("10_missions")) {
    await db.insert(achievementsTable).values({ userId, type: "10_missions" });
  }

  res.json(formatMission(updated));
});

export default router;
