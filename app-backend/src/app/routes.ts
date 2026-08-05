import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { couplesRoutes } from "../modules/couples/couples.routes.js";
import { financeRoutes } from "../modules/finance/finance.routes.js";
import { recommendationsRoutes } from "../modules/recommendations/recommendations.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";
import { datesRoutes } from "../modules/dates/dates.routes.js";
import { docsRoutes } from "../infrastructure/docs/docs.routes.js";
import { healthRoutes } from "../infrastructure/health/health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/docs", docsRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/couples", couplesRoutes);
router.use("/finance", financeRoutes);
router.use("/recommendations", recommendationsRoutes);
router.use("/dates", datesRoutes);

export const appRoutes = router;
