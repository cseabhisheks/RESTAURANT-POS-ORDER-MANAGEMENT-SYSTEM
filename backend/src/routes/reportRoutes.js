import { Router } from 'express';
import { getDailySalesReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/daily-sales', getDailySalesReport);

export default router;
