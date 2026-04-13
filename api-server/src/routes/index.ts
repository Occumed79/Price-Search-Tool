import { Router, type IRouter } from "express";
import healthRouter from "./health";
import searchRouter from "./search";
import settingsRouter from "./settings";
import reportIntelligenceRouter from "./reportIntelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(searchRouter);
router.use(settingsRouter);
router.use(reportIntelligenceRouter);

export default router;
