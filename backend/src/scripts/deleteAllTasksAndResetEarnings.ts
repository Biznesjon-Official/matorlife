import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Task from '../models/Task';
import Transaction from '../models/Transaction';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const deleteAllTasksAndResetEarnings = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha vazifalarni o'chirish
    const tasksResult = await Task.deleteMany({});
    console.log(`🗑️ ${tasksResult.deletedCount} ta vazifa o'chirildi`);

    // 2. Barcha transaksiyalarni o'chirish
    const transactionsResult = await Transaction.deleteMany({});
    console.log(`🗑️ ${transactionsResult.deletedCount} ta transaksiya o'chirildi`);

    // 3. Barcha foydalanuvchilarning earnings va totalEarnings ni 0 ga qaytarish
    const users = await User.find({});
    let resetCount = 0;

    for (const user of users) {
      const oldEarnings = user.earnings;
      const oldTotalEarnings = user.totalEarnings;

      user.earnings = 0;
      user.totalEarnings = 0;
      await user.save();

      console.log(`✅ ${user.name}: earnings ${oldEarnings} → 0, totalEarnings ${oldTotalEarnings} → 0`);
      resetCount++;
    }

    console.log(`\n✅ Jami ${resetCount} ta foydalanuvchi yangilandi`);
    console.log('✅ Barcha vazifalar va pullar o\'chirildi!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

deleteAllTasksAndResetEarnings();
