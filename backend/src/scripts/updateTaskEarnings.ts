import mongoose from 'mongoose';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const updateTaskEarnings = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ MongoDB ga ulandi');

    // Barcha vazifalarni olish
    const tasks = await Task.find({});
    console.log(`📋 Jami ${tasks.length} ta vazifa topildi`);

    let updatedCount = 0;

    for (const task of tasks) {
      // Agar apprenticeEarning va masterEarning bo'lmasa, hisoblash
      if (!task.apprenticeEarning || !task.masterEarning) {
        const percentage = task.apprenticePercentage || 50;
        const payment = task.payment || 0;
        
        task.apprenticePercentage = percentage;
        task.apprenticeEarning = (payment * percentage) / 100;
        task.masterEarning = payment - task.apprenticeEarning;
        
        await task.save();
        updatedCount++;
        
        console.log(`✅ Vazifa yangilandi: ${task.title} - Shogird: ${task.apprenticeEarning}, Ustoz: ${task.masterEarning}`);
      }
    }

    console.log(`\n🎉 ${updatedCount} ta vazifa muvaffaqiyatli yangilandi!`);
    
    await mongoose.connection.close();
    console.log('✅ MongoDB ulanishi yopildi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

updateTaskEarnings();
