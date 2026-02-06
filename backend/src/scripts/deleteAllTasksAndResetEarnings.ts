import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const deleteAllTasksAndResetEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha vazifalarni o'chirish
    console.log('\n🗑️  Barcha vazifalarni o\'chirish...');
    const taskDeleteResult = await Task.deleteMany({});
    console.log(`✅ ${taskDeleteResult.deletedCount} ta vazifa o'chirildi`);

    // 2. Barcha shogirtlarning daromadini 0 ga qaytarish
    console.log('\n💰 Shogirtlar daromadini 0 ga qaytarish...');
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📊 Jami shogirtlar soni: ${apprentices.length}`);

    if (apprentices.length > 0) {
      console.log('\n📋 Shogirtlarning hozirgi daromadlari:');
      apprentices.forEach((apprentice, index) => {
        console.log(`${index + 1}. ${apprentice.name} (${apprentice.username}):`);
        console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
        console.log(`   💎 Jami daromad (totalEarnings): ${apprentice.totalEarnings.toLocaleString()} so'm`);
      });

      // Barcha shogirtlarning earnings va totalEarnings ni 0 ga o'zgartirish
      const userUpdateResult = await User.updateMany(
        { role: 'apprentice' },
        { $set: { earnings: 0, totalEarnings: 0 } }
      );

      console.log(`\n✅ ${userUpdateResult.modifiedCount} ta shogirtning daromadi 0 so'mga qaytarildi`);

      // Yangilangan ma'lumotlarni ko'rsatish
      const updatedApprentices = await User.find({ role: 'apprentice' });
      console.log('\n📋 Yangilangan daromadlar:');
      updatedApprentices.forEach((apprentice, index) => {
        console.log(`${index + 1}. ${apprentice.name} (${apprentice.username}):`);
        console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
        console.log(`   💎 Jami daromad (totalEarnings): ${apprentice.totalEarnings.toLocaleString()} so'm`);
      });
    }

    console.log('\n✅ Barcha vazifalar va daromadlar tozalandi!');
    console.log('📝 Natija:');
    console.log(`   - O'chirilgan vazifalar: ${taskDeleteResult.deletedCount} ta`);
    console.log(`   - Yangilangan shogirtlar: ${apprentices.length} ta`);

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

deleteAllTasksAndResetEarnings();
