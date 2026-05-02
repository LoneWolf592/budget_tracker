import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller';

const router = Router();

// All transaction routes require a valid JWT.
// The authenticate middleware runs first on every request to this router.
router.use(authenticate);

router.get('/', getTransactions);           // GET    /api/transactions
router.post('/', createTransaction);        // POST   /api/transactions
router.put('/:id', updateTransaction);      // PUT    /api/transactions/:id
router.delete('/:id', deleteTransaction);   // DELETE /api/transactions/:id

export default router;
