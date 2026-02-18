import mongoose from 'mongoose';
import Car from '../models/Car';
import CarService from '../models/CarService';
import Task from '../models/Task';
import Debt from '../models/Debt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Muayyan mashinalarni butunlay o'chirish
 * Mashinalar: 50 S 220 SC va 01 A 222 MM
 */
async function deleteSpecificCars() {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    console.log('🔌 MongoDB ga ulanilmoqda...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi\n');
    
    console.log('🗑️  Mashinalarni o\'chirish boshlandi...\n');

    const licensePlatesToDelete = ['50S220SC', '01A222MM'];
    
    for (const plate of licensePlatesToDelete) {
      console.log(`\n🔍 Mashina qidirilmoqda: ${plate}`);
      
      // Mashinani topish (bo'shliqsiz va katta-kichik harflardan qat'iy nazar)
      const car = await Car.findOne({ 
        licensePlate: { 
          $regex: new RegExp(plate.replace(/\s/g, ''), 'i') 
        } 
      });
      
      if (!car) {
        console.log(`⚠️  Mashina topilmadi: ${plate}`);
        continue;
      }
      
      console.log(`✅ Mashina topildi: ${car.licensePlate} - ${car.ownerName}`);
      
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
      console.log(`   🚗 Mashina butunlay o'chirildi: ${car.licensePlate}`);
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
deleteSpecificCars();
