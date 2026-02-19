import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// .env faylini yuklash
dotenv.config({ path: path.join(__dirname, '../../.env') });

const listAllTransactions = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    const Transaction = (await import('../models/Transaction')).default;

    // Barcha transactionlarni olish
    const transactions = await Transaction.find()
      .populate('createdBy', 'name')
      .populate('apprenticeId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`📊 Jami transactions (oxirgi 50 ta): ${transactions.length}\n`);

    if (transactions.length === 0) {
      console.log('⚠️ Hech qanday transaction topilmadi');
    } else {
      transactions.forEach((t: any, index: number) => {
        console.log(`\n${index + 1}. ${t.type.toUpperCase()} - ${t.category}`);
        console.log(`   Amount: ${t.amount.toLocaleString()} so'm`);
        console.log(`   Description: ${t.description}`);
        console.log(`   Payment Method: ${t.paymentMethod}`);
        console.log(`   Created By: ${t.createdBy?.name || 'Unknown'}`);
        console.log(`   Apprentice: ${t.apprenticeId?.name || 'N/A'}`);
        console.log(`   Date: ${new Date(t.createdAt).toLocaleString()}`);
        console.log(`   ID: ${t._id}`);
      });
    }

    console.log('\n✅ Ro\'yxat tugadi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

listAllTransactions();
