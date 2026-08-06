import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { couplesRoutes } from "../modules/couples/couples.routes.js";
import { financeRoutes } from "../modules/finance/finance.routes.js";
import { giftsRoutes } from "../modules/gifts/gifts.routes.js";
import { goalsRoutes } from "../modules/goals/goals.routes.js";
import { moviesRoutes } from "../modules/movies/movies.routes.js";
import { plansRoutes } from "../modules/plans/plans.routes.js";
import { recommendationsRoutes } from "../modules/recommendations/recommendations.routes.js";
import { restaurantsRoutes } from "../modules/restaurants/restaurants.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";
import { wishlistRoutes } from "../modules/wishlist/wishlist.routes.js";
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
router.use("/gifts", giftsRoutes);
router.use("/goals", goalsRoutes);
router.use("/movies", moviesRoutes);
router.use("/plans", plansRoutes);
router.use("/restaurants", restaurantsRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/recommendations", recommendationsRoutes);
router.use("/dates", datesRoutes);

export const appRoutes = router;
