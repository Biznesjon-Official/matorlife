import { Response } from 'express';
import Service from '../models/Service';
import CarService from '../models/CarService';
import Car from '../models/Car';
import { AuthRequest } from '../middleware/auth';

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, parts, totalPrice } = req.body;
    const userId = req.user?.id;

    // If carId is provided, create a CarService instead
    if (carId) {
      // Verify car exists
      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ message: 'Car not found' });
      }

      const carService = new CarService({
        car: carId,
        items: parts,
        totalPrice,
        createdBy: userId
      });

      await carService.save();

      // Populate car details for response
      await carService.populate('car');
      await carService.populate('createdBy', 'name email');

      return res.status(201).json({
        message: 'Car service created successfully',
        service: carService
      });
    }

    // Original service creation logic for template services
    const { name, description, basePrice, category, estimatedHours } = req.body;

    const service = new Service({
      name,
      description,
      basePrice,
      category,
      estimatedHours,
      parts: parts || []
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const { category, isActive, includeCarServices } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Get template services
    const services = await Service.find(filter).sort({ category: 1, name: 1 });

    // If includeCarServices is true, also get car services
    let carServices: any[] = [];
    if (includeCarServices === 'true') {
      carServices = await CarService.find({})
        .populate('car')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json({ 
      services,
      carServices
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ service });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getServiceCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Service.distinct('category');
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Add part to service
export const addServicePart = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { name, description, price, quantity, isRequired, category } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.parts.push({
      name,
      description,
      price,
      quantity,
      isRequired,
      category
    });

    await service.save();

    res.json({
      message: 'Part added to service successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update service part
export const updateServicePart = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, partId } = req.params;
    const updates = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const partIndex = service.parts.findIndex(part => part._id?.toString() === partId);
    if (partIndex === -1) {
      return res.status(404).json({ message: 'Part not found' });
    }

    Object.assign(service.parts[partIndex], updates);
    await service.save();

    res.json({
      message: 'Service part updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove service part
export const removeServicePart = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, partId } = req.params;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.parts = service.parts.filter(part => part._id?.toString() !== partId);
    await service.save();

    res.json({
      message: 'Service part removed successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};