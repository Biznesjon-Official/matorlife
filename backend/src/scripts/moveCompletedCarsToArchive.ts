import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * To'liq to'langan mashinalarni arxivga o'tkazish
 * Bu script bir marta ishga tushiriladi
 */
async function moveCompletedCarsToArchive() {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    console.log('🔌 MongoDB ga ulanilmoqda...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi\n');
    
    console.log('🔄 To\'liq to\'langan mashinalarni arxivga o\'tkazish boshlandi...\n');

    // Barcha mashinalarni olish
    const allCars = await Car.find({});
    console.log(`📊 Jami mashinalar: ${allCars.length} ta\n`);

    let movedCount = 0;
    let alreadyArchivedCount = 0;
    let notPaidCount = 0;

    for (const car of allCars) {
      const totalPrice = car.totalEstimate || 0;
      const paidAmount = car.paidAmount || 0;
      const remaining = totalPrice - paidAmount;
      const isPaid = totalPrice > 0 && remaining <= 0;

      // Agar allaqachon arxivda bo'lsa
      if (car.isDeleted || car.status === 'completed' || car.status === 'delivered') {
        alreadyArchivedCount++;
        continue;
      }

      // Agar to'liq to'langan bo'lsa
      if (isPaid) {
        car.status = 'completed';
        await car.save();
        movedCount++;
        console.log(`✅ Arxivga o'tkazildi: ${car.licensePlate} - ${car.ownerName} (${totalPrice} so'm to'langan)`);
      } else {
        notPaidCount++;
      }
    }

    console.log('\n🎉 Jarayon tugadi!');
    console.log('📊 Natija:');
    console.log(`   - Arxivga o'tkazildi: ${movedCount} ta`);
    console.log(`   - Allaqachon arxivda: ${alreadyArchivedCount} ta`);
    console.log(`   - To'lanmagan (faol): ${notPaidCount} ta`);
    console.log(`   - Jami: ${allCars.length} ta`);

    await mongoose.disconnect();
    console.log('\n✅ MongoDB dan uzildi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Script ni ishga tushirish
moveCompletedCarsToArchive();
