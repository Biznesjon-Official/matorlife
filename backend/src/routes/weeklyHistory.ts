import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserWeeklyHistory,
  getCurrentDateInfo,
  getWeekHistory
} from '../controllers/weeklyHistoryController';

const router = express.Router();

// Joriy sana va kun ma'lumotlari (autentifikatsiya shart emas)
router.get('/current-date', getCurrentDateInfo);

// Foydalanuvchining haftalik tarixi
router.get('/user/:userId', authenticate, getUserWeeklyHistory);

// Ma'lum bir hafta ma'lumoti
router.get('/user/:userId/week/:historyId', authenticate, getWeekHistory);

export default router;
