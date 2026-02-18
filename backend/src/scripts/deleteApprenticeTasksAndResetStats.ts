import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const deleteApprenticeTasksAndResetStats = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // 1. Barcha shogirtlarni topish
    console.log('\n📊 1. Shogirtlar ma\'lumotlari:');
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`   Jami shogirtlar: ${apprentices.length}`);

    // 2. Har bir shogirtning vazifalarini topish va o'chirish
    console.log('\n📋 2. Shogirtlar vazifalarini o\'chirish:');
    let totalDeletedTasks = 0;

    for (const apprentice of apprentices) {
      // Eski tizim: assignedTo
      const oldSystemTasks = await Task.find({ assignedTo: apprentice._id });
      
      // Yangi tizim: assignments array
      const newSystemTasks = await Task.find({ 'assignments.apprentice': apprentice._id });
      
      const allApprenticeTasks = [...oldSystemTasks, ...newSystemTasks];
      const uniqueTasks = Array.from(new Set(allApprenticeTasks.map(t => t._id.toString())))
        .map(id => allApprenticeTasks.find(t => t._id.toString() === id));

      console.log(`\n   ${apprentice.name}:`);
      console.log(`   - Vazifalar soni: ${uniqueTasks.length}`);
      
      if (uniqueTasks.length > 0) {
        // Vazifalarni o'chirish
        const taskIds = uniqueTasks.map(t => t!._id);
        const deleteResult = await Task.deleteMany({ _id: { $in: taskIds } });
        console.log(`   - O'chirildi: ${deleteResult.deletedCount} ta vazifa`);
        totalDeletedTasks += deleteResult.deletedCount;
      }
    }

    // 3. Barcha shogirtlarning daromadini 0 ga qaytarish
    console.log('\n💰 3. Shogirtlar daromadini 0ga qaytarish:');
    const userResult = await User.updateMany(
      { role: 'apprentice' },
      { $set: { earnings: 0, totalEarnings: 0 } }
    );
    console.log(`   ✅ ${userResult.modifiedCount} ta shogirtning daromadi 0ga qaytarildi`);

    // 4. Natijalarni ko'rsatish
    console.log('\n📊 Yakuniy natijalar:');
    console.log(`   🗑️  Jami o'chirilgan vazifalar: ${totalDeletedTasks} ta`);
    
    const updatedApprentices = await User.find({ role: 'apprentice' });
    updatedApprentices.forEach((apprentice, index) => {
      console.log(`\n   ${index + 1}. ${apprentice.name}:`);
      console.log(`      💰 Jami daromad: ${apprentice.totalEarnings} so'm`);
      console.log(`      💎 Jami daromad: ${apprentice.totalEarnings} so'm`);
    });

    // Qolgan vazifalar
    const remainingTasks = await Task.find({});
    console.log(`\n   📋 Qolgan vazifalar: ${remainingTasks.length} ta`);

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
    console.log('\n🎉 Barcha shogirt vazifalar o\'chirildi va statistika 0ga qaytarildi!');
    console.log('\n📌 Natija:');
    console.log('   - Ish soatlari: 0 (vazifalar o\'chirildi)');
    console.log('   - Bajarish foizi: 0% (vazifalar o\'chirildi)');
    console.log('   - Daromad: 0 so\'m');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

deleteApprenticeTasksAndResetStats();
