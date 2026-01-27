import { Request, Response } from 'express';
import User from '../models/User';
import Task from '../models/Task';
import Car from '../models/Car';
import ChatMessage from '../models/ChatMessage';
import CarService from '../models/CarService';
import { AuthRequest } from '../middleware/auth';

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

export const getEarningsStats = async (req: AuthRequest, res: Response) => {
  try {
    const masterId = req.user!._id;
    const { startDate, endDate, period } = req.query;

    // Vaqt filtri
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    } else if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          dateFilter.createdAt = {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter.createdAt = { $gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFilter.createdAt = { $gte: monthAgo };
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFilter.createdAt = { $gte: yearAgo };
          break;
      }
    }

    // Shogirdlar ro'yxati
    const apprentices = await User.find({ role: 'apprentice' }).select('_id name earnings');

    // Har bir shogirdning daromadini hisoblash
    const apprenticeEarnings = await Promise.all(
      apprentices.map(async (apprentice) => {
        // 1. User modelidagi earnings (asosiy daromad)
        const savedEarnings = apprentice.earnings || 0;

        // 2. Faqat tasdiqlangan (approved) vazifalarning apprenticeEarning qiymatlari
        const taskFilter = {
          assignedTo: apprentice._id,
          status: 'approved',
          apprenticeEarning: { $exists: true, $gt: 0 },
          ...dateFilter
        };

        const approvedTasks = await Task.find(taskFilter)
          .select('apprenticeEarning title dueDate approvedAt payment apprenticePercentage');

        // Vazifalardan olingan daromad (foiz asosida)
        const taskEarnings = approvedTasks.reduce((sum, task) => sum + (task.apprenticeEarning || 0), 0);

        // Jami daromad = User earnings + Task apprenticeEarnings
        const totalEarnings = savedEarnings + taskEarnings;

        return {
          _id: apprentice._id,
          name: apprentice.name,
          earnings: totalEarnings,
          savedEarnings: savedEarnings, // User modelidagi
          taskEarnings: taskEarnings, // Vazifalardan (foiz asosida)
          taskCount: approvedTasks.length,
          tasks: approvedTasks.map(task => ({
            _id: task._id,
            title: task.title,
            payment: task.apprenticeEarning, // Shogirdning ulushi
            totalPayment: task.payment, // Umumiy to'lov
            percentage: task.apprenticePercentage, // Foiz
            approvedAt: task.approvedAt
          }))
        };
      })
    );

    // Jami shogirdlar daromadi
    const totalApprenticeEarnings = apprenticeEarnings.reduce(
      (sum, app) => sum + app.earnings,
      0
    );

    // Ustoz daromadi - faqat tasdiqlangan vazifalardan
    const masterTaskFilter: any = {
      status: 'approved',
      masterEarning: { $exists: true, $gt: 0 }
    };
    if (dateFilter.createdAt) {
      masterTaskFilter.approvedAt = dateFilter.createdAt;
    }

    const masterTaskEarnings = await Task.aggregate([
      { $match: masterTaskFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$masterEarning' }
        }
      }
    ]);

    const masterEarningsFromTasks = masterTaskEarnings[0]?.total || 0;

    // Jami xizmatlar daromadi (CarService)
    const serviceFilter: any = {
      status: { $in: ['completed', 'delivered'] }
    };
    if (dateFilter.createdAt) {
      serviceFilter.updatedAt = dateFilter.createdAt;
    }

    const serviceEarnings = await CarService.aggregate([
      { $match: serviceFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalServiceEarnings = serviceEarnings[0]?.total || 0;
    const serviceCount = serviceEarnings[0]?.count || 0;

    // Xizmatlar ro'yxati (oxirgi 10 ta)
    const recentServices = await CarService.find(serviceFilter)
      .populate('car', 'licensePlate brand model')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('totalPrice status updatedAt car createdBy');

    // Ustoz daromadi = Xizmatlardan + Vazifalardan master ulushi
    const masterEarnings = totalServiceEarnings + masterEarningsFromTasks;

    // Jami daromad
    const totalEarnings = masterEarnings + totalApprenticeEarnings;

    // Tasdiqlangan vazifalar soni
    const approvedTasksCount = await Task.countDocuments({ 
      status: 'approved',
      apprenticeEarning: { $exists: true, $gt: 0 },
      ...dateFilter
    });

    res.json({
      success: true,
      earnings: {
        total: totalEarnings,
        master: masterEarnings,
        masterFromTasks: masterEarningsFromTasks,
        masterFromServices: totalServiceEarnings,
        apprentices: totalApprenticeEarnings,
        apprenticeList: apprenticeEarnings,
        serviceCount: serviceCount,
        taskCount: approvedTasksCount,
        recentServices: recentServices
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Daromadlarni olishda xatolik',
      error: error.message
    });
  }
};
