import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { restaurantsController } from './restaurants.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(restaurantsController.list));
router.post('/', asyncHandler(restaurantsController.create));
router.put('/:id', asyncHandler(restaurantsController.update));
router.delete('/:id', asyncHandler(restaurantsController.remove));

export const restaurantsRoutes = router;
