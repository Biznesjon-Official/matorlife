import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assignedTo, car, service, priority, dueDate, estimatedHours, payment } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user!._id,
      car,
      service,
      priority,
      dueDate,
      estimatedHours,
      payment: payment || 0
    });

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service']);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, assignedTo } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    // If user is apprentice, only show their tasks
    if (req.user!.role === 'apprentice') {
      filter.assignedTo = req.user!._id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('car', 'make carModel licensePlate ownerName')
      .populate('service', 'name price')
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
      .populate('service', 'name price');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if apprentice is trying to access someone else's task
    if (req.user!.role === 'apprentice' && task.assignedTo._id.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assignedTo, car, service, priority, dueDate, estimatedHours, payment } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can update any task, apprentice can only update their own tasks
    if (req.user!.role !== 'master' && task.assignedTo.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update task fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (car) task.car = car;
    if (service) task.service = service;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (payment !== undefined) task.payment = payment;

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

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, actualHours } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user!.role === 'apprentice' && task.assignedTo.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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
    const { approved, rejectionReason } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task must be completed before approval' });
    }

    task.status = approved ? 'approved' : 'rejected';
    
    if (approved) {
      task.approvedAt = new Date();
      
      // Shogirdning earnings iga pul qo'shish
      if (task.payment && task.payment > 0) {
        const User = require('../models/User').default;
        await User.findByIdAndUpdate(
          task.assignedTo,
          { $inc: { earnings: task.payment } }
        );
      }
    } else {
      task.rejectionReason = rejectionReason;
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service']);

    res.json({
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      task
    });
  } catch (error: any) {
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

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can delete any task, apprentice can only delete their own tasks
    if (req.user!.role !== 'master' && task.assignedTo.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};