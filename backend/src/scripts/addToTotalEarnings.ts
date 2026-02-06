import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const addToTotalEarnings = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avtoservis';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // Narzulloni topish
    const narzullo = await User.findOne({ username: 'narzullo' });
    
    if (!narzullo) {
      console.log('❌ Narzullo topilmadi');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n👤 ${narzullo.name}`);
    console.log(`   💰 Joriy oylik (oldin): ${narzullo.earnings.toLocaleString()} so'm`);
    console.log(`   💎 Jami daromad (oldin): ${narzullo.totalEarnings.toLocaleString()} so'm`);

    // 140,000 so'mni jami daromadga qo'shish va joriy oylikdan ayirish
    const amount = 140000;
    narzullo.earnings = Math.max(0, narzullo.earnings - amount);
    narzullo.totalEarnings += amount;
    
    await narzullo.save();

    console.log(`\n✅ ${amount.toLocaleString()} so'm qo'shildi`);
    console.log(`   💰 Joriy oylik (keyin): ${narzullo.earnings.toLocaleString()} so'm`);
    console.log(`   💎 Jami daromad (keyin): ${narzullo.totalEarnings.toLocaleString()} so'm`);

    // Ulanishni yopish
    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

addToTotalEarnings();
