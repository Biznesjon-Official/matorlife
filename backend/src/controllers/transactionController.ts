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
    const { 
      type, 
      category,
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Validate and sanitize inputs
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;
    
    const filter: any = {};

    // Type filter
    if (type && (type === 'income' || type === 'expense')) {
      filter.type = type;
    }
    
    // Category filter
    if (category && typeof category === 'string') {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          filter.createdAt.$lte = end;
        }
      }
    }

    // Build sort object
    const sortObj: any = {};
    const validSortFields = ['createdAt', 'amount', 'type', 'category'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sortObj[sortField as string] = sortDirection;

    // Execute queries in parallel for better performance
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Use lean() for better performance
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        type: type || null,
        category: category || null,
        startDate: startDate || null,
        endDate: endDate || null,
        sortBy: sortField,
        sortOrder: sortOrder
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      message: 'Transaksiyalarni yuklashda xatolik yuz berdi', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
