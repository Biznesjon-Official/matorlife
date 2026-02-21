// Test script - Manual haftalik reset
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import WeeklyHistory from '../models/WeeklyHistory';
import Task from '../models/Task';

dotenv.config();

const testWeeklyReset = async () => {
  try {
    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ MongoDB ga ulandi');

    console.log('🔄 Test haftalik reset boshlandi...');
    
    // Barcha shogirtlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📊 Jami ${apprentices.length} ta shogirt topildi`);
    
    for (const apprentice of apprentices) {
      console.log(`\n👤 ${apprentice.name}:`);
      console.log(`   Hozirgi totalEarnings: ${apprentice.totalEarnings}`);
      console.log(`   Hozirgi taskEarnings: ${apprentice.taskEarnings}`);

      // Hozirgi haftada bajarilgan vazifalar sonini hisoblash
      const completedTasksCount = await Task.countDocuments({
        assignedTo: apprentice._id,
        status: 'completed',
        completedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
      console.log(`   ✅ Tarixga saqlandi (ID: ${history._id})`);

      // Daromadlarni 0 ga o'rnatish
      apprentice.totalEarnings = 0;
      apprentice.taskEarnings = 0;
      await apprentice.save();
      console.log(`   ✅ Daromadlar 0 ga o'rnatildi`);
    }
    
    console.log('\n✅ Test haftalik reset muvaffaqiyatli tugadi!');
    
    // Tarixni ko'rsatish
    console.log('\n📜 Haftalik tarix:');
    const allHistory = await WeeklyHistory.find()
      .populate('userId', 'name')
      .sort({ weekEndDate: -1 })
      .limit(10);
    
    allHistory.forEach((h: any) => {
      console.log(`   ${h.userId.name}: ${h.totalEarnings} so'm (${h.completedTasks} vazifa)`);
    });

    await mongoose.disconnect();
    console.log('\n✅ MongoDB dan uzildi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xato:', error);
    process.exit(1);
  }
};

testWeeklyReset();
