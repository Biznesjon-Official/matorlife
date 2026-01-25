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
      const carData = {
        make,
        carModel, // ✅ To'g'ri maydon nomi
        year,
        licensePlate,
        ownerName,
        ownerPhone
      };
      
      // Debug: Mijoz telefon raqamini tekshirish
      const phoneCheck = telegramService.checkCustomerPhone(ownerPhone);
      console.log('🔍 Customer Phone Check Result:', phoneCheck);
      
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
    const filter: any = {};
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
    // Telegram'ga xabar yuborish
    let telegramResult = null;
    try {
      const carData = {
        make: car.make,
        carModel: car.carModel, // ✅ To'g'ri maydon nomi
        year: car.year,
        licensePlate: car.licensePlate,
        ownerName: car.ownerName,
        ownerPhone: car.ownerPhone
      };
      telegramResult = await telegramService.sendCarUpdatedNotification(carData, car.parts || [], car.serviceItems || []);
      } catch (telegramError) {
      // Telegram xatosi asosiy jarayonni to'xtatmasin
      console.error('Telegram xatosi:', telegramError);
    }

    res.json({
      message: 'Mashina muvaffaqiyatli yangilandi',
      car,
      telegramNotification: telegramResult
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
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    res.json({
      message: 'Mashina muvaffaqiyatli o\'chirildi',
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
    }).select('service');
    
    // Berilgan xizmatlar ID larini olish
    const assignedServiceIds = assignedTasks
      .filter(task => task.service)
      .map(task => task.service!.toString());

    // Mashina serviceItems dan faqat berilmagan ishlarni olish
    const availableServices = car.serviceItems.filter(item => 
      item._id && !assignedServiceIds.includes(item._id.toString())
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