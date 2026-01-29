import { Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, amount, description, paymentMethod, relatedTo } = req.body;

    const transaction = new Transaction({
      type,
      category,
      amount,
      description,
      paymentMethod,
      relatedTo,
      createdBy: req.user!._id
    });

    await transaction.save();

    // Update user earnings
    const user = req.user!;
    if (type === 'income') {
      user.earnings += amount;
    } else {
      user.earnings = Math.max(0, user.earnings - amount);
    }
    await user.save();

    await transaction.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
      updatedEarnings: user.earnings
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTransactionSummary = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income') || { totalAmount: 0, count: 0 };
    const expense = summary.find(s => s._id === 'expense') || { totalAmount: 0, count: 0 };
    const balance = income.totalAmount - expense.totalAmount;

    console.log('📊 Transaction Summary:', {
      income: income.totalAmount,
      expense: expense.totalAmount,
      balance: balance
    });

    res.json({
      summary: {
        totalIncome: income.totalAmount,
        totalExpense: expense.totalAmount,
        balance: balance,
        incomeCount: income.count,
        expenseCount: expense.count
      }
    });
  } catch (error: any) {
    console.error('❌ Summary xatosi:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Reverse the earnings update
    const user = req.user!;
    if (transaction.type === 'income') {
      user.earnings = Math.max(0, user.earnings - transaction.amount);
    } else {
      user.earnings += transaction.amount;
    }
    await user.save();

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Transaction deleted successfully',
      updatedEarnings: user.earnings
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
