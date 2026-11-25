import { Router } from 'express';
import {
  createMenuItem,
  getMenuItems,
  toggleMenuItemStatus,
  updateMenuItem,
} from '../controllers/menuController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMenuItems);
router.post('/', requireRole('Admin'), createMenuItem);
router.put('/:id', requireRole('Admin'), updateMenuItem);
router.patch('/:id/status', requireRole('Admin'), toggleMenuItemStatus);

export default router;
