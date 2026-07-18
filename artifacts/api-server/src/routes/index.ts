import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import analysesRouter from "./analyses";
import missionsRouter from "./missions";
import progressRouter from "./progress";
import achievementsRouter from "./achievements";
import dailyLogsRouter from "./dailyLogs";

const router = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(analysesRouter);
router.use(missionsRouter);
router.use(progressRouter);
router.use(achievementsRouter);
router.use(dailyLogsRouter);

export default router;
