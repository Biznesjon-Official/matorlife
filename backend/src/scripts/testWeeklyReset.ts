import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import WeeklyHistory from '../models/WeeklyHistory';
import Task from '../models/Task';

dotenv.config();

const testWeeklyReset = async () => {
  try {
    console.log('🔄 Haftalik reset test boshlandi...');
    
    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ MongoDB ga ulandi');

    // Barcha shogirtlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📊 Topilgan shogirtlar: ${apprentices.length}`);

    for (const apprentice of apprentices) {
      console.log(`\n👤 Shogirt: ${apprentice.name}`);
      console.log(`   Hozirgi totalEarnings: ${apprentice.totalEarnings}`);
      console.log(`   Hozirgi taskEarnings: ${apprentice.taskEarnings || 0}`);

      // Hozirgi haftada bajarilgan vazifalar sonini hisoblash
      const completedTasksCount = await Task.countDocuments({
        assignedTo: apprentice._id,
        status: 'completed',
        completedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Oxirgi 7 kun
        }
      });

      console.log(`   Bajarilgan vazifalar: ${completedTasksCount}`);

      // Hozirgi daromadlarni tarixga saqlash
      const history = await WeeklyHistory.create({
        userId: apprentice._id,
        weekEndDate: new Date(),
        totalEarnings: apprentice.totalEarnings || 0,
        taskEarnings: apprentice.taskEarnings || 0,
        completedTasks: completedTasksCount,
        createdAt: new Date()
      });

      console.log(`   ✅ Tarixga saqlandi: ${history._id}`);

      // Daromadlarni 0 ga o'rnatish
      apprentice.totalEarnings = 0;
      apprentice.taskEarnings = 0;
      await apprentice.save();

      console.log(`   ✅ Daromadlar 0 ga o'rnatildi`);
    }

    console.log('\n✅ Haftalik reset muvaffaqiyatli tugadi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xato:', error);
    process.exit(1);
  }
};

testWeeklyReset();
