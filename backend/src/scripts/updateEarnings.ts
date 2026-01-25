import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task';
import User from '../models/User';

dotenv.config();

const updateEarnings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autoservice');

    // Get all approved tasks
    const approvedTasks = await Task.find({ status: 'approved' }).populate('assignedTo');

    // Group tasks by apprentice
    const earningsByApprentice: { [key: string]: number } = {};

    for (const task of approvedTasks) {
      if (!task.assignedTo) continue;
      
      let apprenticeId: string;
      if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
        apprenticeId = (task.assignedTo as any)._id.toString();
      } else {
        apprenticeId = String(task.assignedTo);
      }
      
      if (!earningsByApprentice[apprenticeId]) {
        earningsByApprentice[apprenticeId] = 0;
      }
      
      if (task.payment && task.payment > 0) {
        earningsByApprentice[apprenticeId] += task.payment;
      }
    }

    // Update each apprentice's earnings
    for (const [apprenticeId, totalEarnings] of Object.entries(earningsByApprentice)) {
      await User.findByIdAndUpdate(
        apprenticeId,
        { earnings: totalEarnings }
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating earnings:', error);
    process.exit(1);
  }
};

updateEarnings();
