import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';
import path from 'path';

// .env faylni yuklash
const envPath = path.resolve(__dirname, '../../.env');
console.log('📁 .env fayl yo\'li:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ .env faylni yuklashda xatolik:', result.error);
  process.exit(1);
}

const clearArchivedCars = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI topilmadi .env faylida!');
      console.error('💡 .env faylni tekshiring: backend/.env');
      process.exit(1);
    }

    console.log('🔌 MongoDB ga ulanish...');
    console.log('📍 Database:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    // Faqat arxivdagi mashinalarni topish (isDeleted: true)
    const archivedCars = await Car.find({ isDeleted: true });
    
    console.log('📊 Hozirgi holat:');
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ isDeleted: { $ne: true } });
    console.log(`   Jami mashinalar: ${totalCars}`);
    console.log(`   Faol mashinalar: ${activeCars}`);
    console.log(`   Arxivdagi mashinalar: ${archivedCars.length}\n`);

    if (archivedCars.length === 0) {
      console.log('✨ Arxivda o\'chiriladigan mashinalar yo\'q');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Arxivdagi mashinalarni ko'rsatish
    console.log('📋 Arxivdagi mashinalar:');
    archivedCars.forEach((car, index) => {
      const deletedDate = car.deletedAt ? new Date(car.deletedAt).toLocaleDateString('uz-UZ') : 'Noma\'lum';
      console.log(`   ${index + 1}. ${car.make} ${car.carModel} - ${car.licensePlate}`);
      console.log(`      Egasi: ${car.ownerName} (${car.ownerPhone})`);
      console.log(`      Arxivlangan: ${deletedDate}\n`);
    });

    // Arxivdagi mashinalarni o'chirish
    console.log('⚠️  OGOHLANTIRISH: Faqat arxivdagi mashinalar o\'chiriladi!');
    console.log('⚠️  Bu amal qaytarib bo\'lmaydi!\n');
    console.log('🗑️  Arxivdagi mashinalarni o\'chirish...');
    
    const deleteResult = await Car.deleteMany({ isDeleted: true });
    
    console.log(`\n✅ ${deleteResult.deletedCount} ta arxivdagi mashina o'chirildi!`);
    console.log('🎉 Arxiv tozalandi!\n');

    // Tekshirish
    const remainingTotal = await Car.countDocuments();
    const remainingActive = await Car.countDocuments({ isDeleted: { $ne: true } });
    const remainingArchived = await Car.countDocuments({ isDeleted: true });
    
    console.log('📊 Yangi holat:');
    console.log(`   Jami mashinalar: ${remainingTotal}`);
    console.log(`   Faol mashinalar: ${remainingActive}`);
    console.log(`   Arxivdagi mashinalar: ${remainingArchived}\n`);

    await mongoose.connection.close();
    console.log('✅ MongoDB ulanishi yopildi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

clearArchivedCars();
