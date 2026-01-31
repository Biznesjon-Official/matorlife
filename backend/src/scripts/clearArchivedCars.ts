import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';

dotenv.config();

const clearArchivedCars = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life');
    console.log('✅ Connected to database');

    // Arxivlangan mashinalarni topish (isDeleted, completed yoki delivered)
    const archivedCars = await Car.find({
      $or: [
        { isDeleted: true },
        { status: 'completed' },
        { status: 'delivered' }
      ]
    });
    
    console.log(`\n📊 Found ${archivedCars.length} archived cars`);

    if (archivedCars.length === 0) {
      console.log('✨ No archived cars to delete');
      process.exit(0);
    }

    // Har bir mashinani ko'rsatish
    console.log('\n📋 Archived cars:');
    archivedCars.forEach((car, index) => {
      const statusLabel = car.isDeleted ? 'DELETED' : car.status?.toUpperCase();
      console.log(`${index + 1}. ${car.make} ${car.carModel} - ${car.licensePlate} (Owner: ${car.ownerName}) [${statusLabel}]`);
    });

    // Arxivlangan mashinalarni o'chirish
    console.log('\n🗑️  Deleting archived cars...');
    const result = await Car.deleteMany({
      $or: [
        { isDeleted: true },
        { status: 'completed' },
        { status: 'delivered' }
      ]
    });
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} archived cars`);
    console.log('🎉 Archive cleared!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing archived cars:', error);
    process.exit(1);
  }
};

clearArchivedCars();
