import { Response } from 'express';
import Car from '../models/Car';
import Task from '../models/Task';
import SparePart from '../models/SparePart';
import { AuthRequest } from '../middleware/auth';
import telegramService from '../services/telegramService';
export const createCar = async (req: AuthRequest, res: Response) => {
  try {
    const { make, carModel, year, licensePlate, ownerName, ownerPhone, parts, serviceItems, usedSpareParts } = req.body;
    const existingCar = await Car.findOne({ licensePlate });
    if (existingCar) {
      return res.status(400).json({ message: 'Bu davlat raqami bilan mashina allaqachon mavjud' });
    }

    // Zapchastlar sonini kamaytirish
    if (usedSpareParts && Array.isArray(usedSpareParts)) {
      for (const usedPart of usedSpareParts) {
        const sparePart = await SparePart.findById(usedPart.sparePartId);
        if (!sparePart) {
          return res.status(404).json({ message: `Zapchast topilmadi: ${usedPart.name}` });
        }
        
        if (sparePart.quantity < usedPart.quantity) {
          return res.status(400).json({ 
            message: `Yetarli zapchast yo'q: ${sparePart.name}. Mavjud: ${sparePart.quantity}, Kerak: ${usedPart.quantity}` 
          });
        }

        // Zapchast sonini kamaytirish va ishlatilish sonini oshirish
        await SparePart.findByIdAndUpdate(
          usedPart.sparePartId,
          { 
            $inc: { 
              quantity: -usedPart.quantity,
              usageCount: usedPart.quantity
            }
          }
        );
      }
    }

    const car = new Car({
      make,
      carModel,
      year,
      licensePlate,
      ownerName,
      ownerPhone,
      parts: parts || [],
      serviceItems: serviceItems || []
    });
    await car.save();
    // Telegram'ga xabar yuborish
    let telegramResult = null;
    try {
      console.log('🔍 DEBUG: Parts data:', JSON.stringify(parts, null, 2));
      
      const carData = {
        make,
        carModel,
        year,
        licensePlate,
        ownerName,
        ownerPhone
      };
      
      telegramResult = await telegramService.sendCarAddedNotification(carData, parts || []);
      console.log('📱 Telegram Result:', telegramResult);
    } catch (telegramError) {
      // Telegram xatosi asosiy jarayonni to'xtatmasin
      console.error('❌ Telegram xatosi:', telegramError);
    }

    res.status(201).json({
      message: 'Mashina muvaffaqiyatli qo\'shildi',
      car,
      telegramNotification: telegramResult
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};
export const getCars = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: any = {}; // Barcha mashinalarni olish (o'chirilganlar ham)
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: 'i' } },
        { carModel: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ];
    }
    const cars = await Car.find(filter).sort({ createdAt: -1 });
    res.json({ cars });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarById = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ car });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateCar = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const carId = req.params.id;
    
    // Zapchastlar sonini kamaytirish (faqat yangi zapchastlar uchun)
    if (updates.usedSpareParts && Array.isArray(updates.usedSpareParts)) {
      for (const usedPart of updates.usedSpareParts) {
        const sparePart = await SparePart.findById(usedPart.sparePartId);
        if (!sparePart) {
          return res.status(404).json({ message: `Zapchast topilmadi: ${usedPart.name}` });
        }
        
        if (sparePart.quantity < usedPart.quantity) {
          return res.status(400).json({ 
            message: `Yetarli zapchast yo'q: ${sparePart.name}. Mavjud: ${sparePart.quantity}, Kerak: ${usedPart.quantity}` 
          });
        }

        // Zapchast sonini kamaytirish va ishlatilish sonini oshirish
        await SparePart.findByIdAndUpdate(
          usedPart.sparePartId,
          { 
            $inc: { 
              quantity: -usedPart.quantity,
              usageCount: usedPart.quantity
            }
          }
        );
      }
    }
    
    // Agar davlat raqami o'zgartirilayotgan bo'lsa, unique ekanligini tekshirish
    if (updates.licensePlate) {
      const existingCar = await Car.findOne({ 
        licensePlate: updates.licensePlate,
        _id: { $ne: carId }
      });
      if (existingCar) {
        return res.status(400).json({ 
          message: 'Bu davlat raqami bilan boshqa mashina allaqachon mavjud' 
        });
      }
    }
    // Avval mavjud mashinani olish
    const existingCar = await Car.findById(carId);
    if (!existingCar) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    // MUHIM: Ma'lumotlarni to'g'ri tayyorlash
    const updateData: any = {
      make: updates.make?.trim() || existingCar.make,
      carModel: updates.carModel?.trim() || existingCar.carModel,
      year: Number(updates.year) || existingCar.year,
      licensePlate: updates.licensePlate?.trim() || existingCar.licensePlate,
      ownerName: updates.ownerName?.trim() || existingCar.ownerName,
      ownerPhone: updates.ownerPhone?.trim() || existingCar.ownerPhone,
      status: updates.status || existingCar.status
    };
    // Parts processing - MUHIM: To'g'ri saqlash
    if (updates.parts !== undefined && Array.isArray(updates.parts)) {
      const validParts = updates.parts
        .filter((part: any) => {
          const isValid = part && 
            part.name && 
            typeof part.name === 'string' && 
            part.name.trim() !== '' &&
            typeof part.quantity === 'number' && 
            part.quantity > 0 &&
            typeof part.price === 'number' && 
            part.price >= 0;
          if (!isValid) {
            }
          return isValid;
        })
        .map((part: any) => ({
          name: String(part.name).trim(),
          quantity: Number(part.quantity),
          price: Number(part.price),
          status: part.status || 'needed'
        }));
      updateData.parts = validParts;
    } else {
      updateData.parts = existingCar.parts || [];
    }
    // Service items processing - MUHIM: To'g'ri saqlash
    if (updates.serviceItems !== undefined && Array.isArray(updates.serviceItems)) {
      const validServiceItems = updates.serviceItems
        .filter((item: any) => {
          const isValid = item && 
            item.name && 
            typeof item.name === 'string' && 
            item.name.trim() !== '' &&
            typeof item.quantity === 'number' && 
            item.quantity > 0 &&
            typeof item.price === 'number' && 
            item.price >= 0 &&
            ['part', 'material', 'labor'].includes(item.category);
          if (!isValid) {
            }
          return isValid;
        })
        .map((item: any) => ({
          name: String(item.name).trim(),
          description: String(item.description || '').trim(),
          quantity: Number(item.quantity),
          price: Number(item.price),
          category: item.category
        }));
      updateData.serviceItems = validServiceItems;
    } else {
      updateData.serviceItems = existingCar.serviceItems || [];
    }
    // Manual totalEstimate calculation
    const partsTotal = (updateData.parts || []).reduce((total: number, part: any) => total + (part.price * part.quantity), 0);
    const servicesTotal = (updateData.serviceItems || []).reduce((total: number, service: any) => total + (service.price * service.quantity), 0);
    updateData.totalEstimate = partsTotal + servicesTotal;
    const car = await Car.findByIdAndUpdate(
      carId,
      updateData,
      { new: true, runValidators: true }
    );
    if (!car) {
      return res.status(404).json({ message: 'Mashina yangilanmadi' });
    }

    res.json({
      message: 'Mashina muvaffaqiyatli yangilandi',
      car
    });
  } catch (error: any) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu davlat raqami bilan mashina allaqachon mavjud' 
      });
    }
    // Validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: 'Ma\'lumotlar noto\'g\'ri', 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};
export const addPart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, quantity, status } = req.body;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    car.parts.push({ name, price, quantity, status });
    await car.save();
    res.json({
      message: 'Part added successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updatePart = async (req: AuthRequest, res: Response) => {
  try {
    const { partId } = req.params;
    const updates = req.body;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    const partIndex = car.parts.findIndex(part => part._id?.toString() === partId);
    if (partIndex === -1) {
      return res.status(404).json({ message: 'Part not found' });
    }
    Object.assign(car.parts[partIndex], updates);
    await car.save();
    res.json({
      message: 'Part updated successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deletePart = async (req: AuthRequest, res: Response) => {
  try {
    const { partId } = req.params;
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    const partIndex = car.parts.findIndex(part => part._id?.toString() === partId);
    if (partIndex === -1) {
      return res.status(404).json({ message: 'Part not found' });
    }
    car.parts.splice(partIndex, 1);
    await car.save();
    res.json({
      message: 'Part deleted successfully',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deleteCar = async (req: AuthRequest, res: Response) => {
  try {
    // Soft delete - mashinani o'chirish o'rniga isDeleted = true qilish
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    
    console.log(`🗑️ Mashina arxivga o'tkazildi: ${car.licensePlate} - ${car.ownerName}`);
    
    res.json({
      message: 'Mashina arxivga o\'tkazildi',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Mashina ishlarini olish (faqat berilmagan xizmatlar)
export const getCarServices = async (req: AuthRequest, res: Response) => {
  try {
    const carId = req.params.id;
    
    // Avval mashinani tekshirish
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    // Bu mashina uchun allaqachon berilgan xizmatlarni topish
    const assignedTasks = await Task.find({ 
      car: carId,
      status: { $in: ['assigned', 'in-progress', 'completed', 'approved'] }
    }).select('serviceItemId');
    
    // Berilgan xizmatlar ID larini olish
    const assignedServiceIds = assignedTasks
      .filter(task => task.serviceItemId)
      .map(task => task.serviceItemId!.toString());

    // Mashina serviceItems dan faqat berilmagan ishlarni olish
    // Faqat 'labor' kategoriyasidagi xizmatlarni olish (ehtiyot qismlar emas)
    const availableServices = car.serviceItems.filter(item => 
      item._id && 
      !assignedServiceIds.includes(item._id.toString()) &&
      item.category === 'labor'
    );

    const services = availableServices.map(item => ({
      _id: item._id!,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      quantity: item.quantity
    }));

    res.json({ services });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Client keltirishi kerak bo'lgan qismlarni olish
export const getClientParts = async (req: AuthRequest, res: Response) => {
  try {
    // Barcha avtomobillarni olish
    const cars = await Car.find({});
    
    // Client keltirishi kerak bo'lgan qismlarni filtrlash
    const clientParts: any[] = [];
    
    cars.forEach(car => {
      // Faqat 'tobring' source ga ega bo'lgan qismlarni olish
      const tobringParts = car.parts.filter(part => part.source === 'tobring');
      
      tobringParts.forEach(part => {
        clientParts.push({
          carId: car._id,
          carInfo: {
            make: car.make,
            model: car.carModel,
            licensePlate: car.licensePlate,
            ownerName: car.ownerName,
            ownerPhone: car.ownerPhone
          },
          part: {
            _id: part._id,
            name: part.name,
            price: part.price,
            quantity: part.quantity,
            status: part.status
          }
        });
      });
    });

    res.json({ parts: clientParts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Arxivlangan mashinalarni olish
export const getArchivedCars = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const filter: any = { 
      $or: [
        { isDeleted: true },
        { paymentStatus: 'paid' }
      ]
    };
    
    if (search) {
      filter.$and = [
        { $or: filter.$or },
        {
          $or: [
            { make: { $regex: search, $options: 'i' } },
            { carModel: { $regex: search, $options: 'i' } },
            { licensePlate: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete filter.$or;
    }
    
    const cars = await Car.find(filter).sort({ updatedAt: -1 });
    
    console.log(`📦 Arxivlangan mashinalar: ${cars.length} ta`);
    
    res.json({ cars });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// Mashinani arxivdan qaytarish (restore)
export const restoreCar = async (req: AuthRequest, res: Response) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: false,
        $unset: { deletedAt: 1 }
      },
      { new: true }
    );
    
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    
    console.log(`♻️ Mashina qaytarildi: ${car.licensePlate} - ${car.ownerName}`);
    
    res.json({
      message: 'Mashina muvaffaqiyatli qaytarildi',
      car
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};


// Add payment to car
export const addCarPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const carId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const remaining = car.totalEstimate - (car.paidAmount || 0);
    if (amount > remaining) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining balance' });
    }

    // Update paid amount
    car.paidAmount = (car.paidAmount || 0) + amount;
    
    // Add payment to history
    if (!car.payments) {
      car.payments = [];
    }
    car.payments.push({
      amount,
      method: paymentMethod || 'cash',
      paidAt: new Date(),
      paidBy: req.user?.id,
      notes: notes || ''
    });

    // Update payment status
    if (car.paidAmount >= car.totalEstimate) {
      car.paymentStatus = 'paid';
    } else if (car.paidAmount > 0) {
      car.paymentStatus = 'partial';
    }

    await car.save();

    console.log(`✅ To'lov qo'shildi: ${amount} so'm - ${car.licensePlate} - ${paymentMethod || 'cash'}`);

    // ✨ YANGI: Agar to'liq to'lanmagan bo'lsa, qarz yaratish yoki yangilash
    if (car.paidAmount < car.totalEstimate) {
      const remainingAmount = car.totalEstimate - car.paidAmount;
      
      const Debt = require('../models/Debt').default;
      
      // Avval bu mashina uchun qarz borligini tekshirish
      let existingDebt = await Debt.findOne({
        car: car._id,
        type: 'receivable',
        status: { $in: ['pending', 'partial'] }
      });

      if (existingDebt) {
        // Mavjud qarzni yangilash
        existingDebt.amount = remainingAmount;
        existingDebt.description = `${car.make} ${car.carModel} (${car.licensePlate}) uchun qolgan to'lov`;
        await existingDebt.save();
        console.log(`📝 Qarz yangilandi: ${remainingAmount} so'm - ${car.ownerName}`);
      } else {
        // Yangi qarz yaratish
        const newDebt = new Debt({
          type: 'receivable',
          amount: remainingAmount,
          description: `${car.make} ${car.carModel} (${car.licensePlate}) uchun qolgan to'lov`,
          creditorName: car.ownerName,
          creditorPhone: car.ownerPhone,
          car: car._id,
          status: 'pending',
          paidAmount: 0,
          paymentHistory: [],
          createdBy: req.user?.id
        });
        
        await newDebt.save();
        console.log(`📝 Qarz yaratildi: ${remainingAmount} so'm - ${car.ownerName}`);
      }
    } else {
      // Agar to'liq to'langan bo'lsa, qarzni to'langan deb belgilash
      const Debt = require('../models/Debt').default;
      await Debt.updateMany(
        {
          car: car._id,
          type: 'receivable',
          status: { $in: ['pending', 'partial'] }
        },
        {
          status: 'paid',
          paidAmount: { $set: '$amount' }
        }
      );
      console.log(`✅ Qarz to'liq to'landi - ${car.licensePlate}`);
    }

    res.json({
      message: 'Payment added successfully',
      car
    });
  } catch (error: any) {
    console.error('❌ To\'lov qo\'shishda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
