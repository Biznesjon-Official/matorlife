import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Task from '../models/Task';

dotenv.config();

const deductNarzulloAssignments = async () => {
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

    // Narzullo ning barcha approved vazifalarini topish (assignments bilan)
    const tasks = await Task.find({
      status: 'approved',
      'assignments.apprentice': narzullo._id
    }).sort({ createdAt: -1 });

    console.log('\n📋 APPROVED VAZIFALAR (ASSIGNMENTS):');
    let totalEarnings = 0;
    
    tasks.forEach((task, index) => {
      const assignment = task.assignments.find(a => a.apprentice.toString() === narzullo._id.toString());
      if (assignment) {
        console.log(`   ${index + 1}. ${task.title}`);
        console.log(`      Daromad: ${assignment.earning?.toLocaleString()} so'm`);
        console.log(`      Foiz: ${assignment.percentage}%`);
        console.log(`      Sana: ${task.createdAt?.toLocaleDateString()}`);
        totalEarnings += assignment.earning || 0;
      }
    });

    console.log('\n💰 JAMI DAROMAD:', totalEarnings.toLocaleString(), 'so\'m');

    // 2,000,000 so'm ayirish
    const deductAmount = 2000000;
    let remaining = deductAmount;

    console.log('\n🔄 2,000,000 SO\'M AYIRILMOQDA...');

    // Eng oxirgi vazifalardan boshlab ayirish
    for (const task of tasks) {
      if (remaining <= 0) break;

      const assignmentIndex = task.assignments.findIndex(
        a => a.apprentice.toString() === narzullo._id.toString()
      );

      if (assignmentIndex !== -1) {
        const assignment = task.assignments[assignmentIndex];
        const currentEarning = assignment.earning || 0;

        if (currentEarning > 0) {
          const deduct = Math.min(remaining, currentEarning);
          const newEarning = currentEarning - deduct;
          
          // Assignment ni yangilash
          task.assignments[assignmentIndex].earning = newEarning;
          
          // Master share ni qayta hisoblash
          const allocatedAmount = assignment.allocatedAmount || 0;
          task.assignments[assignmentIndex].masterShare = allocatedAmount - newEarning;
          
          await task.save();

          console.log(`   ✅ ${task.title}: ${currentEarning.toLocaleString()} → ${newEarning.toLocaleString()} so'm`);
          remaining -= deduct;
        }
      }
    }

    console.log('\n✅ YANGILANDI:');
    console.log('   Ayirilgan summa:', (deductAmount - remaining).toLocaleString(), 'so\'m');
    console.log('   Qolgan ayirish kerak:', remaining.toLocaleString(), 'so\'m');

    // Yangi jami daromadni hisoblash
    const updatedTasks = await Task.find({
      status: 'approved',
      'assignments.apprentice': narzullo._id
    });

    let newTotal = 0;
    updatedTasks.forEach(task => {
      const assignment = task.assignments.find(a => a.apprentice.toString() === narzullo._id.toString());
      if (assignment) {
        newTotal += assignment.earning || 0;
      }
    });

    console.log('   Yangi jami daromad:', newTotal.toLocaleString(), 'so\'m');

    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanish yopildi');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

deductNarzulloAssignments();
