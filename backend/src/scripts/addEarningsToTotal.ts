import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const addEarningsToTotal = async () => {
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

    console.log('\n📊 Hozirgi holat:');
    console.log(`   Joriy oylik (earnings): ${narzullo.earnings.toLocaleString()} so'm`);
    console.log(`   Jami daromad (totalEarnings): ${narzullo.totalEarnings.toLocaleString()} so'm`);

    // earnings ni totalEarnings ga qo'shish
    const earningsToAdd = narzullo.earnings;
    narzullo.totalEarnings += earningsToAdd;
    narzullo.earnings = 0; // Joriy oylikni 0 ga qaytarish

    await narzullo.save();

    console.log('\n✅ Yangilandi:');
    console.log(`   Joriy oylik (earnings): ${narzullo.earnings.toLocaleString()} so'm`);
    console.log(`   Jami daromad (totalEarnings): ${narzullo.totalEarnings.toLocaleString()} so'm`);
    console.log(`   Qo'shilgan summa: ${earningsToAdd.toLocaleString()} so'm`);

    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

addEarningsToTotal();
