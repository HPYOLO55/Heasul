import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import analysesRouter from "./analyses";
import missionsRouter from "./missions";
import progressRouter from "./progress";
import achievementsRouter from "./achievements";
import dailyLogsRouter from "./dailyLogs";
import hairstyleRouter from "./hairstyle";
import closetRouter from "./closet";

const router = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(analysesRouter);
router.use(missionsRouter);
router.use(progressRouter);
router.use(achievementsRouter);
router.use(dailyLogsRouter);
router.use(hairstyleRouter);
router.use(closetRouter);

export default router;
