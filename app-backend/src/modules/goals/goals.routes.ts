import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { goalsController } from './goals.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(goalsController.list));
router.post('/', asyncHandler(goalsController.create));
router.put('/:id', asyncHandler(goalsController.update));
router.delete('/:id', asyncHandler(goalsController.remove));

export const goalsRoutes = router;
