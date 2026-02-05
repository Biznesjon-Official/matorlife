import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

async function checkOzodbekEarnings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB ga ulandi');

    // Ozodbek usernameli shogirdni topish
    const ozodbek = await User.findOne({ username: 'ozodbek' });
    
    if (!ozodbek) {
      console.log('❌ Ozodbek topilmadi!');
      return;
    }

    console.log('\n📊 OZODBEK MA\'LUMOTLARI:');
    console.log('ID:', ozodbek._id);
    console.log('Ism:', ozodbek.name);
    console.log('Username:', ozodbek.username);
    console.log('Foiz:', ozodbek.percentage, '%');
    console.log('Joriy daromad (earnings):', ozodbek.earnings, 'so\'m');
    console.log('Jami daromad (totalEarnings):', ozodbek.totalEarnings, 'so\'m');

    // Ozodbek uchun barcha vazifalarni topish
    const tasks = await Task.find({
      $or: [
        { assignedTo: ozodbek._id },
        { 'assignments.apprentice': ozodbek._id }
      ]
    }).populate('car', 'licensePlate ownerName');

    console.log('\n📋 VAZIFALAR SONI:', tasks.length);

    let totalExpectedEarnings = 0;

    for (const task of tasks) {
      console.log('\n' + '='.repeat(60));
      console.log('Vazifa:', task.title);
      console.log('Status:', task.status);
      console.log('To\'lov:', task.payment, 'so\'m');
      console.log('Mashina:', task.car ? `${(task.car as any).licensePlate} - ${(task.car as any).ownerName}` : 'Yo\'q');

      // Yangi tizim (assignments)
      if (task.assignments && task.assignments.length > 0) {
        console.log('\n🆕 YANGI TIZIM (Ko\'p shogirdlar):');
        const ozodbekAssignment = task.assignments.find(
          (a: any) => a.apprentice.toString() === ozodbek._id.toString()
        );

        if (ozodbekAssignment) {
          console.log('  ✅ Ozodbek bu vazifada bor');
          console.log('  Foiz:', ozodbekAssignment.percentage, '%');
          console.log('  Allocated Amount:', ozodbekAssignment.allocatedAmount, 'so\'m');
          console.log('  Earning:', ozodbekAssignment.earning, 'so\'m');
          console.log('  Master Share:', ozodbekAssignment.masterShare, 'so\'m');

          if (task.status === 'approved') {
            totalExpectedEarnings += ozodbekAssignment.earning;
            console.log('  💰 Tasdiqlangan! Pul qo\'shilgan bo\'lishi kerak');
          } else {
            console.log('  ⏳ Hali tasdiqlanmagan');
          }
        } else {
          console.log('  ❌ Ozodbek bu vazifada yo\'q');
        }

        console.log('\n  Barcha shogirdlar:');
        for (let i = 0; i < task.assignments.length; i++) {
          const assignment = task.assignments[i];
          const apprentice = await User.findById(assignment.apprentice);
          console.log(`    ${i + 1}. ${apprentice?.name} - ${assignment.percentage}% = ${assignment.earning} so'm`);
        }
      }
      // Eski tizim (assignedTo)
      else if (task.assignedTo && task.assignedTo.toString() === ozodbek._id.toString()) {
        console.log('\n🔙 ESKI TIZIM (Bitta shogird):');
        console.log('  Foiz:', task.apprenticePercentage, '%');
        console.log('  Earning:', task.apprenticeEarning, 'so\'m');
        console.log('  Master Earning:', task.masterEarning, 'so\'m');

        if (task.status === 'approved') {
          totalExpectedEarnings += task.apprenticeEarning || 0;
          console.log('  💰 Tasdiqlangan! Pul qo\'shilgan bo\'lishi kerak');
        } else {
          console.log('  ⏳ Hali tasdiqlanmagan');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 XULOSA:');
    console.log('Jami tasdiqlangan vazifalardan kutilgan daromad:', totalExpectedEarnings, 'so\'m');
    console.log('Hozirgi earnings (database):', ozodbek.earnings, 'so\'m');
    console.log('Farq:', totalExpectedEarnings - ozodbek.earnings, 'so\'m');

    if (totalExpectedEarnings !== ozodbek.earnings) {
      console.log('\n⚠️ MUAMMO TOPILDI! Earnings to\'g\'ri emas!');
      console.log('Tuzatish kerakmi? (Y/N)');
    } else {
      console.log('\n✅ Hammasi to\'g\'ri!');
    }

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ MongoDB dan uzildi');
  }
}

checkOzodbekEarnings();
