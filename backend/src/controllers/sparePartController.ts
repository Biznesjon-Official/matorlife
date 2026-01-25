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
    const { name, price, quantity = 1, supplier = 'Noma\'lum' } = req.body;

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
      price,
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
    const { name, price, quantity, supplier } = req.body;
    
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
    if (price !== undefined) sparePart.price = price;
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

