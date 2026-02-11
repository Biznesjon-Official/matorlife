import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Reminder from '../models/Reminder';
import mongoose from 'mongoose';

// Barcha eslatmalarni olish
export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { status } = req.query;

    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    const reminders = await Reminder.find(filter)
      .sort({ reminderDate: 1, reminderTime: 1 })
      .lean();

    res.json(reminders);
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Eslatmalarni yuklashda xatolik', error: error.message });
  }
};

// Bitta eslatmani olish
export const getReminderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Noto\'g\'ri ID format' });
    }

    const reminder = await Reminder.findOne({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ message: 'Eslatma topilmadi' });
    }

    res.json(reminder);
  } catch (error: any) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ message: 'Eslatmani yuklashda xatolik', error: error.message });
  }
};

// Yangi eslatma yaratish
export const createReminder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { title, description, reminderDate, reminderTime } = req.body;

    // Validatsiya
    if (!title || !reminderDate || !reminderTime) {
      return res.status(400).json({ 
        message: 'Sarlavha, sana va vaqt majburiy' 
      });
    }

    // Vaqt formatini tekshirish
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(reminderTime)) {
      return res.status(400).json({ 
        message: 'Vaqt formati noto\'g\'ri (HH:mm bo\'lishi kerak)' 
      });
    }

    // Bir xil vaqtda eslatma borligini tekshirish
    const existingReminder = await Reminder.findOne({
      userId,
      reminderDate: new Date(reminderDate),
      reminderTime,
      status: 'active'
    });

    if (existingReminder) {
      return res.status(400).json({ 
        message: 'Bu vaqtda allaqachon eslatma mavjud. Boshqa vaqt tanlang.' 
      });
    }

    const reminder = new Reminder({
      userId,
      title,
      description,
      reminderDate: new Date(reminderDate),
      reminderTime,
      status: 'active',
      isNotified: false,
      notificationSent: false
    });

    await reminder.save();

    res.status(201).json(reminder);
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Eslatma yaratishda xatolik', error: error.message });
  }
};

// Eslatmani yangilash
export const updateReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { title, description, reminderDate, reminderTime, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Noto\'g\'ri ID format' });
    }

    // Vaqt formatini tekshirish (agar yangilanayotgan bo'lsa)
    if (reminderTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(reminderTime)) {
        return res.status(400).json({ 
          message: 'Vaqt formati noto\'g\'ri (HH:mm bo\'lishi kerak)' 
        });
      }
    }

    // Agar sana yoki vaqt yangilanayotgan bo'lsa, bir xil vaqtda eslatma borligini tekshirish
    if (reminderDate || reminderTime) {
      const checkDate = reminderDate ? new Date(reminderDate) : undefined;
      const checkTime = reminderTime;

      const existingReminder = await Reminder.findOne({
        _id: { $ne: id },
        userId,
        ...(checkDate && { reminderDate: checkDate }),
        ...(checkTime && { reminderTime: checkTime }),
        status: 'active'
      });

      if (existingReminder) {
        return res.status(400).json({ 
          message: 'Bu vaqtda allaqachon eslatma mavjud. Boshqa vaqt tanlang.' 
        });
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (reminderDate) updateData.reminderDate = new Date(reminderDate);
    if (reminderTime) updateData.reminderTime = reminderTime;
    if (status) {
      updateData.status = status;
      // Agar status 'active' ga o'zgartirilayotgan bo'lsa, notification flaglarini reset qilish
      if (status === 'active') {
        updateData.isNotified = false;
        updateData.notificationSent = false;
      }
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Eslatma topilmadi' });
    }

    res.json(reminder);
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Eslatmani yangilashda xatolik', error: error.message });
  }
};

// Eslatmani o'chirish
export const deleteReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Noto\'g\'ri ID format' });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ message: 'Eslatma topilmadi' });
    }

    res.json({ message: 'Eslatma o\'chirildi', reminder });
  } catch (error: any) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Eslatmani o\'chirishda xatolik', error: error.message });
  }
};

// Vaqti o'tgan eslatmalarni arxivlash
export const archiveExpiredReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const now = new Date();
    
    // Bugungi sanani olish (00:00:00)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // Bugunning oxiri (23:59:59)
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Hozirgi vaqtni HH:mm formatida olish
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const result = await Reminder.updateMany(
      {
        userId,
        status: 'active',
        $or: [
          // O'tgan kunlar
          { reminderDate: { $lt: todayStart } },
          // Bugungi kun, lekin vaqti o'tgan eslatmalar
          {
            reminderDate: {
              $gte: todayStart,
              $lte: todayEnd
            },
            reminderTime: { $lt: currentTime }
          }
        ]
      },
      { status: 'archived' }
    );

    res.json({ 
      message: 'Vaqti o\'tgan eslatmalar arxivlandi', 
      count: result.modifiedCount 
    });
  } catch (error: any) {
    console.error('Error archiving reminders:', error);
    res.status(500).json({ message: 'Eslatmalarni arxivlashda xatolik', error: error.message });
  }
};

// Vaqti kelgan eslatmalarni olish (notification uchun)
export const getPendingReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const now = new Date();
    
    // Hozirgi vaqtni olish (local timezone)
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentTimeNum = parseInt(hours + minutes);
    
    // Bugungi sanani olish (YYYY-MM-DD format)
    const todayDateStr = now.toISOString().split('T')[0];
    
    console.log('🔍 getPendingReminders - Hozirgi vaqt:', currentTime, 'Raqam:', currentTimeNum, 'Sana:', todayDateStr);

    // Barcha faol eslatmalarni olish (isNotified: false bo'lganlarni)
    const allReminders = await Reminder.find({
      userId,
      status: 'active',
      isNotified: false
    }).lean();

    console.log('📋 Barcha eslatmalar:', allReminders.length);

    // Bugungi eslatmalarni va vaqti kelganlarini topish
    const reminders = allReminders.filter(reminder => {
      // reminderDate ni YYYY-MM-DD formatiga o'tkazish
      const reminderDateStr = reminder.reminderDate.toISOString().split('T')[0];
      const reminderTimeNum = parseInt(reminder.reminderTime.replace(':', ''));
      
      // Bugun va vaqti kelgan eslatmalarni topish
      const isToday = reminderDateStr === todayDateStr;
      const isTimeReached = reminderTimeNum <= currentTimeNum;
      const match = isToday && isTimeReached;
      
      console.log(`⏰ Tekshirish: ${reminderDateStr} === ${todayDateStr} && ${reminder.reminderTime} (${reminderTimeNum}) <= ${currentTime} (${currentTimeNum}) = ${match}`);
      return match;
    });

    console.log('📋 Topilgan eslatmalar (vaqti kelgan):', reminders.length);
    if (reminders.length > 0) {
      console.log('📢 Eslatmalar:', reminders.map(r => ({ title: r.title, time: r.reminderTime })));
    }

    // Bildirishnoma yuborilgan deb belgilash (faqat topilgan eslatmalarni)
    if (reminders.length > 0) {
      await Reminder.updateMany(
        { _id: { $in: reminders.map(r => r._id) } },
        { isNotified: true }
      );
    }

    res.json(reminders);
  } catch (error: any) {
    console.error('Error fetching pending reminders:', error);
    res.status(500).json({ message: 'Eslatmalarni yuklashda xatolik', error: error.message });
  }
};

// 30 daqiqa oldin ogohlantirish uchun eslatmalarni olish
export const getUpcomingReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60000);

    // Hozirgi vaqtni olish (local timezone)
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentTimeNum = parseInt(hours + minutes);

    // 30 daqiqadan keyin vaqtni olish
    const in30Hours = in30Minutes.getHours().toString().padStart(2, '0');
    const in30Mins = in30Minutes.getMinutes().toString().padStart(2, '0');
    const targetTime = `${in30Hours}:${in30Mins}`;
    const targetTimeNum = parseInt(in30Hours + in30Mins);

    // Bugungi sanani olish (YYYY-MM-DD format)
    const todayDateStr = now.toISOString().split('T')[0];

    console.log('⏰ getUpcomingReminders - Hozirgi vaqt:', currentTime, 'Target vaqt:', targetTime, 'Sana:', todayDateStr);

    // Barcha faol eslatmalarni olish
    const allReminders = await Reminder.find({
      userId,
      status: 'active'
    }).lean();

    console.log('📋 Barcha eslatmalar:', allReminders.length);

    // 30 daqiqa orasidagi eslatmalarni topish
    const reminders = allReminders.filter(reminder => {
      // reminderDate ni YYYY-MM-DD formatiga o'tkazish
      const reminderDateStr = reminder.reminderDate.toISOString().split('T')[0];
      const reminderTimeNum = parseInt(reminder.reminderTime.replace(':', ''));

      // Bugun va 30 daqiqa orasidagi eslatmalarni topish
      const isToday = reminderDateStr === todayDateStr;
      const isInRange = reminderTimeNum > currentTimeNum && reminderTimeNum <= targetTimeNum;
      const match = isToday && isInRange;

      console.log(`⏰ 30min tekshirish: ${reminderDateStr} === ${todayDateStr} && ${reminder.reminderTime} (${reminderTimeNum}) > ${currentTime} (${currentTimeNum}) && <= ${targetTime} (${targetTimeNum}) = ${match}`);
      return match;
    });

    console.log('📋 Kelayotgan eslatmalar (30 min orasida):', reminders.length);
    if (reminders.length > 0) {
      console.log('📢 Eslatmalar:', reminders.map(r => ({ title: r.title, time: r.reminderTime })));
    }

    // 30 daqiqa oldin notification yuborilgan deb belgilash
    if (reminders.length > 0) {
      await Reminder.updateMany(
        { _id: { $in: reminders.map(r => r._id) } },
        { notificationSent: true }
      );
    }

    res.json(reminders);
  } catch (error: any) {
    console.error('Error fetching upcoming reminders:', error);
    res.status(500).json({ message: 'Eslatmalarni yuklashda xatolik', error: error.message });
  }
};
