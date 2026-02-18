import mongoose from 'mongoose';
import Car from '../models/Car';
import CarService from '../models/CarService';
import Transaction from '../models/Transaction';
import Debt from '../models/Debt';
import User from '../models/User';
import '../config/database';

/**
 * Barcha to'lovlarni va kassani reset qilish
 * 1. Barcha mashinalarning paidAmount = 0
 * 2. Barcha CarService larning paidAmount = 0
 * 3. Barcha transactionlarni o'chirish
 * 4. Barcha qarzlarni o'chirish
 * 5. Barcha foydalanuvchilarning earnings = 0
 */
async function resetAllPayments() {
  try {
    console.log('🔄 To\'lovlarni reset qilish boshlandi...\n');

    // 1. Barcha mashinalarning to'lovlarini reset qilish
    const carsResult = await Car.updateMany(
      {},
      {
        $set: {
          paidAmount: 0,
          paymentStatus: 'pending',
          payments: []
        }
      }
    );
    console.log(`✅ ${carsResult.modifiedCount} ta mashinaning to'lovlari reset qilindi`);

    // 2. Barcha CarService larning to'lovlarini reset qilish
    const servicesResult = await CarService.updateMany(
      {},
      {
        $set: {
          paidAmount: 0,
          paymentStatus: 'pending',
          payments: []
        }
      }
    );
    console.log(`✅ ${servicesResult.modifiedCount} ta xizmatning to'lovlari reset qilindi`);

    // 3. Barcha transactionlarni o'chirish
    const transactionsResult = await Transaction.deleteMany({});
    console.log(`✅ ${transactionsResult.deletedCount} ta transaction o'chirildi`);

    // 4. Barcha qarzlarni o'chirish
    const debtsResult = await Debt.deleteMany({});
    console.log(`✅ ${debtsResult.deletedCount} ta qarz o'chirildi`);

    // 5. Barcha foydalanuvchilarning daromadlarini reset qilish
    const usersResult = await User.updateMany(
      {},
      {
        $set: {
          earnings: 0
        }
      }
    );
    console.log(`✅ ${usersResult.modifiedCount} ta foydalanuvchining daromadlari reset qilindi`);

    console.log('\n🎉 Barcha to\'lovlar muvaffaqiyatli reset qilindi!');
    console.log('📊 Natija:');
    console.log(`   - Mashinalar: ${carsResult.modifiedCount} ta`);
    console.log(`   - Xizmatlar: ${servicesResult.modifiedCount} ta`);
    console.log(`   - Transactionlar: ${transactionsResult.deletedCount} ta o'chirildi`);
    console.log(`   - Qarzlar: ${debtsResult.deletedCount} ta o'chirildi`);
    console.log(`   - Foydalanuvchilar: ${usersResult.modifiedCount} ta`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

// Script ni ishga tushirish
resetAllPayments();
