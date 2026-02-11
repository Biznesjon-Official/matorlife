import Debt from '../models/Debt';
import Car from '../models/Car';
import mongoose from 'mongoose';

interface CreateOrUpdateDebtParams {
  carId: mongoose.Types.ObjectId | string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: 'cash' | 'card' | 'click';
  notes?: string;
  paymentDate?: string | Date;
  dueDate?: string | Date; // Topshirish kuni (muddat)
  createdBy: mongoose.Types.ObjectId | string;
}

/**
 * Qarz yaratish yoki yangilash uchun markaziy service
 * Bu service barcha qarz operatsiyalarini bir joyda boshqaradi
 */
class DebtService {
  /**
   * Mashina uchun qarz yaratish yoki yangilash
   * Agar to'liq to'langan bo'lsa, qarzni "paid" ga o'zgartiradi
   */
  async createOrUpdateDebt(params: CreateOrUpdateDebtParams) {
    const { carId, totalAmount, paidAmount, paymentMethod, notes, paymentDate, dueDate, createdBy } = params;

    console.log('📝 DebtService.createOrUpdateDebt chaqirildi:', {
      carId,
      totalAmount,
      paidAmount,
      paymentMethod,
      paymentDate,
      paymentDateType: typeof paymentDate,
      dueDate,
      dueDateType: typeof dueDate,
      notes
    });

    // Mashina ma'lumotlarini olish
    const car = await Car.findById(carId);
    if (!car) {
      throw new Error('Car not found');
    }

    const remainingAmount = totalAmount - paidAmount;

    // Mavjud qarzni topish
    let existingDebt = await Debt.findOne({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });

    if (remainingAmount <= 0) {
      // To'liq to'langan - barcha qarzlarni "paid" ga o'zgartirish
      if (existingDebt) {
        existingDebt.status = 'paid';
        existingDebt.paidAmount = existingDebt.amount;
        await existingDebt.save();
        console.log(`✅ Qarz to'liq to'landi - ${car.licensePlate}`);
      }
      return { debt: existingDebt, action: 'paid' };
    }

    if (existingDebt) {
      // Mavjud qarzni yangilash
      existingDebt.amount = totalAmount;
      existingDebt.description = `${car.make} ${car.carModel} (${car.licensePlate}) uchun xizmat to'lovi`;
      
      // Agar topshirish kuni berilgan bo'lsa, dueDate ni yangilash
      if (dueDate) {
        if (typeof dueDate === 'string') {
          const [year, month, day] = dueDate.split('-');
          existingDebt.dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          existingDebt.dueDate = dueDate as Date;
        }
        console.log('📅 Muddat (dueDate) yangilandi:', existingDebt.dueDate);
      }
      
      // Agar yangi to'lov bo'lsa, paymentHistory ga qo'shish
      if (paymentMethod && paidAmount > (existingDebt.paidAmount || 0)) {
        const paymentAmount = paidAmount - (existingDebt.paidAmount || 0);
        let paymentDateObj: Date;
        
        if (paymentDate) {
          // Agar paymentDate string bo'lsa, Date ga o'zgartirish
          if (typeof paymentDate === 'string') {
            // YYYY-MM-DD formatida kelgan sanani UTC vaqtda o'zgartirish
            const [year, month, day] = paymentDate.split('-');
            paymentDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            paymentDateObj = paymentDate as Date;
          }
        } else {
          paymentDateObj = new Date();
        }
        
        console.log('💰 PaymentHistory ga qo\'shilmoqda:', {
          paymentAmount,
          paymentDate,
          paymentDateObj: paymentDateObj.toISOString(),
          paymentMethod,
          notes
        });
        
        existingDebt.paymentHistory.push({
          amount: paymentAmount,
          date: paymentDateObj,
          paymentMethod,
          notes: notes || `Xizmat to'lovi - ${paymentMethod}`
        });
      }
      
      await existingDebt.save();
      console.log(`📝 Qarz yangilandi: ${remainingAmount} so'm qoldi - ${car.ownerName}`);
      return { debt: existingDebt, action: 'updated' };
    } else {
      // Yangi qarz yaratish
      let dueDateObj: Date | undefined = undefined;
      
      if (dueDate) {
        if (typeof dueDate === 'string') {
          const [year, month, day] = dueDate.split('-');
          dueDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          dueDateObj = dueDate as Date;
        }
        console.log('📅 Yangi qarz uchun muddat (dueDate):', dueDateObj);
      }
      
      const newDebt = new Debt({
        type: 'receivable',
        amount: totalAmount,
        description: `${car.make} ${car.carModel} (${car.licensePlate}) uchun xizmat to'lovi`,
        creditorName: car.ownerName,
        creditorPhone: car.ownerPhone,
        car: carId,
        status: 'pending',
        paidAmount: 0,
        paymentHistory: [],
        dueDate: dueDateObj,
        createdBy
      });

      // Agar allaqachon to'lov bo'lsa, paymentHistory ga qo'shish
      if (paymentMethod && paidAmount > 0) {
        let paymentDateObj: Date;
        
        if (paymentDate) {
          // Agar paymentDate string bo'lsa, Date ga o'zgartirish
          if (typeof paymentDate === 'string') {
            // YYYY-MM-DD formatida kelgan sanani UTC vaqtda o'zgartirish
            const [year, month, day] = paymentDate.split('-');
            paymentDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            paymentDateObj = paymentDate as Date;
          }
        } else {
          paymentDateObj = new Date();
        }
        
        console.log('💰 Yangi qarz uchun paymentHistory ga qo\'shilmoqda:', {
          paidAmount,
          paymentDate,
          paymentDateObj: paymentDateObj.toISOString(),
          paymentMethod,
          notes
        });
        
        newDebt.paymentHistory.push({
          amount: paidAmount,
          date: paymentDateObj,
          paymentMethod,
          notes: notes || `Xizmat to'lovi - ${paymentMethod}`
        });
      }

      await newDebt.save();
      console.log(`📝 Qarz yaratildi: ${remainingAmount} so'm - ${car.ownerName}`);
      return { debt: newDebt, action: 'created' };
    }
  }

  /**
   * Mashina tugatilganda avtomatik qarz yaratish
   * Bu funksiya faqat qarz mavjud bo'lmagan holatda yangi qarz yaratadi
   */
  async createDebtForCompletedCar(params: {
    carId: mongoose.Types.ObjectId | string;
    clientName: string;
    clientPhone: string;
    totalAmount: number;
    paidAmount: number;
    description: string;
    notes?: string;
  }) {
    const { carId, clientName, clientPhone, totalAmount, paidAmount, description, notes } = params;
    
    const remainingAmount = totalAmount - paidAmount;
    
    // Agar to'liq to'langan bo'lsa, qarz yaratmaslik
    if (remainingAmount <= 0) {
      console.log(`✅ Mashina to'liq to'langan - qarz yaratilmaydi: ${clientName}`);
      return null;
    }

    // Mavjud faol qarzni tekshirish
    const existingDebt = await Debt.findOne({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });

    if (existingDebt) {
      console.log(`📝 Mavjud qarz topildi - yangi qarz yaratilmaydi: ${clientName}`);
      return existingDebt;
    }

    // Yangi qarz yaratish
    const newDebt = new Debt({
      type: 'receivable',
      amount: remainingAmount,
      description,
      creditorName: clientName,
      creditorPhone: clientPhone,
      car: carId,
      status: 'pending',
      paidAmount: 0,
      paymentHistory: [],
      notes
    });

    await newDebt.save();
    console.log(`💰 Avtomatik qarz yaratildi: ${remainingAmount} so'm - ${clientName}`);
    return newDebt;
  }

  /**
   * Oddiy qarz yaratish (backward compatibility uchun)
   */
  async createDebt(params: {
    carId: mongoose.Types.ObjectId | string;
    clientName: string;
    clientPhone: string;
    amount: number;
    description: string;
    notes?: string;
  }) {
    const { carId, clientName, clientPhone, amount, description, notes } = params;

    const newDebt = new Debt({
      type: 'receivable',
      amount,
      description,
      creditorName: clientName,
      creditorPhone: clientPhone,
      car: carId,
      status: 'pending',
      paidAmount: 0,
      paymentHistory: [],
      notes
    });

    await newDebt.save();
    console.log(`💰 Yangi qarz yaratildi: ${amount} so'm - ${clientName}`);
    return newDebt;
  }

  /**
   * Qarzga to'lov qo'shish
   */
  async addPaymentToDebt(debtId: string, amount: number, paymentMethod: 'cash' | 'card' | 'click', notes?: string) {
    const debt = await Debt.findById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }

    debt.paymentHistory.push({
      amount,
      date: new Date(),
      paymentMethod,
      notes
    });

    await debt.save();
    return debt;
  }

  /**
   * Mashina uchun barcha faol qarzlarni olish
   */
  async getActiveDebtsForCar(carId: string) {
    return await Debt.find({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });
  }

  /**
   * Mashina uchun barcha qarzlarni to'langan deb belgilash
   */
  async markDebtsAsPaid(carId: string) {
    const result = await Debt.updateMany(
      {
        car: carId,
        type: 'receivable',
        status: { $in: ['pending', 'partial'] }
      },
      {
        $set: {
          status: 'paid'
        }
      }
    );
    
    console.log(`✅ ${result.modifiedCount} ta qarz to'liq to'landi`);
    return result;
  }
}

export default new DebtService();
