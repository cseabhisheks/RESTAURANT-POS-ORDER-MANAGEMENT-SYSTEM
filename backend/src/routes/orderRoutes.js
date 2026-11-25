import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  recordOrderPayment,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/payment', recordOrderPayment);

export default router;
