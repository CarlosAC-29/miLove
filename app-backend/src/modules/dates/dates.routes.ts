import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { datesController } from './dates.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(datesController.list));
router.post('/', asyncHandler(datesController.create));
router.put('/:id', asyncHandler(datesController.update));
router.delete('/:id', asyncHandler(datesController.remove));

export const datesRoutes = router;
