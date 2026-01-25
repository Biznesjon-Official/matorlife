import { Response } from 'express';
import CarService from '../models/CarService';
import Car from '../models/Car';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
export const createCarService = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, parts, tasks } = req.body;
    const userId = req.user?.id;
    // Verify car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    // Calculate total price
    const totalPrice = parts.reduce((total: number, item: any) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
    const carService = new CarService({
      car: carId,
      items: parts,
      totalPrice,
      createdBy: userId,
      status: 'in-progress'
    });
    await carService.save();
    // Populate car details for response
    await carService.populate('car');
    await carService.populate('createdBy', 'name email');
    // Agar vazifalar berilgan bo'lsa, ularni yaratish
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      const Task = require('../models/Task').default;
      for (const taskData of tasks) {
        const task = new Task({
          title: taskData.title,
          description: taskData.description || 'Vazifa tavsifi',
          assignedTo: taskData.assignedTo,
          assignedBy: userId,
          car: taskData.car,
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate,
          estimatedHours: taskData.estimatedHours || 1,
          payment: taskData.payment || 0,
          status: 'assigned'
        });
        await task.save();
        }
    }
    res.status(201).json({
      message: 'Car service created successfully',
      service: carService
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarServices = async (req: AuthRequest, res: Response) => {
  try {
    const { carId, status } = req.query;
    const filter: any = {};
    if (carId) filter.car = carId;
    if (status) filter.status = status;
    const services = await CarService.find(filter)
      .populate('car')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ services });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getCarServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id)
      .populate('car')
      .populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({ service });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateCarService = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const service = await CarService.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('car').populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({
      message: 'Car service updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deleteCarService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    res.json({ message: 'Car service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateServiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const service = await CarService.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('car').populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    // Agar status "ready-for-delivery" bo'lsa, Telegram xabar yuborish
    if (status === 'ready-for-delivery') {
      const telegramService = require('../services/telegramService').default;
      await telegramService.sendCarReadyNotification(service.car, service);
    }
    // Agar status "delivered" bo'lsa, Telegram xabar yuborish
    if (status === 'delivered') {
      const telegramService = require('../services/telegramService').default;
      await telegramService.sendCarDeliveredNotification(service.car, service);
    }
    res.json({
      message: 'Service status updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Approve service (master only) - changes status from ready-for-delivery to completed
export const approveService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'ready-for-delivery') {
      return res.status(400).json({ message: 'Service must be ready for delivery before approval' });
    }
    service.status = 'completed';
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    // Update all related tasks to approved and add payment to apprentice earnings
    const Task = require('../models/Task').default;
    const User = require('../models/User').default;
    const tasks = await Task.find({ car: service.car, status: 'completed' });
    for (const task of tasks) {
      // Update task status to approved
      task.status = 'approved';
      task.approvedAt = new Date();
      await task.save();
      // Add payment to apprentice earnings
      if (task.payment && task.payment > 0) {
        await User.findByIdAndUpdate(
          task.assignedTo,
          { $inc: { earnings: task.payment } }
        );
      }
    }
    res.json({
      message: 'Service approved successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Reject service (master only) - changes status from ready-for-delivery to rejected
export const rejectService = async (req: AuthRequest, res: Response) => {
  try {
    const { rejectionReason } = req.body;
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'ready-for-delivery') {
      return res.status(400).json({ message: 'Service must be ready for delivery before rejection' });
    }
    service.status = 'rejected';
    service.rejectionReason = rejectionReason || 'Rad etildi';
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    // Update all related tasks to rejected status
    const Task = require('../models/Task').default;
    await Task.updateMany(
      { car: service.car, status: 'completed' },
      { 
        status: 'rejected',
        rejectionReason: rejectionReason || 'Xizmat rad etildi'
      }
    );
    res.json({
      message: 'Service rejected successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Restart service (apprentice can restart rejected service)
export const restartService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await CarService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    if (service.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected services can be restarted' });
    }
    service.status = 'in-progress';
    service.rejectionReason = undefined;
    await service.save();
    await service.populate('car');
    await service.populate('createdBy', 'name email');
    // Update all related tasks back to in-progress status
    const Task = require('../models/Task').default;
    await Task.updateMany(
      { car: service.car, status: 'rejected' },
      { 
        status: 'in-progress',
        $unset: { rejectionReason: 1 }
      }
    );
    res.json({
      message: 'Service restarted successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Add item to service
export const addServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { name, description, price, quantity, category } = req.body;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    service.items.push({
      name,
      description,
      price,
      quantity,
      category
    });
    await service.save();
    res.json({
      message: 'Item added to service successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Update service item
export const updateServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const updates = req.body;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    const itemIndex = service.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    Object.assign(service.items[itemIndex], updates);
    await service.save();
    res.json({
      message: 'Service item updated successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Remove service item
export const removeServiceItem = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, itemId } = req.params;
    const service = await CarService.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Car service not found' });
    }
    service.items = service.items.filter(item => item._id?.toString() !== itemId);
    await service.save();
    res.json({
      message: 'Service item removed successfully',
      service
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};