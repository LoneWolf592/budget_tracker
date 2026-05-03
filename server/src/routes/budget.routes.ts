import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getBudgets, upsertBudget, deleteBudget } from '../controllers/budget.controller';

const router = Router();

router.use(authenticate);

router.get('/', getBudgets);            // GET    /api/budgets?month=5&year=2026
router.post('/', upsertBudget);         // POST   /api/budgets
router.delete('/:id', deleteBudget);    // DELETE /api/budgets/:id

export default router;
