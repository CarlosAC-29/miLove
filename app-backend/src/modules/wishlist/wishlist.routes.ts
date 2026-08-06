import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { wishlistController } from './wishlist.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(wishlistController.list));
router.post('/', asyncHandler(wishlistController.create));
router.put('/:id', asyncHandler(wishlistController.update));
router.delete('/:id', asyncHandler(wishlistController.remove));

export const wishlistRoutes = router;
