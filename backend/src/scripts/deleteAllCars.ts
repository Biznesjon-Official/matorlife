import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try multiple paths
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 .env fayl yo\'li:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ .env faylni yuklashda xatolik:', result.error);
  process.exit(1);
}

const Car = require('../models/Car').default;

async function deleteAllCars() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    console.log('🔍 MONGODB_URI mavjudmi:', mongoUri ? 'Ha ✅' : 'Yo\'q ❌');
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI topilmadi .env faylida!');
      console.error('💡 .env faylni tekshiring: backend/.env');
      process.exit(1);
    }
    
    console.log('🔄 MongoDB ga ulanish...');
    console.log('📍 Database:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
    console.log('📍 Connection string:', mongoUri.substring(0, 30) + '...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    // Barcha mashinalarni sanash
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ isDeleted: { $ne: true } });
    const archivedCars = await Car.countDocuments({ isDeleted: true });

    console.log('📊 Hozirgi holat:');
    console.log(`   Jami mashinalar: ${totalCars}`);
    console.log(`   Faol mashinalar: ${activeCars}`);
    console.log(`   Arxivdagi mashinalar: ${archivedCars}\n`);

    // Tasdiqlash
    console.log('⚠️  OGOHLANTIRISH: Barcha mashinalar o\'chiriladi!');
    console.log('⚠️  Bu amal qaytarib bo\'lmaydi!\n');

    // Barcha mashinalarni o'chirish
    console.log('🗑️  Barcha mashinalarni o\'chirish...');
    const result = await Car.deleteMany({});
    
    console.log(`\n✅ ${result.deletedCount} ta mashina o'chirildi!`);
    console.log('✅ Barcha mashinalar muvaffaqiyatli o\'chirildi!\n');

    // Tekshirish
    const remainingCars = await Car.countDocuments();
    console.log(`📊 Qolgan mashinalar: ${remainingCars}`);

    await mongoose.connection.close();
    console.log('\n✅ MongoDB ulanishi yopildi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Script'ni ishga tushirish
deleteAllCars();
