import mongoose from 'mongoose';
import SparePart from '../models/SparePart';
import dotenv from 'dotenv';

dotenv.config();

const updateSparePartPrices = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi');

    // Find all spare parts that don't have costPrice or sellingPrice
    const spareParts = await SparePart.find({
      $or: [
        { costPrice: { $exists: false } },
        { sellingPrice: { $exists: false } }
      ]
    });

    console.log(`📦 Jami ${spareParts.length} ta zapchast topildi`);

    let updated = 0;
    for (const sparePart of spareParts) {
      // Set costPrice and sellingPrice to existing price if not set
      if (!sparePart.costPrice) {
        sparePart.costPrice = sparePart.price;
      }
      if (!sparePart.sellingPrice) {
        sparePart.sellingPrice = sparePart.price;
      }
      
      await sparePart.save();
      updated++;
      
      console.log(`✅ ${sparePart.name}: costPrice=${sparePart.costPrice}, sellingPrice=${sparePart.sellingPrice}`);
    }

    console.log(`\n✅ Jami ${updated} ta zapchast yangilandi`);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ MongoDB dan uzildi');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

// Run the script
updateSparePartPrices();
