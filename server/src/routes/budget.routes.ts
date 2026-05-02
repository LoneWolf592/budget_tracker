import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// TODO: wire up budget controller
router.get('/', (_req, res) => res.json({ message: 'budgets coming soon' }));

export default router;
