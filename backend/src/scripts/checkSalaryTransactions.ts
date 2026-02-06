import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

async function checkSalaryTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autoservice');
    console.log('✅ MongoDB ga ulandi\n');

    // Barcha maosh transaksiyalarini topish
    const salaryTransactions = await Transaction.find({
      type: 'expense',
      category: { $in: ['Oyliklar', 'Maosh', 'Oylik', 'maosh', 'oylik', 'salary'] }
    }).sort({ createdAt: -1 }).limit(20);

    console.log(`📊 Jami maosh transaksiyalari: ${salaryTransactions.length}\n`);

    for (const t of salaryTransactions) {
      console.log(`💰 ${t.createdAt.toLocaleDateString('uz-UZ')} - ${t.amount} so'm`);
      console.log(`   Description: ${t.description}`);
      console.log(`   ApprenticeId: ${t.apprenticeId || 'YO\'Q ❌'}`);
      
      if (t.apprenticeId) {
        const user = await User.findById(t.apprenticeId);
        console.log(`   Shogird: ${user?.name || 'Topilmadi'}`);
      }
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ MongoDB dan uzildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkSalaryTransactions();
