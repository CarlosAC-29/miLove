import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authController } from "./auth.controller.js";

const router = Router();

// Dev-only helper to quickly obtain an access token using email+password.
// POST /auth/token { email, password } -> { accessToken }
router.post("/token", asyncHandler(authController.token));

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/session", authMiddleware, asyncHandler(authController.session));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post("/oauth/google", asyncHandler(authController.google));
router.post("/oauth/apple", asyncHandler(authController.apple));

export const authRoutes = router;
