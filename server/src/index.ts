import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import budgetRoutes from './routes/budget.routes';
import aiRoutes from './routes/ai.routes';
import shareRoutes from './routes/share.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// In production CLIENT_ORIGIN will be your Vercel frontend URL.
// Locally it falls back to the Vite dev server.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

// Health check — hitting the root URL confirms the server is up
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'ClearBudget API is running' });
});

// Only start the HTTP server when running locally (not on Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Vercel needs the app exported as the default export
export default app;
