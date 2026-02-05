import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Barcha shogirtlarning totalEarnings maydonini tekshirish va yangilash
 */
async function checkTotalEarnings() {
  try {
    // MongoDB'ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mator-crm';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB\'ga ulandi');

    // Barcha shogirtlarni olish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`\n📋 Jami shogirtlar: ${apprentices.length}\n`);

    for (const apprentice of apprentices) {
      console.log(`\n👤 Shogird: ${apprentice.name}`);
      console.log(`   📧 Email: ${apprentice.email}`);
      console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings} so'm`);
      console.log(`   💎 Jami daromad (totalEarnings): ${apprentice.totalEarnings} so'm`);

      // Tasdiqlangan vazifalarni topish
      const approvedTasks = await Task.find({
        $or: [
          { assignedTo: apprentice._id, status: 'approved' },
          { 'assignments.apprentice': apprentice._id, status: 'approved' }
        ]
      });

      console.log(`   ✅ Tasdiqlangan vazifalar: ${approvedTasks.length} ta`);

      // Haqiqiy daromadni hisoblash
      let calculatedEarnings = 0;
      for (const task of approvedTasks) {
        // Yangi tizim
        if (task.assignments && task.assignments.length > 0) {
          const myAssignment = task.assignments.find((a: any) => 
            a.apprentice.toString() === apprentice._id.toString()
          );
          if (myAssignment) {
            calculatedEarnings += myAssignment.earning || 0;
          }
        }
        // Eski tizim
        else if (task.assignedTo?.toString() === apprentice._id.toString()) {
          calculatedEarnings += task.apprenticeEarning || 0;
        }
      }

      console.log(`   🧮 Hisoblangan daromad: ${calculatedEarnings} so'm`);

      // Agar totalEarnings 0 bo'lsa va hisoblangan daromad bor bo'lsa, yangilash
      if (apprentice.totalEarnings === 0 && calculatedEarnings > 0) {
        console.log(`   ⚠️  totalEarnings 0, lekin hisoblangan daromad ${calculatedEarnings} so'm`);
        console.log(`   🔄 totalEarnings yangilanmoqda...`);
        
        apprentice.totalEarnings = calculatedEarnings;
        await apprentice.save();
        
        console.log(`   ✅ totalEarnings yangilandi: ${apprentice.totalEarnings} so'm`);
      } else if (apprentice.totalEarnings !== calculatedEarnings) {
        console.log(`   ⚠️  Farq bor: DB=${apprentice.totalEarnings}, Hisoblangan=${calculatedEarnings}`);
      } else {
        console.log(`   ✅ totalEarnings to'g'ri`);
      }
    }

    console.log('\n✅ Tekshirish tugadi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
}

checkTotalEarnings();
