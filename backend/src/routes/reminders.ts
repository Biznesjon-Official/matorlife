import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  archiveExpiredReminders,
  getPendingReminders,
  getUpcomingReminders
} from '../controllers/reminderController';

const router = express.Router();

// Barcha routelar authenticate middleware orqali o'tadi
router.use(authenticate);

// Special routes MUST come before /:id routes
// GET /api/reminders/pending - Vaqti kelgan eslatmalarni olish
router.get('/pending', getPendingReminders);

// GET /api/reminders/upcoming - 30 daqiqa oldin ogohlantirish
router.get('/upcoming', getUpcomingReminders);

// POST /api/reminders/archive-expired - Vaqti o'tgan eslatmalarni arxivlash
router.post('/archive-expired', archiveExpiredReminders);

// GET /api/reminders - Barcha eslatmalarni olish
router.get('/', getReminders);

// POST /api/reminders - Yangi eslatma yaratish
router.post('/', createReminder);

// GET /api/reminders/:id - Bitta eslatmani olish
router.get('/:id', getReminderById);

// PUT /api/reminders/:id - Eslatmani yangilash
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id - Eslatmani o'chirish
router.delete('/:id', deleteReminder);

export default router;
