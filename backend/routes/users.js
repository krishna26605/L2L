import express from 'express';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// All routes require authentication
router.use(authController.verifyToken);

// User routes
router.get('/', userController.getAllUsers);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/profile', userController.getUserProfile);
router.get('/:id/donations', userController.getUserDonations);
router.get('/:id/dashboard-stats', userController.getUserDashboardStats);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
