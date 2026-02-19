import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Task from '../models/Task';

dotenv.config();

const deductNarzulloTaskEarnings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ MongoDB ga ulandi');

    // Narzullo ni topish
    const narzullo = await User.findOne({ 
      name: { $regex: /narzullo/i },
      role: 'apprentice'
    });

    if (!narzullo) {
      console.log('❌ Narzullo topilmadi');
      process.exit(1);
    }

    console.log('\n📊 NARZULLO:');
    console.log('   ID:', narzullo._id);
    console.log('   Ism:', narzullo.name);

    // Narzullo ning barcha approved vazifalarini topish
    const tasks = await Task.find({
      assignedTo: narzullo._id,
      status: 'approved'
    }).sort({ createdAt: -1 });

    console.log('\n📋 APPROVED VAZIFALAR:');
    let totalEarnings = 0;
    tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title}`);
      console.log(`      Daromad: ${task.apprenticeEarning?.toLocaleString()} so'm`);
      console.log(`      Sana: ${task.createdAt?.toLocaleDateString()}`);
      totalEarnings += task.apprenticeEarning || 0;
    });

    console.log('\n💰 JAMI DAROMAD:', totalEarnings.toLocaleString(), 'so\'m');

    // 2,000,000 so'm ayirish
    const deductAmount = 2000000;
    let remaining = deductAmount;

    console.log('\n🔄 2,000,000 SO\'M AYIRILMOQDA...');

    // Eng oxirgi vazifalardan boshlab ayirish
    for (const task of tasks) {
      if (remaining <= 0) break;

      const taskEarning = task.apprenticeEarning || 0;
      if (taskEarning > 0) {
        const deduct = Math.min(remaining, taskEarning);
        task.apprenticeEarning = taskEarning - deduct;
        await task.save();

        console.log(`   ✅ ${task.title}: ${taskEarning.toLocaleString()} → ${task.apprenticeEarning.toLocaleString()} so'm`);
        remaining -= deduct;
      }
    }

    console.log('\n✅ YANGILANDI:');
    console.log('   Ayirilgan summa:', (deductAmount - remaining).toLocaleString(), 'so\'m');
    console.log('   Qolgan ayirish kerak:', remaining.toLocaleString(), 'so\'m');

    // Yangi jami daromadni hisoblash
    const updatedTasks = await Task.find({
      assignedTo: narzullo._id,
      status: 'approved'
    });

    const newTotal = updatedTasks.reduce((sum, task) => sum + (task.apprenticeEarning || 0), 0);
    console.log('   Yangi jami daromad:', newTotal.toLocaleString(), 'so\'m');

    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanish yopildi');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

deductNarzulloTaskEarnings();
