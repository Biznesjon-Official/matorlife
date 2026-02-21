import { Request, Response } from 'express';
import WeeklyHistory from '../models/WeeklyHistory';
import { AuthRequest } from '../middleware/auth';

// Foydalanuvchining haftalik tarixini olish
export const getUserWeeklyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await WeeklyHistory.find({ userId })
      .sort({ weekEndDate: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Haftalik tarix olishda xato:', error);
    res.status(500).json({
      success: false,
      message: 'Haftalik tarix olishda xato',
      error: error.message
    });
  }
};

// Joriy sana va kun ma'lumotlarini olish
export const getCurrentDateInfo = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // O'zbek tilida kunlar
    const daysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const dayName = daysUz[now.getDay()];
    
    // Sana formatlash
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    // Yakshanba kunigacha qolgan kunlar
    const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
    
    res.json({
      success: true,
      data: {
        dayName,
        date: formattedDate,
        fullDate: now.toISOString(),
        dayOfWeek: now.getDay(),
        daysUntilReset: daysUntilSunday,
        isSunday: now.getDay() === 0
      }
    });
  } catch (error: any) {
    console.error('Sana ma\'lumotlarini olishda xato:', error);
    res.status(500).json({
      success: false,
      message: 'Sana ma\'lumotlarini olishda xato',
      error: error.message
    });
  }
};

// Ma'lum bir hafta ma'lumotlarini olish
export const getWeekHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, historyId } = req.params;

    const history = await WeeklyHistory.findOne({
      _id: historyId,
      userId
    }).lean();

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Haftalik ma\'lumot topilmadi'
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Hafta ma\'lumotini olishda xato:', error);
    res.status(500).json({
      success: false,
      message: 'Hafta ma\'lumotini olishda xato',
      error: error.message
    });
  }
};
