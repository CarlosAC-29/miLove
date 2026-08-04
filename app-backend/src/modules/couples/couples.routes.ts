import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { couplesController } from "./couples.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", asyncHandler(couplesController.listMine));
router.post("/", asyncHandler(couplesController.create));
router.post("/:coupleId/members", asyncHandler(couplesController.addMember));

export const couplesRoutes = router;
