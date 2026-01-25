import express from 'express';
import { body } from 'express-validator';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceCategories,
  addServicePart,
  updateServicePart,
  removeServicePart
} from '../controllers/serviceController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create service (master only)
router.post('/', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 3 }).withMessage('Service name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('estimatedHours').isFloat({ min: 0.5 }).withMessage('Estimated hours must be at least 0.5'),
  handleValidationErrors
], createService);

// Get services
router.get('/', authenticate, getServices);

// Get service categories
router.get('/categories', authenticate, getServiceCategories);

// Get service by ID
router.get('/:id', authenticate, getServiceById);

// Update service (master only)
router.put('/:id', authenticate, authorize('master'), updateService);

// Delete service (master only)
router.delete('/:id', authenticate, authorize('master'), deleteService);

export default router;

// Service parts routes
router.post('/:serviceId/parts', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Part name must be at least 2 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('category').isIn(['part', 'material', 'labor']).withMessage('Category must be part, material, or labor'),
  handleValidationErrors
], addServicePart);

router.put('/:serviceId/parts/:partId', authenticate, authorize('master'), updateServicePart);
router.delete('/:serviceId/parts/:partId', authenticate, authorize('master'), removeServicePart);