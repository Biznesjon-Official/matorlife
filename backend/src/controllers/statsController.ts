import { Request, Response } from 'express';
import User from '../models/User';
import Task from '../models/Task';
import Car from '../models/Car';
import ChatMessage from '../models/ChatMessage';
export const getPublicStats = async (req: Request, res: Response) => {
  try {
    // Shogirdlar soni
    const apprenticesCount = await User.countDocuments({ role: 'apprentice' });
    // Vazifalar soni
    const tasksCount = await Task.countDocuments();
    // Avtomobillar soni
    const carsCount = await Car.countDocuments();
    // AI savollar soni (chat messages)
    const aiQuestionsCount = await ChatMessage.countDocuments({ role: 'user' });
    res.json({
      success: true,
      stats: {
        apprentices: apprenticesCount,
        tasks: tasksCount,
        cars: carsCount,
        aiQuestions: aiQuestionsCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik',
      error: error.message
    });
  }
};
