import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// .env faylini yuklash
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkNarzulloDetails() {
  try {
    console.log('🔍 Narzullo daromadini batafsil tekshirish...\n');
    
    // MongoDB'ga ulanish
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autoservice';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB\'ga ulandi\n');

    const User = require('../models/User').default;
    const Task = require('../models/Task').default;
    const Car = require('../models/Car').default;

    // Narzulloni topish
    const narzullo = await User.findOne({ username: 'narzullo' });
    
    if (!narzullo) {
      console.log('❌ Narzullo topilmadi!');
      return;
    }

    console.log(`👤 SHOGIRT: ${narzullo.name} (@${narzullo.username})`);
    console.log(`   ID: ${narzullo._id}`);
    console.log(`   Foiz: ${narzullo.percentage || 'Belgilanmagan'}%`);
    console.log(`   💰 Joriy oylik (earnings): ${narzullo.earnings.toLocaleString()} so'm`);
    console.log(`   💰 Jami daromad (totalEarnings): ${narzullo.totalEarnings.toLocaleString()} so'm`);

    // BARCHA vazifalarni topish (har qanday status)
    const allTasks = await Task.find({
      $or: [
        { assignedTo: narzullo._id },
        { 'assignments.apprentice': narzullo._id }
      ]
    }).populate('car', 'make carModel licensePlate').sort({ createdAt: -1 });

    console.log(`\n📊 BARCHA VAZIFALAR: ${allTasks.length} ta\n`);
    console.log('='.repeat(80));

    for (const task of allTasks) {
      console.log(`\n📝 Vazifa: ${task.title}`);
      console.log(`   ID: ${task._id}`);
      console.log(`   Mashina: ${task.car?.make} ${task.car?.carModel} (${task.car?.licensePlate})`);
      console.log(`   Jami to'lov: ${task.payment.toLocaleString()} so'm`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Yaratilgan: ${new Date(task.createdAt).toLocaleString('uz-UZ')}`);
      
      if (task.completedAt) {
        console.log(`   Tugatilgan: ${new Date(task.completedAt).toLocaleString('uz-UZ')}`);
      }
      
      if (task.approvedAt) {
        console.log(`   Tasdiqlangan: ${new Date(task.approvedAt).toLocaleString('uz-UZ')}`);
      }

      // Yangi tizim: assignments
      if (task.assignments && task.assignments.length > 0) {
        console.log(`\n   ✅ YANGI TIZIM - ${task.assignments.length} ta shogirt`);
        
        const myAssignment = task.assignments.find(
          (a: any) => a.apprentice.toString() === narzullo._id.toString()
        );
        
        if (myAssignment) {
          console.log(`   👤 Narzullo uchun:`);
          console.log(`      Foiz: ${myAssignment.percentage}%`);
          console.log(`      Allocated: ${myAssignment.allocatedAmount.toLocaleString()} so'm`);
          console.log(`      Earning: ${myAssignment.earning.toLocaleString()} so'm`);
          console.log(`      Master Share: ${myAssignment.masterShare.toLocaleString()} so'm`);
          
          if (task.status === 'approved') {
            console.log(`      💰 TASDIQLANGAN - ${myAssignment.earning.toLocaleString()} so'm qo'shilgan bo'lishi kerak!`);
          }
        } else {
          console.log(`   ⚠️  Narzullo assignments'da topilmadi!`);
        }
        
        // Barcha shogirtlarni ko'rsatish
        console.log(`\n   📋 Barcha shogirtlar:`);
        for (let i = 0; i < task.assignments.length; i++) {
          const assignment = task.assignments[i];
          const apprentice = await User.findById(assignment.apprentice);
          console.log(`      ${i + 1}. ${apprentice?.name} - ${assignment.percentage}% = ${assignment.earning.toLocaleString()} so'm`);
        }
      }
      // Eski tizim: assignedTo
      else if (task.assignedTo?.toString() === narzullo._id.toString()) {
        console.log(`\n   ✅ ESKI TIZIM`);
        console.log(`      Foiz: ${task.apprenticePercentage || 'Yo\'q'}%`);
        console.log(`      Apprentice Earning: ${(task.apprenticeEarning || 0).toLocaleString()} so'm`);
        console.log(`      Master Earning: ${(task.masterEarning || 0).toLocaleString()} so'm`);
        
        if (task.status === 'approved') {
          console.log(`      💰 TASDIQLANGAN - ${(task.apprenticeEarning || 0).toLocaleString()} so'm qo'shilgan bo'lishi kerak!`);
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

checkNarzulloDetails();
