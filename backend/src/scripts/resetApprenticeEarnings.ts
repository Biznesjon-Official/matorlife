import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const resetApprenticeEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // Barcha shogirtlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`\n📊 Jami shogirtlar soni: ${apprentices.length}`);

    if (apprentices.length === 0) {
      console.log('❌ Shogirtlar topilmadi');
      await mongoose.connection.close();
      return;
    }

    // Har bir shogirtning daromadini ko'rsatish
    console.log('\n📋 Shogirtlarning hozirgi daromadlari:');
    apprentices.forEach((apprentice, index) => {
      console.log(`${index + 1}. ${apprentice.name} (${apprentice.username}):`);
      console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
      console.log(`   💎 Jami daromad (totalEarnings): ${apprentice.totalEarnings.toLocaleString()} so'm`);
    });

    // Barcha shogirtlarning earnings va totalEarnings ni 0 ga o'zgartirish
    const result = await User.updateMany(
      { role: 'apprentice' },
      { $set: { earnings: 0, totalEarnings: 0 } }
    );

    console.log(`\n✅ ${result.modifiedCount} ta shogirtning daromadi 0 so'mga qaytarildi (earnings va totalEarnings)`);

    // Yangilangan ma'lumotlarni ko'rsatish
    const updatedApprentices = await User.find({ role: 'apprentice' });
    console.log('\n📋 Yangilangan daromadlar:');
    updatedApprentices.forEach((apprentice, index) => {
      console.log(`${index + 1}. ${apprentice.name} (${apprentice.username}):`);
      console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
      console.log(`   💎 Jami daromad (totalEarnings): ${apprentice.totalEarnings.toLocaleString()} so'm`);
    });

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

resetApprenticeEarnings();
