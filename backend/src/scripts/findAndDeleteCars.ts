import mongoose from 'mongoose';
import Car from '../models/Car';
import CarService from '../models/CarService';
import Task from '../models/Task';
import Debt from '../models/Debt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Mashinalarni topish va o'chirish
 */
async function findAndDeleteCars() {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    console.log('🔌 MongoDB ga ulanilmoqda...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi\n');
    
    // 1. Avval barcha mashinalarni ko'rish
    console.log('📋 Barcha mashinalar ro\'yxati:\n');
    const allCars = await Car.find({}).select('licensePlate ownerName make carModel status isDeleted');
    
    allCars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.licensePlate} - ${car.ownerName} (${car.make} ${car.carModel}) - Status: ${car.status}, Deleted: ${car.isDeleted}`);
    });
    
    console.log(`\n📊 Jami: ${allCars.length} ta mashina\n`);
    
    // 2. Qidirilayotgan mashinalar
    console.log('🔍 Qidirilayotgan mashinalar:');
    console.log('   - 50 S 220 SC');
    console.log('   - 01 A 222 MM\n');
    
    // 3. Turli formatlarni sinab ko'rish
    const searchPatterns = [
      '50S220SC',
      '50 S 220 SC',
      '50S 220SC',
      '50 S220 SC',
      '01A222MM',
      '01 A 222 MM',
      '01A 222MM',
      '01 A222 MM'
    ];
    
    const carsToDelete: any[] = [];
    
    for (const pattern of searchPatterns) {
      const found = allCars.find(car => 
        car.licensePlate.replace(/\s/g, '').toUpperCase() === pattern.replace(/\s/g, '').toUpperCase()
      );
      
      if (found && !carsToDelete.find(c => c._id.toString() === found._id.toString())) {
        carsToDelete.push(found);
        console.log(`✅ Topildi: ${found.licensePlate} - ${found.ownerName}`);
      }
    }
    
    if (carsToDelete.length === 0) {
      console.log('\n⚠️  Hech qanday mashina topilmadi!');
      console.log('Iltimos, yuqoridagi ro\'yxatdan to\'g\'ri davlat raqamini tanlang.\n');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log(`\n🗑️  ${carsToDelete.length} ta mashina o'chiriladi:\n`);
    
    for (const car of carsToDelete) {
      console.log(`\n🚗 O'chirilmoqda: ${car.licensePlate} - ${car.ownerName}`);
      
      // 1. CarService larni o'chirish
      const deletedServices = await CarService.deleteMany({ car: car._id });
      console.log(`   📦 ${deletedServices.deletedCount} ta xizmat o'chirildi`);
      
      // 2. Task larni o'chirish
      const deletedTasks = await Task.deleteMany({ car: car._id });
      console.log(`   📋 ${deletedTasks.deletedCount} ta vazifa o'chirildi`);
      
      // 3. Debt larni o'chirish
      const deletedDebts = await Debt.deleteMany({ car: car._id });
      console.log(`   💰 ${deletedDebts.deletedCount} ta qarz o'chirildi`);
      
      // 4. Mashinani o'chirish
      await Car.findByIdAndDelete(car._id);
      console.log(`   ✅ Mashina butunlay o'chirildi`);
    }

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
findAndDeleteCars();
