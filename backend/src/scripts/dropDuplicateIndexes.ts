import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropDuplicateIndexes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-repair-workshop';
    
    console.log('🔄 MongoDB ga ulanish...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi!');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const carsCollection = db.collection('cars');

    console.log('\n📋 Mavjud indexlar:');
    const indexes = await carsCollection.indexes();
    indexes.forEach((index: any) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n🗑️  Duplicate indexlarni o\'chirish...');
    
    // licensePlate uchun barcha indexlarni o'chirish
    try {
      await carsCollection.dropIndex('licensePlate_1');
      console.log('✅ licensePlate_1 index o\'chirildi');
    } catch (error: any) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️  licensePlate_1 index topilmadi');
      } else {
        console.log('⚠️  licensePlate_1 o\'chirishda xato:', error.message);
      }
    }

    console.log('\n📋 Yangi indexlar ro\'yxati:');
    const newIndexes = await carsCollection.indexes();
    newIndexes.forEach((index: any) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Tayyor! Endi serverni qayta ishga tushiring.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xato:', error);
    process.exit(1);
  }
};

dropDuplicateIndexes();
