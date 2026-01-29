import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionSummary,
  deleteTransaction
} from '../controllers/transactionController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create transaction (master only)
router.post('/', authenticate, authorize('master'), [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').trim().isLength({ min: 2 }).withMessage('Description must be at least 2 characters'),
  body('paymentMethod').isIn(['cash', 'card', 'click']).withMessage('Invalid payment method'),
  handleValidationErrors
], createTransaction);

// Get transactions
router.get('/', authenticate, getTransactions);

// Get transaction summary
router.get('/summary', authenticate, getTransactionSummary);

// Get transaction by ID
router.get('/:id', authenticate, getTransactionById);

// Delete transaction (master only)
router.delete('/:id', authenticate, authorize('master'), deleteTransaction);

export default router;
