import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const clearApprenticeTasksAndEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha shogirtlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`\n📊 Jami shogirtlar soni: ${apprentices.length}`);

    if (apprentices.length === 0) {
      console.log('❌ Shogirtlar topilmadi');
      await mongoose.connection.close();
      return;
    }

    // 2. Har bir shogirtning hozirgi holatini ko'rsatish
    console.log('\n📋 Shogirtlarning hozirgi holati:');
    for (const apprentice of apprentices) {
      // Shogirtga tegishli vazifalarni topish
      const tasks = await Task.find({
        $or: [
          { assignedTo: apprentice._id },
          { 'assignments.apprentice': apprentice._id }
        ]
      });

      console.log(`\n${apprentice.name} (${apprentice.username}):`);
      console.log(`   💰 Joriy oylik: ${apprentice.earnings.toLocaleString()} so'm`);
      console.log(`   💎 Jami daromad: ${apprentice.totalEarnings.toLocaleString()} so'm`);
      console.log(`   📝 Vazifalar soni: ${tasks.length} ta`);
    }

    // 3. Barcha shogirtlarning daromadini 0 ga o'rnatish
    console.log('\n🔄 Shogirtlarning daromadini 0 ga o\'rnatish...');
    const userUpdateResult = await User.updateMany(
      { role: 'apprentice' },
      { $set: { earnings: 0, totalEarnings: 0 } }
    );
    console.log(`✅ ${userUpdateResult.modifiedCount} ta shogirtning daromadi 0 ga o'rnatildi`);

    // 4. Barcha vazifalarni o'chirish
    console.log('\n🗑️  Barcha vazifalarni o\'chirish...');
    const taskDeleteResult = await Task.deleteMany({});
    console.log(`✅ ${taskDeleteResult.deletedCount} ta vazifa o'chirildi`);

    // 5. Yangilangan holatni ko'rsatish
    console.log('\n📋 Yangilangan holat:');
    const updatedApprentices = await User.find({ role: 'apprentice' });
    for (const apprentice of updatedApprentices) {
      const tasks = await Task.find({
        $or: [
          { assignedTo: apprentice._id },
          { 'assignments.apprentice': apprentice._id }
        ]
      });

      console.log(`\n${apprentice.name} (${apprentice.username}):`);
      console.log(`   💰 Joriy oylik: ${apprentice.earnings.toLocaleString()} so'm`);
      console.log(`   💎 Jami daromad: ${apprentice.totalEarnings.toLocaleString()} so'm`);
      console.log(`   📝 Vazifalar soni: ${tasks.length} ta`);
    }

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
    console.log('\n🎉 Barcha shogirtlarning daromadi va vazifalari tozalandi!');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

clearApprenticeTasksAndEarnings();
