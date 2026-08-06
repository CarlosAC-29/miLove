import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { plansController } from './plans.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(plansController.list));

export const plansRoutes = router;
