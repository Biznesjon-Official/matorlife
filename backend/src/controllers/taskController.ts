import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

/**
 * Mashina barcha ishlar tugaganda avtomatik tugatish funksiyasi
 * Bu funksiya ham vazifalar, ham xizmatlar tasdiqlanganda ishlaydi
 */
async function checkAndCompleteCarIfReady(carId: any) {
  try {
    const CarService = require('../models/CarService').default;
    
    // Barcha vazifalar va xizmatlarni tekshirish
    const allTasks = await Task.find({ car: carId });
    const allServices = await CarService.find({ car: carId });
    
    // Vazifalar holati: barcha vazifalar ko'rib chiqilgan va kamida bittasi tasdiqlangan
    const allTasksReviewed = allTasks.length === 0 || allTasks.every((t: any) => 
      t.status === 'approved' || t.status === 'rejected'
    );
    const hasApprovedTasks = allTasks.length === 0 || allTasks.some((t: any) => t.status === 'approved');
    
    // Xizmatlar holati: barcha xizmatlar tasdiqlangan
    const allServicesApproved = allServices.length === 0 || allServices.every((s: any) => 
      s.status === 'completed'
    );
    
    console.log(`🔍 Mashina holati tekshirilmoqda:`, {
      carId,
      tasksCount: allTasks.length,
      servicesCount: allServices.length,
      allTasksReviewed,
      hasApprovedTasks,
      allServicesApproved,
      taskStatuses: allTasks.map((t: any) => ({ id: t._id, status: t.status, title: t.title })),
      serviceStatuses: allServices.map((s: any) => ({ id: s._id, status: s.status }))
    });
    
    // Agar barcha ishlar tugagan bo'lsa
    if (allTasksReviewed && hasApprovedTasks && allServicesApproved) {
      const Car = require('../models/Car').default;
      const car = await Car.findById(carId);
      
      if (car && car.status !== 'completed') {
        console.log(`🎯 Barcha ishlar tugadi - mashina tugatilmoqda: ${car.licensePlate}`);
        
        // Mashina statusini completed ga o'zgartirish
        car.status = 'completed';
        
        // Qarz tekshirish va yaratish
        const totalAmount = car.totalEstimate || 0;
        const paidAmount = car.paidAmount || 0;
        const remainingAmount = totalAmount - paidAmount;

        if (remainingAmount > 0) {
          try {
            const debtService = require('../services/debtService').default;
            await debtService.createDebtForCompletedCar({
              carId: car._id,
              clientName: car.ownerName,
              clientPhone: car.ownerPhone,
              totalAmount,
              paidAmount,
              description: `${car.make} ${car.carModel} (${car.licensePlate}) - Avtomatik yaratilgan qarz (barcha ishlar tugadi)`,
              notes: 'Barcha ishlar tugaganda avtomatik yaratilgan qarz'
            });
          } catch (debtError) {
            console.error('❌ Qarz yaratishda xatolik:', debtError);
          }
        } else {
          console.log(`✅ Mashina to'liq to'langan holda tugatildi: ${car.licensePlate}`);
        }

        await car.save();
        console.log(`✅ Mashina avtomatik tugatildi: ${car.licensePlate} - ${car.ownerName}`);
        
        return { completed: true, car };
      }
    } else {
      console.log(`⏳ Mashina hali tugamagan: vazifalar=${allTasksReviewed}, xizmatlar=${allServicesApproved}`);
    }
    
    return { completed: false };
  } catch (error) {
    console.error('❌ Mashina tugatishda xatolik:', error);
    throw error;
  }
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, // Bitta shogird (eski tizim)
      assignments, // Ko'p shogirdlar (yangi tizim)
      car, 
      service, 
      priority, 
      dueDate, 
      estimatedHours, 
      payment, 
      apprenticePercentage 
    } = req.body;

    const User = require('../models/User').default;

    const taskData: any = {
      title,
      description: description || title,
      assignedBy: req.user!._id,
      createdBy: req.user!._id, // Kim yaratgan
      createdByRole: req.user!.role, // Yaratuvchining roli
      car,
      service,
      serviceItemId: service,
      priority: priority || 'medium',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedHours: estimatedHours || 8,
      payment: payment || 0
    };

    // Yangi tizim: Ko'p shogirdlar (YANGI LOGIKA - Ustoz pulini olish, keyin 50%dan yuqori shogirdlarga bo'lish)
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      const totalPayment = payment || 0;
      
      console.log(`\n🔄 YANGI LOGIKA TIZIMI - Umumiy to'lov: ${totalPayment} so'm`);
      console.log(`👥 Shogirdlar soni: ${assignments.length}`);
      console.log(`👤 Yaratuvchi: ${req.user!.name} (${req.user!.role})`);

      const assignmentsWithPercentage: any[] = [];
      const pendingAssignments: any[] = [];
      
      // 1. Ustoz pulini olish (1-shogirtning foiziga qarab)
      const firstApprentice = await User.findById(assignments[0].apprenticeId);
      const firstPercentage = firstApprentice?.percentage || 50;
      const apprenticePool = (totalPayment * firstPercentage) / 100; // Shogirdlar uchun pul
      const masterShare = totalPayment - apprenticePool; // Ustoz ulushi
      
      console.log(`\n👤 1-shogird: ${firstApprentice?.name}`);
      console.log(`   📊 Foiz: ${firstPercentage}%`);
      console.log(`   💵 Shogirdlar puli: ${apprenticePool.toFixed(2)} so'm`);
      console.log(`   👨‍🏫 Ustoz ulushi: ${masterShare.toFixed(2)} so'm`);

      // 2. 50%dan yuqori va past shogirdlarni ajratish
      const highPercentageApprentices: any[] = [];
      const lowPercentageApprentices: any[] = [];
      
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        const apprentice = await User.findById(assignment.apprenticeId);
        const percentage = apprentice?.percentage || 50;
        
        if (percentage > 50) {
          highPercentageApprentices.push({ ...assignment, apprentice, percentage, index: i });
        } else {
          lowPercentageApprentices.push({ ...assignment, apprentice, percentage, index: i });
        }
      }
      
      console.log(`\n📊 50%dan yuqori shogirdlar: ${highPercentageApprentices.length} ta`);
      console.log(`📊 50% va past shogirdlar: ${lowPercentageApprentices.length} ta`);
      
      // 3. Shogirdlar pulini 50%dan yuqori shogirdlarga teng bo'lish
      const sharePerHighApprentice = highPercentageApprentices.length > 0 
        ? apprenticePool / highPercentageApprentices.length 
        : 0;
      
      console.log(`\n💰 Har bir katta shogirdga: ${sharePerHighApprentice.toFixed(2)} so'm`);

      // SHOGIRT YARATGAN BO'LSA - 1-shogird darhol tasdiqlangan, qolganlari kutish holatida
      if (req.user!.role === 'apprentice') {
        console.log(`\n🔄 SHOGIRT YARATDI - Tasdiq tizimi faollashtirildi`);
        
        // 1-shogirt (o'zi) - darhol tasdiqlangan
        let firstEarning = sharePerHighApprentice;
        
        // Agar kichik shogirdlar bo'lsa, ularning pulini ayirish
        if (lowPercentageApprentices.length > 0) {
          let totalDeductions = 0;
          for (const lowApp of lowPercentageApprentices) {
            const deduction = (sharePerHighApprentice * lowApp.percentage) / 100;
            totalDeductions += deduction;
          }
          firstEarning = sharePerHighApprentice - totalDeductions;
        }
        
        assignmentsWithPercentage.push({
          apprentice: assignments[0].apprenticeId,
          percentage: firstPercentage,
          allocatedAmount: apprenticePool,
          earning: firstEarning,
          masterShare: masterShare
        });

        // Qolgan shogirdlar - tasdiq kutish holatida
        for (let i = 1; i < assignments.length; i++) {
          const assignment = assignments[i];
          const apprentice = await User.findById(assignment.apprenticeId);
          const percentage = apprentice?.percentage || 50;
          
          console.log(`\n⏳ ${i + 1}-shogird kutish holatida: ${apprentice?.name} (${percentage}%)`);
          
          pendingAssignments.push({
            apprentice: assignment.apprenticeId,
            percentage: percentage,
            addedBy: req.user!._id,
            addedByName: req.user!.name,
            status: 'pending',
            createdAt: new Date()
          });
        }
        
        taskData.assignments = assignmentsWithPercentage;
        taskData.pendingAssignments = pendingAssignments;
        taskData.assignedTo = assignments[0].apprenticeId;
        
        console.log(`✅ Shogirt yaratdi: ${assignmentsWithPercentage.length} tasdiqlangan, ${pendingAssignments.length} kutish holatida`);
      } 
      // USTOZ YARATGAN BO'LSA - Hammasi darhol tasdiqlangan
      else {
        console.log(`\n🔄 USTOZ YARATDI - Hammasi darhol tasdiqlangan`);
        
        // 4. Katta shogirdlarga pul taqsimlash
        for (const highApp of highPercentageApprentices) {
          let earning = sharePerHighApprentice;
          
          // Agar 1-shogirt bo'lsa va kichik shogirdlar bo'lsa
          if (highApp.index === 0 && lowPercentageApprentices.length > 0) {
            let totalDeductions = 0;
            for (const lowApp of lowPercentageApprentices) {
              const deduction = (sharePerHighApprentice * lowApp.percentage) / 100;
              totalDeductions += deduction;
            }
            earning = sharePerHighApprentice - totalDeductions;
            console.log(`\n👤 1-shogird: ${highApp.apprentice?.name} (${highApp.percentage}%)`);
            console.log(`   💰 Oladi: ${earning.toFixed(2)} so'm (kichik shogirdlar ayirildi)`);
          } else {
            console.log(`\n👤 ${highApp.index + 1}-shogird: ${highApp.apprentice?.name} (${highApp.percentage}%)`);
            console.log(`   💰 Oladi: ${earning.toFixed(2)} so'm`);
          }

          assignmentsWithPercentage.push({
            apprentice: highApp.apprenticeId,
            percentage: highApp.percentage,
            allocatedAmount: apprenticePool,
            earning: earning,
            masterShare: highApp.index === 0 ? masterShare : 0
          });
        }
        
        // 5. Kichik shogirdlarga pul taqsimlash (1-shogirtning pulidan)
        for (const lowApp of lowPercentageApprentices) {
          const earning = (sharePerHighApprentice * lowApp.percentage) / 100;
          
          console.log(`\n👤 ${lowApp.index + 1}-shogird: ${lowApp.apprentice?.name} (${lowApp.percentage}%)`);
          console.log(`   💰 1-shogirtning pulidan: ${earning.toFixed(2)} so'm`);

          assignmentsWithPercentage.push({
            apprentice: lowApp.apprenticeId,
            percentage: lowApp.percentage,
            allocatedAmount: sharePerHighApprentice,
            earning: earning,
            masterShare: 0
          });
        }

        taskData.assignments = assignmentsWithPercentage;
        taskData.assignedTo = assignments[0].apprenticeId;
      }

      console.log(`✅ YANGI LOGIKA HISOBLASH TUGADI\n`);
    } 
    // Eski tizim: Bitta shogird
    else if (assignedTo) {
      // Shogirtning foizini User modelidan olish
      const apprentice = await User.findById(assignedTo);
      const percentage = apprentice?.percentage || 50; // Agar foiz yo'q bo'lsa, default 50%
      
      const apprenticeEarning = (payment * percentage) / 100;
      const masterEarning = payment - apprenticeEarning;

      console.log(`💰 Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${payment})`);

      taskData.assignedTo = assignedTo;
      taskData.apprenticePercentage = percentage;
      taskData.apprenticeEarning = apprenticeEarning;
      taskData.masterEarning = masterEarning;
    } else {
      return res.status(400).json({ message: 'Kamida bitta shogird tanlang' });
    }

    const task = new Task(taskData);
    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Task yaratishda xatolik:', error);
    res.status(500).json({ 
      message: 'Vazifalarni yaratishda xatolik yuz berdi', 
      error: error.message,
      details: error.stack 
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, assignedTo } = req.query;
    const filter: any = {};

    if (status) filter.status = status;

    // If user is apprentice, show tasks where they are assigned
    if (req.user!.role === 'apprentice') {
      filter.$or = [
        { assignedTo: req.user!._id }, // Eski tizim
        { 'assignments.apprentice': req.user!._id } // Yangi tizim
      ];
    } else if (assignedTo) {
      // Master filter qilganda
      filter.$or = [
        { assignedTo: assignedTo },
        { 'assignments.apprentice': assignedTo }
      ];
    }

    const tasks = await Task.find(filter)
      .select('+apprenticePercentage +apprenticeEarning +masterEarning') // Foiz va daromad maydonlarini qo'shish
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('createdBy', 'name email role') // Yaratuvchini populate qilish
      .populate('car', 'make carModel licensePlate ownerName')
      .populate('service', 'name price')
      .populate('assignments.apprentice', 'name email') // Assignments'dagi shogirdlarni ham populate qilish
      .populate('pendingAssignments.apprentice', 'name email') // Pending assignments'dagi shogirdlarni populate qilish
      .populate('pendingAssignments.addedBy', 'name email') // Qo'shuvchini populate qilish
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('car')
      .populate('service', 'name price')
      .populate('assignments.apprentice', 'name email'); // Assignments'dagi shogirdlarni ham populate qilish

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if apprentice is trying to access someone else's task
    if (req.user!.role === 'apprentice') {
      const isAssigned = task.assignedTo?._id.toString() === req.user!._id.toString() ||
                        task.assignments?.some(a => a.apprentice._id.toString() === req.user!._id.toString());
      
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, 
      assignments, // Ko'p shogirdlar
      car, 
      service, 
      priority, 
      dueDate, 
      estimatedHours, 
      payment 
    } = req.body;
    
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can update any task, apprentice can only update their own tasks
    if (req.user!.role !== 'master') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Update basic fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (car) task.car = car;
    if (service) task.service = service;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (payment !== undefined) task.payment = payment;

    const User = require('../models/User').default;

    // Yangi tizim: Ko'p shogirdlar (YANGI LOGIKA - Ustoz pulini olish, keyin 50%dan yuqori shogirdlarga bo'lish)
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      const totalPayment = payment !== undefined ? payment : task.payment;
      
      console.log(`\n🔄 YANGI LOGIKA (UPDATE) - Umumiy to'lov: ${totalPayment} so'm`);
      console.log(`👤 Yangilovchi: ${req.user!.name} (${req.user!.role})`);

      const assignmentsWithPercentage: any[] = [];
      const pendingAssignments: any[] = [...(task.pendingAssignments || [])];
      
      // 1. Ustoz pulini olish
      const firstApprentice = await User.findById(assignments[0].apprenticeId);
      const firstPercentage = assignments[0].percentage || firstApprentice?.percentage || 50;
      const apprenticePool = (totalPayment * firstPercentage) / 100;
      const masterShare = totalPayment - apprenticePool;
      const firstInitialAmount = apprenticePool; // 1-shogirdning dastlabki puli
      
      console.log(`👤 1-shogird: ${firstApprentice?.name} - ${firstPercentage}%`);
      console.log(`💵 Shogirdlar puli: ${apprenticePool.toFixed(2)} so'm`);
      console.log(`👨‍🏫 Ustoz: ${masterShare.toFixed(2)} so'm`);
      
      // 2. 50%dan yuqori va past shogirdlarni ajratish
      const highPercentageApprentices: any[] = [];
      const lowPercentageApprentices: any[] = [];
      
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        const apprentice = await User.findById(assignment.apprenticeId);
        const percentage = assignment.percentage || apprentice?.percentage || 50;
        
        if (percentage > 50) {
          highPercentageApprentices.push({ ...assignment, apprentice, percentage, index: i });
        } else {
          lowPercentageApprentices.push({ ...assignment, apprentice, percentage, index: i });
        }
      }
      
      const sharePerHighApprentice = highPercentageApprentices.length > 0 
        ? apprenticePool / highPercentageApprentices.length 
        : 0;

      // SHOGIRT YANGILAYOTGAN BO'LSA va yangi shogirdlar qo'shilgan bo'lsa
      if (req.user!.role === 'apprentice') {
        console.log(`\n🔄 SHOGIRT YANGILAYAPTI - Pending tizimi faol`);
        
        // Mavjud tasdiqlangan shogirdlarni topish
        const existingApprovedIds = task.assignments?.map((a: any) => a.apprentice.toString()) || [];
        
        // 1-shogirt (o'zi) - har doim tasdiqlangan
        assignmentsWithPercentage.push({
          apprentice: assignments[0].apprenticeId,
          percentage: firstPercentage,
          allocatedAmount: totalPayment,
          earning: firstInitialAmount, // Hozircha to'liq, keyinchalik kamayadi
          masterShare: masterShare
        });

        // Qolgan shogirdlarni tekshirish
        for (let i = 1; i < assignments.length; i++) {
          const assignment = assignments[i];
          const apprentice = await User.findById(assignment.apprenticeId);
          const percentage = assignment.percentage || apprentice?.percentage || 50;
          
          // Agar bu shogird allaqachon tasdiqlangan bo'lsa
          if (existingApprovedIds.includes(assignment.apprenticeId)) {
            console.log(`✅ Mavjud shogird: ${apprentice?.name} - tasdiqlangan`);
            
            const earning = (firstInitialAmount * percentage) / 100;
            assignmentsWithPercentage[0].earning -= earning; // 1-shogirtdan ayirish
            
            assignmentsWithPercentage.push({
              apprentice: assignment.apprenticeId,
              percentage,
              allocatedAmount: firstInitialAmount,
              earning: earning,
              masterShare: 0
            });
          } else {
            // Yangi shogird - pending holatiga qo'shish
            console.log(`⏳ Yangi shogird: ${apprentice?.name} - pending holatida`);
            
            // Pending'da allaqachon bor-yo'qligini tekshirish
            const alreadyPending = pendingAssignments.some(p => p.apprentice.toString() === assignment.apprenticeId);
            
            if (!alreadyPending) {
              pendingAssignments.push({
                apprentice: assignment.apprenticeId,
                percentage: percentage,
                addedBy: req.user!._id,
                addedByName: req.user!.name,
                status: 'pending',
                createdAt: new Date()
              });
            }
          }
        }
        
        task.assignments = assignmentsWithPercentage;
        task.pendingAssignments = pendingAssignments;
        
        console.log(`✅ Shogirt yangiladi: ${assignmentsWithPercentage.length} tasdiqlangan, ${pendingAssignments.length} kutish holatida`);
      } 
      // USTOZ YANGILAYOTGAN BO'LSA - Hammasi darhol tasdiqlangan
      else {
        console.log(`\n🔄 USTOZ YANGILAYAPTI - Hammasi darhol tasdiqlangan`);
        
        // Qolgan shogirdlarning jami pulini hisoblash
        let totalDeductions = 0;
        for (let i = 1; i < assignments.length; i++) {
          const assignment = assignments[i];
          const apprentice = await User.findById(assignment.apprenticeId);
          const percentage = assignment.percentage || apprentice?.percentage || 50;
          
          const earning = (firstInitialAmount * percentage) / 100;
          totalDeductions += earning;
          
          console.log(`👤 ${i + 1}-shogird: ${apprentice?.name} - ${percentage}% = ${earning.toFixed(2)} so'm (1-shogirtning dastlabki pulidan)`);

          assignmentsWithPercentage.push({
            apprentice: assignment.apprenticeId,
            percentage,
            allocatedAmount: firstInitialAmount,
            earning: earning,
            masterShare: 0
          });
        }

        const firstFinalAmount = firstInitialAmount - totalDeductions;
        console.log(`✅ 1-shogirtga qoldi: ${firstFinalAmount.toFixed(2)} so'm\n`);

        // 1-shogirtni birinchi qo'shish
        assignmentsWithPercentage.unshift({
          apprentice: assignments[0].apprenticeId,
          percentage: firstPercentage,
          allocatedAmount: totalPayment,
          earning: firstFinalAmount,
          masterShare: masterShare
        });

        task.assignments = assignmentsWithPercentage;
        task.pendingAssignments = []; // Ustoz yangilaganda pending'lar tozalanadi
      }

      task.assignedTo = assignments[0].apprenticeId;
    } 
    // Eski tizim: Bitta shogird
    else if (assignedTo) {
      const apprentice = await User.findById(assignedTo);
      const percentage = apprentice?.percentage || 50;
      const totalPayment = payment !== undefined ? payment : task.payment;
      
      const apprenticeEarning = (totalPayment * percentage) / 100;
      const masterEarning = totalPayment - apprenticeEarning;

      console.log(`💰 UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${totalPayment})`);

      task.assignedTo = assignedTo;
      task.apprenticePercentage = percentage;
      task.apprenticeEarning = apprenticeEarning;
      task.masterEarning = masterEarning;
      
      console.log('✅ Bitta shogird yangilandi');
    }
    // Agar faqat payment o'zgargan bo'lsa va assignments mavjud bo'lsa (YANGI LOGIKA)
    else if (payment !== undefined && task.assignments && task.assignments.length > 0) {
      console.log(`\n🔄 PAYMENT UPDATE (YANGI LOGIKA) - Yangi to'lov: ${payment} so'm`);

      const updatedAssignments: any[] = [];
      
      // 1-shogird
      const firstApprentice = await User.findById(task.assignments[0].apprentice);
      const firstPercentage = task.assignments[0].percentage || firstApprentice?.percentage || 50;
      const firstInitialAmount = (payment * firstPercentage) / 100;
      
      const masterShare = payment - firstInitialAmount;
      console.log(`👤 1-shogird: ${firstApprentice?.name} - ${firstPercentage}% = ${firstInitialAmount.toFixed(2)} so'm (dastlabki)`);

      // Qolgan shogirdlarning jami pulini hisoblash
      let totalDeductions = 0;
      for (let i = 1; i < task.assignments.length; i++) {
        const assignment = task.assignments[i];
        const apprentice = await User.findById(assignment.apprentice);
        const percentage = assignment.percentage || apprentice?.percentage || 50;
        
        const earning = (firstInitialAmount * percentage) / 100;
        totalDeductions += earning;
        
        console.log(`👤 ${i + 1}-shogird: ${apprentice?.name} - ${percentage}% = ${earning.toFixed(2)} so'm`);

        updatedAssignments.push({
          apprentice: assignment.apprentice,
          percentage,
          allocatedAmount: firstInitialAmount,
          earning: earning,
          masterShare: 0
        });
      }

      const firstFinalAmount = firstInitialAmount - totalDeductions;
      console.log(`✅ 1-shogirtga qoldi: ${firstFinalAmount.toFixed(2)} so'm\n`);

      // 1-shogirtni birinchi qo'shish
      updatedAssignments.unshift({
        apprentice: task.assignments[0].apprentice,
        percentage: firstPercentage,
        allocatedAmount: payment,
        earning: firstFinalAmount,
        masterShare: masterShare
      });

      task.assignments = updatedAssignments;
    }
    // Agar faqat payment o'zgargan bo'lsa va bitta shogird bo'lsa
    else if (payment !== undefined && task.assignedTo) {
      const apprentice = await User.findById(task.assignedTo);
      const percentage = task.apprenticePercentage || apprentice?.percentage || 50;
      
      const apprenticeEarning = (payment * percentage) / 100;
      const masterEarning = payment - apprenticeEarning;

      console.log(`💰 PAYMENT UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${payment})`);

      task.apprenticePercentage = percentage;
      task.apprenticeEarning = apprenticeEarning;
      task.masterEarning = masterEarning;
      
      console.log('✅ Payment o\'zgarganda bitta shogird yangilandi');
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice', 'pendingAssignments.apprentice', 'pendingAssignments.addedBy']);

    console.log('✅ Task muvaffaqiyatli yangilandi');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Task yangilashda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, actualHours } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions - Yangi va eski tizim uchun
    if (req.user!.role === 'apprentice') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        console.log('❌ 403 Forbidden: Shogird bu vazifaga ruxsati yo\'q');
        console.log('User ID:', req.user!._id);
        console.log('Task assignedTo:', task.assignedTo);
        console.log('Task assignments:', task.assignments);
        return res.status(403).json({ message: 'Bu vazifaga ruxsatingiz yo\'q' });
      }
      console.log('✅ Ruxsat berildi: Shogird vazifani yangilashi mumkin');
    }

    task.status = status;
    if (notes) task.notes = notes;
    if (actualHours) task.actualHours = actualHours;

    if (status === 'completed') {
      task.completedAt = new Date();
      
      // Check if all tasks for this car service are completed
      const allTasks = await Task.find({ car: task.car });
      const allCompleted = allTasks.every(t => 
        t._id.toString() === task._id.toString() ? status === 'completed' : t.status === 'completed' || t.status === 'approved'
      );
      
      // If all tasks are completed, update car service status to ready-for-delivery
      if (allCompleted) {
        const CarService = require('../models/CarService').default;
        await CarService.findOneAndUpdate(
          { car: task.car },
          { status: 'ready-for-delivery' },
          { sort: { createdAt: -1 } } // Get the latest service
        );
      }
    }

    if (status === 'approved') {
      task.approvedAt = new Date();
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service']);

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveTask = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 APPROVE TASK BOSHLANDI');
    console.log('Request body:', req.body);
    console.log('Task ID:', req.params.id);
    console.log('User:', req.user?.name, req.user?.role);
    
    const { approved, rejectionReason } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      console.log('❌ Task topilmadi!');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('📋 Task topildi:', {
      id: task._id,
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo,
      assignments: task.assignments,
      payment: task.payment,
      apprenticeEarning: task.apprenticeEarning
    });

    if (task.status !== 'completed') {
      console.log('❌ Task completed emas! Current status:', task.status);
      return res.status(400).json({ message: 'Task must be completed before approval' });
    }

    task.status = approved ? 'approved' : 'rejected';
    console.log('✏️ Status o\'zgartirildi:', task.status);
    
    if (approved) {
      task.approvedAt = new Date();
      console.log(`✅ Vazifa tasdiqlandi: ${task.title}`);
      
      const User = require('../models/User').default;
      
      // Yangi tizim: Ko'p shogirdlar (YANGI LOGIKA)
      if (task.assignments && task.assignments.length > 0) {
        console.log('\n💰 YANGI LOGIKA TIZIMI - Pul qo\'shilmoqda...');
        console.log(`📋 Jami shogirdlar: ${task.assignments.length}`);
        
        // Har bir shogirdga o'z ulushini qo'shish
        for (let i = 0; i < task.assignments.length; i++) {
          const assignment = task.assignments[i];
          const apprentice = await User.findById(assignment.apprentice);
          
          console.log(`\n👤 ${i + 1}-shogird: ${apprentice?.name}`);
          console.log(`   💵 Olgan pul: ${assignment.earning.toFixed(2)} so'm`);
          
          const updatedUser = await User.findByIdAndUpdate(
            assignment.apprentice,
            { 
              $inc: { 
                earnings: assignment.earning  // Faqat joriy oylikka qo'shish
              } 
            },
            { new: true }
          );
          
          console.log(`   ✅ Joriy oylik: ${updatedUser?.earnings.toFixed(2)} so'm`);
          console.log(`   ✅ Jami daromad: ${updatedUser?.totalEarnings.toFixed(2)} so'm`);
        }
        
        console.log('\n✅ Barcha shogirdlarga pul qo\'shildi (YANGI LOGIKA)\n');
      } 
      // Eski tizim: Bitta shogird
      else if (task.assignedTo && task.apprenticeEarning) {
        console.log('💰 Bitta shogirdli tizim - Pul qo\'shilmoqda...');
        console.log(`  → Shogird ${task.assignedTo} ga ${task.apprenticeEarning} so'm qo'shilmoqda`);
        const updatedUser = await User.findByIdAndUpdate(
          task.assignedTo,
          { 
            $inc: { 
              earnings: task.apprenticeEarning  // Faqat joriy oylikka qo'shish
            } 
          },
          { new: true }
        );
        console.log(`  ✅ Joriy oylik: ${updatedUser?.earnings}`);
        console.log(`  ✅ Jami daromad: ${updatedUser?.totalEarnings}`);
      } else {
        console.log('⚠️ Hech qanday shogird topilmadi yoki earning 0!');
      }

      // Barcha vazifalar va xizmatlar tasdiqlangan yoki yo'qligini tekshirish
      if (task.car) {
        console.log('🚗 Mashina holatini tekshirish...');
        const completionResult = await checkAndCompleteCarIfReady(task.car);
        
        await task.save();
        await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);
        
        console.log('✅ APPROVE TASK MUVAFFAQIYATLI YAKUNLANDI');
        
        // Response'ga mashina tugatilganligi haqida ma'lumot qo'shish
        return res.json({
          message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
          task,
          carCompleted: completionResult.completed,
          carData: completionResult.car
        });
      }
    } else {
      console.log('❌ Vazifa rad etildi');
      task.rejectionReason = rejectionReason;
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    console.log('✅ APPROVE TASK YAKUNLANDI');
    
    res.json({
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      task
    });
  } catch (error: any) {
    console.error('❌ APPROVE TASK XATOLIK:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTaskStats = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    
    // If apprentice, only their stats
    if (req.user!.role === 'apprentice') {
      filter.assignedTo = req.user!._id;
    }

    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments(filter);

    res.json({
      stats,
      totalTasks
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const restartTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is rejected
    if (task.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected tasks can be restarted' });
    }

    // Check permissions - Yangi va eski tizim uchun
    if (req.user!.role === 'apprentice') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Bu vazifaga ruxsatingiz yo\'q' });
      }
    }

    // Reset task to assigned status
    task.status = 'assigned';
    task.rejectionReason = undefined;
    task.completedAt = undefined;
    task.actualHours = undefined;
    task.notes = undefined;

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    res.json({
      message: 'Task restarted successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can delete any task, apprentice can only delete their own tasks
    if (req.user!.role !== 'master') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Pending assignment'ni tasdiqlash
export const approvePendingAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, apprenticeId } = req.params;
    
    console.log(`🔄 Pending assignment tasdiqlash: Task ${taskId}, Apprentice ${apprenticeId}`);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Faqat ustoz tasdiqlashi mumkin
    if (req.user!.role !== 'master') {
      return res.status(403).json({ message: 'Only master can approve assignments' });
    }

    const pendingIndex = task.pendingAssignments.findIndex(p => p.apprentice.toString() === apprenticeId);
    if (pendingIndex === -1) {
      return res.status(404).json({ message: 'Pending assignment not found' });
    }

    const pendingAssignment = task.pendingAssignments[pendingIndex];
    const User = require('../models/User').default;
    const apprentice = await User.findById(pendingAssignment.apprentice);
    
    console.log(`✅ Tasdiqlash: ${apprentice?.name} (${pendingAssignment.percentage}%)`);

    // Pul qayta hisoblash - YANGI LOGIKA
    const totalPayment = task.payment || 0;
    const firstAssignment = task.assignments[0]; // 1-shogird
    const firstInitialAmount = (totalPayment * firstAssignment.percentage) / 100;
    
    // Yangi shogirdning daromadi
    const newApprenticeEarning = (firstInitialAmount * pendingAssignment.percentage) / 100;
    
    // 1-shogirdning daromadini kamaytirish
    task.assignments[0].earning -= newApprenticeEarning;
    
    // Yangi shogirdni assignments'ga qo'shish
    task.assignments.push({
      apprentice: pendingAssignment.apprentice,
      percentage: pendingAssignment.percentage,
      allocatedAmount: firstInitialAmount,
      earning: newApprenticeEarning,
      masterShare: 0
    });
    
    // Pending'dan o'chirish
    task.pendingAssignments.splice(pendingIndex, 1);
    
    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice', 'pendingAssignments.apprentice', 'pendingAssignments.addedBy']);

    console.log(`✅ Tasdiqlandi: ${apprentice?.name} vazifaga qo'shildi`);

    res.json({
      message: 'Assignment approved successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Pending assignment tasdiqlashda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Pending assignment'ni rad etish
export const rejectPendingAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, apprenticeId } = req.params;
    
    console.log(`❌ Pending assignment rad etish: Task ${taskId}, Apprentice ${apprenticeId}`);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Faqat ustoz rad etishi mumkin
    if (req.user!.role !== 'master') {
      return res.status(403).json({ message: 'Only master can reject assignments' });
    }

    const pendingIndex = task.pendingAssignments.findIndex(p => p.apprentice.toString() === apprenticeId);
    if (pendingIndex === -1) {
      return res.status(404).json({ message: 'Pending assignment not found' });
    }

    const pendingAssignment = task.pendingAssignments[pendingIndex];
    const User = require('../models/User').default;
    const apprentice = await User.findById(pendingAssignment.apprentice);
    
    console.log(`❌ Rad etish: ${apprentice?.name} (${pendingAssignment.percentage}%)`);
    
    // Faqat pending'dan o'chirish (pul hisoblash o'zgarmaydi)
    task.pendingAssignments.splice(pendingIndex, 1);
    
    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice', 'pendingAssignments.apprentice', 'pendingAssignments.addedBy']);

    console.log(`✅ Rad etildi: ${apprentice?.name} vazifaga qo'shilmadi`);

    res.json({
      message: 'Assignment rejected successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Pending assignment rad etishda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};