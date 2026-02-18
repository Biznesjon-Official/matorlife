import mongoose from 'mongoose';
import Task from '../models/Task';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const deleteAllApprenticeTasks = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha vazifalarni ko'rsatish
    const allTasks = await Task.find({})
      .populate('assignedTo', 'name')
      .populate('car', 'make carModel licensePlate');
    
    console.log(`\n📊 Jami vazifalar: ${allTasks.length}`);
    
    if (allTasks.length === 0) {
      console.log('❌ Vazifalar topilmadi');
      await mongoose.connection.close();
      return;
    }

    // Vazifalarni ko'rsatish
    console.log('\n📋 Barcha vazifalar:');
    allTasks.forEach((task, index) => {
      const assignedToName = task.assignedTo && typeof task.assignedTo === 'object' && 'name' in task.assignedTo 
        ? (task.assignedTo as any).name 
        : 'Noma\'lum';
      const carInfo = task.car && typeof task.car === 'object' && 'make' in task.car
        ? `${(task.car as any).make} ${(task.car as any).carModel} (${(task.car as any).licensePlate})`
        : 'Mashina yo\'q';
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   👤 Shogird: ${assignedToName}`);
      console.log(`   🚗 Mashina: ${carInfo}`);
      console.log(`   📊 Status: ${task.status}`);
      console.log(`   💰 To'lov: ${task.payment || 0} so'm`);
      console.log(`   ⏰ Soatlar: ${task.estimatedHours || 0} soat`);
    });

    // 2. Barcha vazifalarni o'chirish
    console.log('\n🗑️  Barcha vazifalarni o\'chirish...');
    const deleteResult = await Task.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} ta vazifa o'chirildi`);

    // 3. Barcha shogirtlarning daromadini 0 ga qaytarish
    console.log('\n💰 Barcha shogirtlarning daromadini 0ga qaytarish...');
    const userResult = await User.updateMany(
      { role: 'apprentice' },
      { $set: { earnings: 0, totalEarnings: 0 } }
    );
    console.log(`✅ ${userResult.modifiedCount} ta shogirtning daromadi 0ga qaytarildi`);

    // 4. Natijalarni ko'rsatish
    console.log('\n📊 Yakuniy natijalar:');
    const remainingTasks = await Task.find({});
    console.log(`   Qolgan vazifalar: ${remainingTasks.length} ta`);

    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`\n👥 Shogirtlar holati:`);
    apprentices.forEach((apprentice, index) => {
      console.log(`${index + 1}. ${apprentice.name}:`);
      console.log(`   💰 Jami daromad: ${apprentice.totalEarnings} so'm`);
      console.log(`   💎 Jami daromad: ${apprentice.totalEarnings} so'm`);
    });

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
    console.log('\n🎉 Barcha vazifalar va daromadlar muvaffaqiyatli o\'chirildi!');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

deleteAllApprenticeTasks();
