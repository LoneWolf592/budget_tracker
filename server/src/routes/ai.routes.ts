import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// TODO: wire up AI controller
router.post('/chat', (_req, res) => res.json({ message: 'AI chat coming soon' }));

export default router;
