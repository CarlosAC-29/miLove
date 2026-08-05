import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { recommendationsController } from "./recommendations.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/context", asyncHandler(recommendationsController.getContext));
router.put("/context", asyncHandler(recommendationsController.upsertContext));
router.post("/suggestions/generate", asyncHandler(recommendationsController.generateSuggestions));
router.get("/suggestions", asyncHandler(recommendationsController.listSuggestions));
router.post("/suggestions/accept", asyncHandler(recommendationsController.acceptSuggestions));
router.delete("/suggestions", asyncHandler(recommendationsController.deleteSuggestions));
router.get("/ai", asyncHandler(recommendationsController.ai));

export const recommendationsRoutes = router;
