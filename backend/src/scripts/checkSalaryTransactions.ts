import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// .env faylini yuklash
dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkSalaryTransactions = async () => {
  try {
    // MongoDB ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-life';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB ga ulandi\n');

    const Transaction = (await import('../models/Transaction')).default;
    const User = (await import('../models/User')).default;

    // Barcha shogirtlarni olish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📊 Jami shogirtlar: ${apprentices.length}\n`);

    for (const apprentice of apprentices) {
      console.log(`\n👤 ${apprentice.name} (${apprentice._id})`);
      
      // Bu shogirtga tegishli barcha expense transactionlarni olish
      const transactions = await Transaction.find({
        type: 'expense',
        apprenticeId: apprentice._id
      }).sort({ createdAt: -1 });

      console.log(`   📝 Jami expense transactions: ${transactions.length}`);

      if (transactions.length > 0) {
        console.log(`   📋 Kategoriyalar:`);
        transactions.forEach((t: any) => {
          console.log(`      - ${t.category} (${t.amount.toLocaleString()} so'm) - ${new Date(t.createdAt).toLocaleDateString()}`);
        });

        // Jami to'langan summa
        const totalPaid = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        console.log(`   💰 Jami to'langan: ${totalPaid.toLocaleString()} so'm`);
      } else {
        console.log(`   ⚠️ Hech qanday to'lov topilmadi`);
      }
    }

    console.log('\n✅ Tekshiruv tugadi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

checkSalaryTransactions();
