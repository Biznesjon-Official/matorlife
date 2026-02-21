import cron from 'node-cron';
import User from '../models/User';
import WeeklyHistory from '../models/WeeklyHistory';
import Task from '../models/Task';

export const startWeeklyResetJob = () => {
  // Har yakshanba kuni soat 00:00 da ishga tushadi
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log('🔄 Haftalik reset boshlandi...');
      
      // Barcha shogirtlarni topish
      const apprentices = await User.find({ role: 'apprentice' });
      
      for (const apprentice of apprentices) {
        // Hozirgi haftada bajarilgan vazifalar sonini hisoblash
        const completedTasksCount = await Task.countDocuments({
          assignedTo: apprentice._id,
          status: 'completed',
          completedAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Oxirgi 7 kun
          }
        });

        // Hozirgi daromadlarni tarixga saqlash
        await WeeklyHistory.create({
          userId: apprentice._id,
          weekEndDate: new Date(),
          totalEarnings: apprentice.totalEarnings || 0,
          taskEarnings: apprentice.taskEarnings || 0,
          completedTasks: completedTasksCount,
          createdAt: new Date()
        });

        // Daromadlarni 0 ga o'rnatish
        apprentice.totalEarnings = 0;
        apprentice.taskEarnings = 0;
        await apprentice.save();

        console.log(`✅ ${apprentice.name} daromadilar reset qilindi`);
      }
      
      console.log('✅ Haftalik reset muvaffaqiyatli tugadi!');
    } catch (error) {
      console.error('❌ Haftalik reset xatosi:', error);
    }
  });

  console.log('📅 Haftalik reset cron job ishga tushdi (Har yakshanba 00:00)');
};
