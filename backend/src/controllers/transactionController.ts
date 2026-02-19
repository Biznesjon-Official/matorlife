import { Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Debt from '../models/Debt';
import { AuthRequest } from '../middleware/auth';
import { manualMonthlyReset } from '../services/monthlyResetService';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, amount, description, paymentMethod, relatedTo, apprenticeId, sparePartName } = req.body;

    console.log('\n🔍 CREATE TRANSACTION:');
    console.log('   Type:', type);
    console.log('   Category:', category);
    console.log('   Amount:', amount);
    console.log('   ApprenticeId:', apprenticeId);
    console.log('   Description:', description);
    console.log('   📦 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));

    const transaction = new Transaction({
      type,
      category,
      amount,
      description,
      paymentMethod,
      relatedTo,
      apprenticeId: apprenticeId || undefined, // Maosh to'langan shogirt
      createdBy: req.user!._id
    });

    await transaction.save();

    // Maosh kategoriyasini aniqlash (keng tekshiruv)
    const categoryLower = category.toLowerCase();
    const isSalaryCategory = categoryLower.includes('maosh') || 
                            categoryLower.includes('oylik') || 
                            categoryLower.includes('salary') ||
                            categoryLower.includes('ish') && categoryLower.includes('haqi') ||
                            categoryLower.includes('xodim') ||
                            category === 'Oyliklar' ||
                            category === 'Maosh' ||
                            category === 'Oylik' ||
                            category === 'Oylik maoshlar' ||
                            category === 'Ish haqi';

    console.log('   Category:', category);
    console.log('   Is Salary Category:', isSalaryCategory);

    // Update user earnings
    const user = req.user!;
    
    // Agar oylik maosh to'lansa va apprenticeId berilgan bo'lsa
    if (type === 'expense' && isSalaryCategory && apprenticeId) {
      const apprentice = await User.findById(apprenticeId);
      if (!apprentice) {
        return res.status(404).json({ message: 'Shogird topilmadi' });
      }

      console.log(`\n💰 MAOSH TO'LOVI BOSHLANDI:`);
      console.log(`   Shogird: ${apprentice.name}`);
      console.log(`   To'lanayotgan summa: ${amount} so'm`);
      console.log(`   ℹ️ Validatsiya frontend da amalga oshiriladi (taskEarnings - paidSalaries)`);
      console.log(`   📊 Transaction yaratildi, totalEarnings o'zgartirilmadi\n`);
      
      // ❌ totalEarnings dan ayirmaymiz! Faqat transaction yaratamiz
      // Frontend transaction history orqali hisoblaydi
      
      // Master daromadidan ayirish (chunki bu chiqim)
      user.totalEarnings = Math.max(0, user.totalEarnings - amount);
    } else {
      // Oddiy kirim/chiqim logikasi
      if (type === 'income') {
        user.totalEarnings += amount;
      } else {
        // Oddiy chiqimlar uchun master daromadidan ayirish
        user.totalEarnings = Math.max(0, user.totalEarnings - amount);
      }
    }
    
    // Agar zapchast chiqimi bo'lsa, avtomatik qarz yaratish
    let createdDebt = null;
    if (type === 'expense' && category === 'spare_parts' && sparePartName) {
      const debt = new Debt({
        type: 'payable', // Mening qarzim
        amount: amount,
        description: `Zapchast sotib olindi: ${sparePartName}`,
        creditorName: user.name || 'Master',
        status: 'pending',
        createdBy: req.user!._id
      });
      
      await debt.save();
      createdDebt = debt;
      
      console.log(`✅ Zapchast uchun qarz yaratildi: ${sparePartName} - ${amount} so'm`);
    }
    
    await user.save();

    await transaction.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
      updatedEarnings: user.totalEarnings
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
    // OPTIMIZED: Bitta aggregation pipeline bilan barcha ma'lumotlarni olish
    const result = await Transaction.aggregate([
      {
        $facet: {
          // Type bo'yicha summary
          typeSummary: [
            {
              $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          // Payment method breakdown
          paymentMethodBreakdown: [
            {
              $group: {
                _id: {
                  type: '$type',
                  paymentMethod: '$paymentMethod'
                },
                totalAmount: { $sum: '$amount' }
              }
            }
          ]
        }
      }
    ]);

    const { typeSummary, paymentMethodBreakdown } = result[0];

    const income = typeSummary.find((s: any) => s._id === 'income') || { totalAmount: 0, count: 0 };
    const expense = typeSummary.find((s: any) => s._id === 'expense') || { totalAmount: 0, count: 0 };
    const balance = income.totalAmount - expense.totalAmount;

    // Calculate payment method totals for income
    const incomeCash = paymentMethodBreakdown
      .filter((p: any) => p._id.type === 'income' && p._id.paymentMethod === 'cash')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    const incomeCard = paymentMethodBreakdown
      .filter((p: any) => p._id.type === 'income' && (p._id.paymentMethod === 'card' || p._id.paymentMethod === 'click'))
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

    // Calculate payment method totals for expense
    const expenseCash = paymentMethodBreakdown
      .filter((p: any) => p._id.type === 'expense' && p._id.paymentMethod === 'cash')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    const expenseCard = paymentMethodBreakdown
      .filter((p: any) => p._id.type === 'expense' && (p._id.paymentMethod === 'card' || p._id.paymentMethod === 'click'))
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

    // Calculate balance by payment method
    const balanceCash = incomeCash - expenseCash;
    const balanceCard = incomeCard - expenseCard;

    res.json({
      summary: {
        totalIncome: income.totalAmount,
        totalExpense: expense.totalAmount,
        balance: balance,
        incomeCount: income.count,
        expenseCount: expense.count,
        incomeCash,
        incomeCard,
        expenseCash,
        expenseCard,
        balanceCash,
        balanceCard
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
      user.totalEarnings = Math.max(0, user.totalEarnings - transaction.amount);
    } else {
      user.totalEarnings += transaction.amount;
    }
    await user.save();

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Transaction deleted successfully',
      updatedEarnings: user.totalEarnings
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resetMonthlyEarnings = async (req: AuthRequest, res: Response) => {
  try {
    // Faqat master reset qila oladi
    if (req.user!.role !== 'master') {
      return res.status(403).json({ message: 'Faqat master reset qila oladi' });
    }

    const result = await manualMonthlyReset(req.user?.id);
    
    res.json({
      success: true,
      resetCount: result.resetCount,
      deletedTransactions: result.deletedTransactions,
      message: 'Oylik daromadlar muvaffaqiyatli 0 ga qaytarildi va tarixga saqlandi',
      history: result.history
    });
  } catch (error: any) {
    console.error('❌ Reset xatosi:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Oylik tarixni olish
export const getMonthlyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const { getMonthlyHistory } = await import('../services/monthlyResetService');
    const history = await getMonthlyHistory(limit ? Number(limit) : 12);
    
    res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('❌ Tarix olishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi', 
      error: error.message 
    });
  }
};

// Ma'lum oy tarixini olish
export const getMonthHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.params;
    const { getMonthHistory } = await import('../services/monthlyResetService');
    const history = await getMonthHistory(Number(year), Number(month));
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Tarix topilmadi'
      });
    }
    
    res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('❌ Oy tarixini olishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi', 
      error: error.message 
    });
  }
};

// Oylik tarixni o'chirish
export const deleteMonthlyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Faqat master o'chirishi mumkin
    if (req.user!.role !== 'master') {
      return res.status(403).json({
        success: false,
        message: 'Ruxsat yo\'q'
      });
    }
    
    const MonthlyHistory = (await import('../models/MonthlyHistory')).default;
    const history = await MonthlyHistory.findByIdAndDelete(id);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Tarix topilmadi'
      });
    }
    
    console.log(`🗑️ Tarix o'chirildi: ${history.month}/${history.year}`);
    
    res.json({
      success: true,
      message: 'Tarix muvaffaqiyatli o\'chirildi'
    });
  } catch (error: any) {
    console.error('❌ Tarixni o\'chirishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi', 
      error: error.message 
    });
  }
};
