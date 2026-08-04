import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { usersController } from "./users.controller.js";

const router = Router();

router.get("/me", authMiddleware, asyncHandler(usersController.me));

export const usersRoutes = router;
