import mongoose from 'mongoose';
import Debt from '../models/Debt';
import Car from '../models/Car';
import dotenv from 'dotenv';

dotenv.config();

const checkDebts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-service');
    console.log('✅ MongoDB ga ulandi');

    const debts = await Debt.find();
    
    console.log(`\n📊 Jami qarzlar soni: ${debts.length}\n`);
    
    if (debts.length === 0) {
      console.log('❌ Hech qanday qarz topilmadi!');
      console.log('💡 Kassa qismida to\'lov qo\'shing, qarz avtomatik yaratiladi.');
    } else {
      debts.forEach((debt, index) => {
        console.log(`\n${index + 1}. ${debt.creditorName}`);
        console.log(`   Turi: ${debt.type === 'receivable' ? 'Bizga qarzi bor' : 'Bizning qarzimiz'}`);
        console.log(`   Jami: ${debt.amount} so'm`);
        console.log(`   To'langan: ${debt.paidAmount} so'm`);
        console.log(`   Qolgan: ${debt.amount - debt.paidAmount} so'm`);
        console.log(`   Status: ${debt.status}`);
        console.log(`   To'lovlar tarixi: ${debt.paymentHistory.length} ta`);
        
        if (debt.paymentHistory.length > 0) {
          debt.paymentHistory.forEach((payment, pIndex) => {
            console.log(`      ${pIndex + 1}. ${payment.amount} so'm - ${payment.paymentMethod} - ${payment.date}`);
          });
        }
        
        if (debt.car) {
          console.log(`   Mashina ID: ${debt.car}`);
        }
      });
      
      // Summary
      const receivables = debts.filter(d => d.type === 'receivable');
      const payables = debts.filter(d => d.type === 'payable');
      
      const receivablesTotal = receivables.reduce((sum, d) => sum + d.amount, 0);
      const receivablesPaid = receivables.reduce((sum, d) => sum + d.paidAmount, 0);
      
      const payablesTotal = payables.reduce((sum, d) => sum + d.amount, 0);
      const payablesPaid = payables.reduce((sum, d) => sum + d.paidAmount, 0);
      
      console.log('\n\n📈 UMUMIY STATISTIKA:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n💚 BIZGA QARZI BOR (Receivables):`);
      console.log(`   Jami: ${receivablesTotal} so'm`);
      console.log(`   To'langan: ${receivablesPaid} so'm`);
      console.log(`   Qolgan: ${receivablesTotal - receivablesPaid} so'm`);
      console.log(`   Soni: ${receivables.length} ta`);
      
      console.log(`\n❤️ BIZNING QARZIMIZ (Payables):`);
      console.log(`   Jami: ${payablesTotal} so'm`);
      console.log(`   To'langan: ${payablesPaid} so'm`);
      console.log(`   Qolgan: ${payablesTotal - payablesPaid} so'm`);
      console.log(`   Soni: ${payables.length} ta`);
      
      console.log(`\n💰 UMUMIY HOLAT:`);
      const netPosition = (receivablesTotal - receivablesPaid) - (payablesTotal - payablesPaid);
      console.log(`   Net Position: ${netPosition} so'm ${netPosition >= 0 ? '(Ijobiy ✅)' : '(Salbiy ❌)'}`);
      console.log(`   Jami to'langan: ${receivablesPaid + payablesPaid} so'm`);
    }

    await mongoose.disconnect();
    console.log('\n✅ MongoDB dan uzildi');
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

checkDebts();
