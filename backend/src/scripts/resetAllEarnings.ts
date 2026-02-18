import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const resetAllEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha shogirtlarning daromadini 0 ga qaytarish
    console.log('\n📊 1. Shogirtlar daromadini 0ga qaytarish...');
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`   Jami shogirtlar: ${apprentices.length}`);

    const userResult = await User.updateMany(
      { role: 'apprentice' },
      { $set: { earnings: 0, totalEarnings: 0 } }
    );
    console.log(`   ✅ ${userResult.modifiedCount} ta shogirtning daromadi 0ga qaytarildi`);

    // 2. Barcha vazifalar ichidagi daromadlarni 0 ga qaytarish
    console.log('\n📋 2. Vazifalar ichidagi daromadlarni 0ga qaytarish...');
    const allTasks = await Task.find({});
    console.log(`   Jami vazifalar: ${allTasks.length}`);

    // Eski tizim: apprenticeEarning va masterEarning
    const oldSystemResult = await Task.updateMany(
      {},
      { 
        $set: { 
          apprenticeEarning: 0,
          masterEarning: 0,
          payment: 0
        } 
      }
    );
    console.log(`   ✅ ${oldSystemResult.modifiedCount} ta vazifaning eski tizim daromadi 0ga qaytarildi`);

    // Yangi tizim: assignments array ichidagi earning
    const tasksWithAssignments = await Task.find({ 'assignments.0': { $exists: true } });
    console.log(`   Assignments bilan vazifalar: ${tasksWithAssignments.length}`);

    for (const task of tasksWithAssignments) {
      if (task.assignments && task.assignments.length > 0) {
        task.assignments = task.assignments.map((assignment: any) => ({
          ...assignment,
          earning: 0,
          masterShare: assignment.allocatedAmount || 0
        }));
        await task.save();
      }
    }
    console.log(`   ✅ ${tasksWithAssignments.length} ta vazifaning yangi tizim daromadi 0ga qaytarildi`);

    // 3. Natijalarni ko'rsatish
    console.log('\n📊 Yakuniy natijalar:');
    const updatedApprentices = await User.find({ role: 'apprentice' });
    updatedApprentices.forEach((apprentice, index) => {
      console.log(`${index + 1}. ${apprentice.name}:`);
      console.log(`   💰 Jami daromad: ${apprentice.totalEarnings} so'm`);
      console.log(`   💎 Jami daromad: ${apprentice.totalEarnings} so'm`);
    });

    // Vazifalar statistikasi
    const tasksWithEarnings = await Task.find({
      $or: [
        { apprenticeEarning: { $gt: 0 } },
        { 'assignments.earning': { $gt: 0 } }
      ]
    });
    console.log(`\n📋 Daromadli vazifalar: ${tasksWithEarnings.length} ta`);

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
    console.log('\n🎉 Barcha daromadlar muvaffaqiyatli 0ga qaytarildi!');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

resetAllEarnings();
