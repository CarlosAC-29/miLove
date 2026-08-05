import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { datesController } from './dates.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(datesController.list));

export const datesRoutes = router;
