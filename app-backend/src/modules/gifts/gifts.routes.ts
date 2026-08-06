import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { giftsController } from './gifts.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(giftsController.list));
router.post('/', asyncHandler(giftsController.create));
router.put('/:id', asyncHandler(giftsController.update));
router.delete('/:id', asyncHandler(giftsController.remove));

export const giftsRoutes = router;
