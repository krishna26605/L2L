import express from 'express';
import { authController } from '../controllers/authController.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').trim().isLength({ min: 2 }),
  body('role').isIn(['donor', 'ngo'])
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

// ✅ NEW: Get NGOs near location (public route for donors)
router.get('/ngos/nearby', authController.getNGOsNearLocation);

// Protected routes (require authentication)
router.get('/profile', authController.verifyToken, authController.getProfile);
router.put('/profile', authController.verifyToken, authController.updateProfile);
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], authController.verifyToken, authController.changePassword);
router.delete('/account', authController.verifyToken, authController.deleteAccount);
router.get('/stats', authController.verifyToken, authController.getUserStats);

export default router;