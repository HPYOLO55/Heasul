import { db, usersTable, achievementsTable, ACHIEVEMENT_DEFINITIONS } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export function computeLevel(xp: number): number {
  if (xp >= 5000) return 5;
  if (xp >= 3000) return 4;
  if (xp >= 1500) return 3;
  if (xp >= 500) return 2;
  return 1;
}

export async function awardXp(userId: number, amount: number): Promise<void> {
  const [user] = await db
    .select({ totalXp: usersTable.totalXp })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return;

  const newXp = (user.totalXp ?? 0) + amount;
  const newLevel = computeLevel(newXp);

  await db
    .update(usersTable)
    .set({ totalXp: newXp, level: newLevel })
    .where(eq(usersTable.id, userId));

  await checkAndUnlockAchievements(userId, newXp);
}

export async function checkAndUnlockAchievements(
  userId: number,
  xp?: number,
): Promise<void> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) return;

  const currentXp = xp ?? user.totalXp ?? 0;

  const unlockedTypes = new Set(
    (await db
      .select({ type: achievementsTable.type })
      .from(achievementsTable)
      .where(eq(achievementsTable.userId, userId))).map((a) => a.type)
  );

  const toUnlock: string[] = [];

  if (currentXp >= 100 && !unlockedTypes.has("100_xp")) toUnlock.push("100_xp");
  if (currentXp >= 1000 && !unlockedTypes.has("1000_xp")) toUnlock.push("1000_xp");
  if (currentXp >= 5000 && !unlockedTypes.has("5000_xp")) toUnlock.push("5000_xp");

  if (user.streak >= 7 && !unlockedTypes.has("7_day_streak")) toUnlock.push("7_day_streak");
  if (user.streak >= 30 && !unlockedTypes.has("30_day_streak")) toUnlock.push("30_day_streak");

  for (const type of toUnlock) {
    try {
      await db.insert(achievementsTable).values({ userId, type });
    } catch (err) {
      logger.warn({ err, type }, "Could not insert achievement (may already exist)");
    }
  }
}

export async function updateStreak(userId: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const [user] = await db
    .select({ streak: usersTable.streak, lastActiveDate: usersTable.lastActiveDate })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return;

  if (user.lastActiveDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = user.lastActiveDate === yesterdayStr
    ? (user.streak ?? 0) + 1
    : 1;

  await db
    .update(usersTable)
    .set({ streak: newStreak, lastActiveDate: today })
    .where(eq(usersTable.id, userId));

  await checkAndUnlockAchievements(userId);
}
