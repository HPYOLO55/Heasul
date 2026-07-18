import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable, ACHIEVEMENT_DEFINITIONS } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { Request, Response } from "express";

const router = Router();

router.get("/achievements", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const unlocked = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, userId));

  const unlockedTypes = new Set(unlocked.map(a => a.type));

  const unlockedWithDetails = unlocked.map(a => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.type === a.type);
    return {
      id: a.id,
      userId: a.userId,
      type: a.type,
      label: def?.label ?? a.type,
      description: def?.description ?? "",
      unlockedAt: a.unlockedAt.toISOString(),
    };
  });

  const locked = ACHIEVEMENT_DEFINITIONS
    .filter(d => !unlockedTypes.has(d.type))
    .map(d => ({
      type: d.type,
      label: d.label,
      description: d.description,
    }));

  res.json({ unlocked: unlockedWithDetails, locked });
});

export default router;
