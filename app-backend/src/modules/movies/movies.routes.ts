import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth-middleware.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { moviesController } from './movies.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(moviesController.list));
router.post('/', asyncHandler(moviesController.create));
router.put('/:id', asyncHandler(moviesController.update));
router.delete('/:id', asyncHandler(moviesController.remove));

export const moviesRoutes = router;
