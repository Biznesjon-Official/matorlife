import mongoose from 'mongoose';
import Car from '../models/Car';
import CarService from '../models/CarService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Muayyan mashinalarni topish va to'lov holatini tekshirish
 * Mashinalar: 01 S 123 AS va 80 N 437 AB
 */
async function checkAndFixSpecificCars() {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    console.log('🔌 MongoDB ga ulanilmoqda...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi\n');
    
    console.log('🔍 Mashinalarni qidirish...\n');

    // AVVAL: Barcha mashinalarni ko'rish
    console.log('📋 BARCHA MASHINALAR RO\'YXATI:\n');
    const allCars = await Car.find({}).select('licensePlate ownerName make carModel totalEstimate paidAmount status paymentStatus');
    
    allCars.forEach((car, index) => {
      const remaining = (car.totalEstimate || 0) - (car.paidAmount || 0);
      console.log(`${index + 1}. ${car.licensePlate} - ${car.ownerName} (${car.make} ${car.carModel})`);
      console.log(`   Jami: ${car.totalEstimate || 0}, To'langan: ${car.paidAmount || 0}, Qolgan: ${remaining}`);
      console.log(`   Status: ${car.status}, PaymentStatus: ${car.paymentStatus}\n`);
    });
    
    console.log(`\n📊 Jami: ${allCars.length} ta mashina\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Qidirilayotgan mashinalar
    const searchPlates = ['01 S 123 AS', '80 N 437 AB'];
    
    for (const platePattern of searchPlates) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔍 Qidirilmoqda: ${platePattern}\n`);
      
      // Mashinani topish (to'liq mos kelishi kerak)
      const car = await Car.findOne({ 
        licensePlate: platePattern
      });
      
      if (!car) {
        console.log(`⚠️  Mashina topilmadi: ${platePattern}`);
        continue;
      }
      
      console.log(`✅ Mashina topildi!`);
      console.log(`   📋 Davlat raqami: ${car.licensePlate}`);
      console.log(`   👤 Egasi: ${car.ownerName}`);
      console.log(`   🚗 Mashina: ${car.make} ${car.carModel}`);
      console.log(`   📊 Status: ${car.status}`);
      console.log(`   🗑️  O'chirilgan: ${car.isDeleted}`);
      console.log(`   💰 Jami narx: ${car.totalEstimate || 0} so'm`);
      console.log(`   ✅ To'langan: ${car.paidAmount || 0} so'm`);
      console.log(`   💳 To'lov holati: ${car.paymentStatus}`);
      
      const totalPrice = car.totalEstimate || 0;
      const paidAmount = car.paidAmount || 0;
      const remaining = totalPrice - paidAmount;
      
      console.log(`   🔢 Qolgan: ${remaining} so'm`);
      
      // CarService ni tekshirish
      const carServices = await CarService.find({ car: car._id });
      console.log(`\n   📦 CarService lar: ${carServices.length} ta`);
      
      if (carServices.length > 0) {
        carServices.forEach((service, index) => {
          console.log(`      ${index + 1}. Jami: ${service.totalPrice} so'm, To'langan: ${service.paidAmount || 0} so'm, Status: ${service.status}`);
        });
      }
      
      // Agar narx 0 bo'lsa yoki to'liq to'langan bo'lsa, arxivga o'tkazish
      const shouldArchive = (totalPrice === 0) || (totalPrice > 0 && remaining <= 0);
      
      if (shouldArchive) {
        if (totalPrice === 0) {
          console.log(`\n   ⚠️  Mashina narxi 0 - arxivga o'tkaziladi`);
        } else {
          console.log(`\n   ✅ Mashina to'liq to'langan!`);
        }
        
        if (car.status !== 'completed' && car.status !== 'delivered') {
          console.log(`   🔄 Status o'zgartirilmoqda: ${car.status} → completed`);
          car.status = 'completed';
          await car.save();
          console.log(`   ✅ Status o'zgartirildi!`);
        } else {
          console.log(`   ℹ️  Status allaqachon: ${car.status}`);
        }
        
        // CarService larni ham yangilash
        for (const service of carServices) {
          if (service.status !== 'completed' && service.status !== 'delivered') {
            console.log(`   🔄 CarService status o'zgartirilmoqda: ${service.status} → completed`);
            service.status = 'completed';
            await service.save();
            console.log(`   ✅ CarService status o'zgartirildi!`);
          }
        }
      } else {
        console.log(`\n   ⚠️  Mashina hali to'liq to'lanmagan (Qolgan: ${remaining} so'm)`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 Jarayon tugadi!');

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
checkAndFixSpecificCars();
