import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// .env faylini yuklash
dotenv.config({ path: path.join(__dirname, '../../.env') });

const removeEarningsField = async () => {
  try {
    console.log('🔄 earnings maydonini o\'chirish va totalEarnings ga ko\'chirish...\n');

    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-repair-workshop';
    console.log('📡 MongoDB ga ulanish...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    const users = await User.find({});

    console.log(`📊 Jami foydalanuvchilar: ${users.length}\n`);

    for (const user of users) {
      console.log(`👤 ${user.name} (${user.role}):`);
      console.log(`   earnings (eski): ${(user as any).earnings || 0} so'm`);
      console.log(`   totalEarnings (eski): ${user.totalEarnings} so'm`);

      // Agar earnings bor bo'lsa, totalEarnings ga qo'shish
      if ((user as any).earnings) {
        const newTotal = user.totalEarnings + (user as any).earnings;
        
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { totalEarnings: newTotal },
            $unset: { earnings: 1 }
          }
        );
        
        console.log(`   ✅ totalEarnings (yangi): ${newTotal} so'm`);
        console.log(`   ✅ earnings maydoni o'chirildi\n`);
      } else {
        // Faqat earnings maydonini o'chirish
        await User.updateOne(
          { _id: user._id },
          { $unset: { earnings: 1 } }
        );
        console.log(`   ✅ earnings maydoni o'chirildi (0 edi)\n`);
      }
    }

    console.log('✅ Barcha foydalanuvchilar yangilandi!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

removeEarningsField();
