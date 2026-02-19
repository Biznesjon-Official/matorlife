import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const deductNarzulloSalary = async () => {
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

    console.log('\n📊 NARZULLO HOZIRGI MA\'LUMOTLARI:');
    console.log('   ID:', narzullo._id);
    console.log('   Ism:', narzullo.name);
    console.log('   Hozirgi totalEarnings:', narzullo.totalEarnings, 'so\'m');

    // 2,000,000 so'm ayirish
    const deductAmount = 2000000;
    const newEarnings = Math.max(0, narzullo.totalEarnings - deductAmount);

    narzullo.totalEarnings = newEarnings;
    await narzullo.save();

    console.log('\n✅ YANGILANDI:');
    console.log('   Ayirilgan summa:', deductAmount.toLocaleString(), 'so\'m');
    console.log('   Yangi totalEarnings:', newEarnings.toLocaleString(), 'so\'m');

    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanish yopildi');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

deductNarzulloSalary();
