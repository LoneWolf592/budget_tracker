import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// TODO: wire up share controller
router.post('/', (_req, res) => res.json({ message: 'sharing coming soon' }));

export default router;
