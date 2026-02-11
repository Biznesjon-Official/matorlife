import mongoose from 'mongoose';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const resetTaskEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // Barcha vazifalarni topish
    const tasks = await Task.find({});
    console.log(`\n📊 Jami vazifalar soni: ${tasks.length}`);

    if (tasks.length === 0) {
      console.log('❌ Vazifalar topilmadi');
      await mongoose.connection.close();
      return;
    }

    // Vazifalar ichidagi daromadlarni ko'rsatish
    console.log('\n📋 Vazifalarning hozirgi daromadlari:');
    let totalOldEarnings = 0;
    tasks.forEach((task, index) => {
      if (task.apprenticeEarning && task.apprenticeEarning > 0) {
        console.log(`${index + 1}. ${task.title}:`);
        console.log(`   💰 Shogird daromadi: ${task.apprenticeEarning.toLocaleString()} so'm`);
        console.log(`   💎 To'lov: ${task.payment?.toLocaleString() || 0} so'm`);
        totalOldEarnings += task.apprenticeEarning;
      }
      if (task.assignments && task.assignments.length > 0) {
        task.assignments.forEach((assignment: any) => {
          if (assignment.earning > 0) {
            console.log(`${index + 1}. ${task.title} (yangi tizim):`);
            console.log(`   💰 Shogird daromadi: ${assignment.earning.toLocaleString()} so'm`);
            totalOldEarnings += assignment.earning;
          }
        });
      }
    });
    console.log(`\n💵 Jami eski daromadlar: ${totalOldEarnings.toLocaleString()} so'm`);

    // Barcha vazifalarning daromadlarini 0 ga o'zgartirish
    const result = await Task.updateMany(
      {},
      { 
        $set: { 
          apprenticeEarning: 0,
          masterEarning: 0,
          payment: 0,
          'assignments.$[].earning': 0,
          'assignments.$[].masterShare': 0,
          'assignments.$[].allocatedAmount': 0
        } 
      }
    );

    console.log(`\n✅ ${result.modifiedCount} ta vazifaning daromadi 0 so'mga qaytarildi`);

    // Yangilangan ma'lumotlarni ko'rsatish
    const updatedTasks = await Task.find({});
    let totalNewEarnings = 0;
    console.log('\n📋 Yangilangan daromadlar:');
    updatedTasks.forEach((task, index) => {
      if (task.apprenticeEarning && task.apprenticeEarning > 0) {
        console.log(`${index + 1}. ${task.title}:`);
        console.log(`   💰 Shogird daromadi: ${task.apprenticeEarning.toLocaleString()} so'm`);
        totalNewEarnings += task.apprenticeEarning;
      }
      if (task.assignments && task.assignments.length > 0) {
        task.assignments.forEach((assignment: any) => {
          if (assignment.earning > 0) {
            console.log(`${index + 1}. ${task.title} (yangi tizim):`);
            console.log(`   💰 Shogird daromadi: ${assignment.earning.toLocaleString()} so'm`);
            totalNewEarnings += assignment.earning;
          }
        });
      }
    });
    console.log(`\n💵 Jami yangi daromadlar: ${totalNewEarnings.toLocaleString()} so'm`);

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

resetTaskEarnings();
