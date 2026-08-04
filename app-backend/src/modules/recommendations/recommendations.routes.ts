import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";

const router = Router();

router.get("/ai", authMiddleware, (_request, response) => {
  return response.json([
    {
      id: "ai-finance-1",
      title: "Financial AI Assistant",
      message:
        "Este mes gastaste más en entretenimiento. Podrías ahorrar reduciendo consumos pequeños recurrentes.",
      createdAt: new Date().toISOString(),
    },
  ]);
});

export const recommendationsRoutes = router;
