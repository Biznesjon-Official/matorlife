import { Response } from 'express';
import SparePart from '../models/SparePart';
import { AuthRequest } from '../middleware/auth';

export const searchSpareParts = async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ spareParts: [] });
    }

    const searchQuery: any = {
      isActive: true,
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { supplier: { $regex: q.trim(), $options: 'i' } }
      ]
    };

    const spareParts = await SparePart.find(searchQuery)
      .sort({ usageCount: -1, name: 1 })
      .limit(Number(limit));

    res.json({ spareParts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSpareParts = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    const filter: any = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const spareParts = await SparePart.find(filter)
      .sort({ usageCount: -1, name: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SparePart.countDocuments(filter);

    res.json({
      spareParts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSparePartById = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json({ sparePart });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, costPrice, sellingPrice, price, quantity = 1, supplier = 'Noma\'lum' } = req.body;

    // Check if spare part with same name already exists
    const existingSparePart = await SparePart.findOne({ 
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      isActive: true 
    });

    if (existingSparePart) {
      return res.status(400).json({ 
        message: 'Bu nom bilan zapchast allaqachon mavjud',
        existingSparePart 
      });
    }

    const sparePart = new SparePart({
      name: name.trim(),
      costPrice: costPrice || price, // Backward compatibility
      sellingPrice: sellingPrice || price, // Backward compatibility
      price: sellingPrice || price, // Deprecated field
      quantity,
      supplier: supplier.trim()
    });

    await sparePart.save();

    res.status(201).json({
      message: 'Zapchast muvaffaqiyatli yaratildi',
      sparePart
    });
  } catch (error: any) {
    console.error('Error creating spare part:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const { name, costPrice, sellingPrice, price, quantity, supplier } = req.body;
    
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== sparePart.name) {
      const existingSparePart = await SparePart.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id },
        isActive: true 
      });

      if (existingSparePart) {
        return res.status(400).json({ 
          message: 'Bu nom bilan zapchast allaqachon mavjud' 
        });
      }
    }

    // Update fields
    if (name) sparePart.name = name.trim();
    if (costPrice !== undefined) sparePart.costPrice = costPrice;
    if (sellingPrice !== undefined) sparePart.sellingPrice = sellingPrice;
    if (price !== undefined) {
      // Backward compatibility - if only price is provided
      if (costPrice === undefined && sellingPrice === undefined) {
        sparePart.costPrice = price;
        sparePart.sellingPrice = price;
      }
      sparePart.price = sellingPrice || price;
    }
    if (quantity !== undefined) sparePart.quantity = quantity;
    if (supplier) sparePart.supplier = supplier.trim();

    await sparePart.save();

    res.json({
      message: 'Zapchast muvaffaqiyatli yangilandi',
      sparePart
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSparePart = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findById(req.params.id);
    
    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    // Soft delete - just mark as inactive
    sparePart.isActive = false;
    await sparePart.save();

    res.json({
      message: 'Zapchast muvaffaqiyatli o\'chirildi'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const incrementUsage = async (req: AuthRequest, res: Response) => {
  try {
    const sparePart = await SparePart.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!sparePart) {
      return res.status(404).json({ message: 'Spare part not found' });
    }

    res.json({ sparePart });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Avtomobillarning "keltirish kerak" zapchastlarini olish
export const getRequiredParts = async (req: AuthRequest, res: Response) => {
  try {
    const Car = require('../models/Car').default;
    
    // Barcha avtomobillarni olish va faqat "tobring" source'li qismlarni filter qilish
    const cars = await Car.find({
      'parts.source': 'tobring',
      status: { $ne: 'delivered' } // Yetkazilgan avtomobillarni chiqarib tashlash
    }).select('make carModel licensePlate ownerName ownerPhone parts status');

    // Har bir avtomobilning "tobring" qismlarini ajratib olish
    const requiredParts = cars.flatMap((car: any) => 
      car.parts
        .filter((part: any) => part.source === 'tobring')
        .map((part: any) => ({
          _id: part._id,
          name: part.name,
          price: part.price,
          quantity: part.quantity,
          status: part.status,
          car: {
            _id: car._id,
            make: car.make,
            carModel: car.carModel,
            licensePlate: car.licensePlate,
            ownerName: car.ownerName,
            ownerPhone: car.ownerPhone,
            status: car.status
          }
        }))
    );

    res.json({ requiredParts });
  } catch (error: any) {
    console.error('Error fetching required parts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// "Keltirish kerak" qismni o'chirish
export const removeRequiredPart = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, partId } = req.params;
    const Car = require('../models/Car').default;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Qismni o'chirish
    car.parts = car.parts.filter((part: any) => part._id.toString() !== partId);
    await car.save();

    res.json({
      message: 'Required part removed successfully',
      car
    });
  } catch (error: any) {
    console.error('Error removing required part:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// "Keltirish kerak" qismni ombordagi zapchastga qo'shish
export const addRequiredPartToInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, partId } = req.params;
    const { supplier } = req.body;
    const Car = require('../models/Car').default;
    
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Qismni topish
    const part = car.parts.find((p: any) => p._id.toString() === partId);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    // Ombordagi zapchastlarni tekshirish - mavjud bo'lsa miqdorni oshirish
    const existingSparePart = await SparePart.findOne({ name: part.name });
    
    if (existingSparePart) {
      existingSparePart.quantity += part.quantity;
      await existingSparePart.save();
    } else {
      // Yangi zapchast yaratish
      const newSparePart = new SparePart({
        name: part.name,
        price: part.price,
        costPrice: part.price,
        sellingPrice: part.price,
        quantity: part.quantity,
        supplier: supplier || 'Client',
        createdBy: req.user!._id
      });
      await newSparePart.save();
    }

    // Avtomobildan qismni o'chirish
    car.parts = car.parts.filter((p: any) => p._id.toString() !== partId);
    await car.save();

    res.json({
      message: 'Part added to inventory successfully',
      car
    });
  } catch (error: any) {
    console.error('Error adding part to inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
