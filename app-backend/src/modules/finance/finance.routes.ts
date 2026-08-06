import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth-middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { financeController } from "./finance.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/transactions", asyncHandler(financeController.listTransactions));
router.post("/transactions", asyncHandler(financeController.createTransaction));
router.post("/transactions/extend-fixed", asyncHandler(financeController.extendFixedTransactions));
router.put("/transactions/:id", asyncHandler(financeController.updateTransaction));
router.delete("/transactions/:id", asyncHandler(financeController.deleteTransaction));
router.get("/summary", asyncHandler(financeController.summary));

router.get("/budgets", asyncHandler(financeController.listBudgets));
router.post("/budgets", asyncHandler(financeController.createBudget));
router.put("/budgets/:id", asyncHandler(financeController.updateBudget));
router.delete("/budgets/:id", asyncHandler(financeController.deleteBudget));

router.get("/goals", asyncHandler(financeController.listGoals));
router.post("/goals", asyncHandler(financeController.createGoal));

router.get("/household", asyncHandler(financeController.household));
router.put(
  "/household/contributions/:memberId",
  asyncHandler(financeController.updateContribution),
);
router.get("/insights", asyncHandler(financeController.insights));

export const financeRoutes = router;
