import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { chat } from '../controllers/ai.controller';

const router = Router();

router.use(authenticate);

router.post('/chat', chat); // POST /api/ai/chat

export default router;
