import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateMeBody } from "@workspace/api-zod";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { Request, Response } from "express";

const router = Router();

router.get("/users/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    height: user.height != null ? Number(user.height) : null,
    weight: user.weight != null ? Number(user.weight) : null,
    lastActiveDate: user.lastActiveDate ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest;

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [user] = await db
    .update(usersTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.height !== undefined && { height: String(data.height) }),
      ...(data.weight !== undefined && { weight: String(data.weight) }),
      ...(data.profilePhotoUrl !== undefined && { profilePhotoUrl: data.profilePhotoUrl }),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    height: user.height != null ? Number(user.height) : null,
    weight: user.weight != null ? Number(user.weight) : null,
    lastActiveDate: user.lastActiveDate ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
