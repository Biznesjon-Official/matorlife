import express from 'express';
import { getPublicStats } from '../controllers/statsController';

const router = express.Router();

// Public endpoint - authentication kerak emas
router.get('/public', getPublicStats);

export default router;
