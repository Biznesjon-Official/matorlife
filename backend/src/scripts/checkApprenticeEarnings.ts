import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// .env faylini yuklash
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkApprenticeEarnings() {
  try {
    console.log('🔍 Shogirtlarning daromadini tekshirish...\n');
    
    // MongoDB'ga ulanish
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autoservice';
    console.log('MongoDB URI:', mongoUri.substring(0, 30) + '...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB\'ga ulandi\n');

    const User = require('../models/User').default;
    const Task = require('../models/Task').default;
    const Car = require('../models/Car').default;

    // Barcha shogirtlarni olish
    const apprentices = await User.find({ role: 'apprentice' }).sort({ name: 1 });
    
    console.log(`📋 Jami shogirtlar: ${apprentices.length}\n`);
    console.log('='.repeat(80));

    for (const apprentice of apprentices) {
      console.log(`\n👤 SHOGIRT: ${apprentice.name} (@${apprentice.username})`);
      console.log(`   ID: ${apprentice._id}`);
      console.log(`   Foiz: ${apprentice.percentage || 'Belgilanmagan'}%`);
      console.log(`   💰 Joriy oylik (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
      console.log(`   💰 Jami daromad (totalEarnings): ${apprentice.totalEarnings.toLocaleString()} so'm`);

      // Tasdiqlangan vazifalarni topish
      const approvedTasks = await Task.find({
        $or: [
          { assignedTo: apprentice._id, status: 'approved' },
          { 'assignments.apprentice': apprentice._id, status: 'approved' }
        ]
      }).populate('car', 'make carModel licensePlate');

      console.log(`\n   📊 Tasdiqlangan vazifalar: ${approvedTasks.length} ta`);

      if (approvedTasks.length > 0) {
        let totalExpectedEarnings = 0;

        for (const task of approvedTasks) {
          console.log(`\n   📝 Vazifa: ${task.title}`);
          console.log(`      Mashina: ${task.car?.make} ${task.car?.carModel} (${task.car?.licensePlate})`);
          console.log(`      Jami to'lov: ${task.payment.toLocaleString()} so'm`);
          console.log(`      Status: ${task.status}`);
          console.log(`      Tasdiqlangan: ${task.approvedAt ? new Date(task.approvedAt).toLocaleString('uz-UZ') : 'Yo\'q'}`);

          // Yangi tizim: assignments
          if (task.assignments && task.assignments.length > 0) {
            const myAssignment = task.assignments.find(
              (a: any) => a.apprentice.toString() === apprentice._id.toString()
            );
            
            if (myAssignment) {
              console.log(`      ✅ YANGI TIZIM`);
              console.log(`         Foiz: ${myAssignment.percentage}%`);
              console.log(`         Allocated: ${myAssignment.allocatedAmount.toLocaleString()} so'm`);
              console.log(`         Earning: ${myAssignment.earning.toLocaleString()} so'm`);
              console.log(`         Master Share: ${myAssignment.masterShare.toLocaleString()} so'm`);
              totalExpectedEarnings += myAssignment.earning;
            }
          }
          // Eski tizim: assignedTo
          else if (task.assignedTo?.toString() === apprentice._id.toString()) {
            console.log(`      ✅ ESKI TIZIM`);
            console.log(`         Foiz: ${task.apprenticePercentage || 'Yo\'q'}%`);
            console.log(`         Apprentice Earning: ${(task.apprenticeEarning || 0).toLocaleString()} so'm`);
            console.log(`         Master Earning: ${(task.masterEarning || 0).toLocaleString()} so'm`);
            totalExpectedEarnings += task.apprenticeEarning || 0;
          }
        }

        console.log(`\n   💵 Jami kutilgan daromad: ${totalExpectedEarnings.toLocaleString()} so'm`);
        console.log(`   💰 Haqiqiy daromad (earnings): ${apprentice.earnings.toLocaleString()} so'm`);
        
        const difference = apprentice.earnings - totalExpectedEarnings;
        if (difference !== 0) {
          console.log(`   ⚠️  FARQ: ${difference.toLocaleString()} so'm`);
          if (difference > 0) {
            console.log(`   ⬆️  Ortiqcha: ${difference.toLocaleString()} so'm`);
          } else {
            console.log(`   ⬇️  Kamlik: ${Math.abs(difference).toLocaleString()} so'm`);
          }
        } else {
          console.log(`   ✅ FARQ YO'Q - To'g'ri!`);
        }
      } else {
        console.log(`   ℹ️  Tasdiqlangan vazifalar yo'q`);
        if (apprentice.earnings > 0) {
          console.log(`   ⚠️  Lekin earnings ${apprentice.earnings.toLocaleString()} so'm!`);
        }
      }

      console.log('\n' + '-'.repeat(80));
    }

    console.log('\n✅ Tekshirish tugadi!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 MongoDB\'dan uzildi');
  }
}

checkApprenticeEarnings();
