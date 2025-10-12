import express from 'express';
import { donationController } from '../controllers/donationController.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.get('/', donationController.getAllDonations);
router.get('/stats', donationController.getDonationStats);
router.get('/location', donationController.getDonationsByLocation);

// Protected routes
router.get('/:id', authController.verifyToken, donationController.getDonationById);
router.post('/', authController.verifyToken, donationController.createDonation);
router.put('/:id', authController.verifyToken, donationController.updateDonation);
router.delete('/:id', authController.verifyToken, donationController.deleteDonation);
router.post('/:id/claim', authController.verifyToken, donationController.claimDonation);
router.post('/:id/pickup', authController.verifyToken, donationController.markAsPicked);

// ✅ NEW: NGO-specific donation endpoint
router.get('/ngo/my-donations', authController.verifyToken, donationController.getDonationsForMyNGO);

export default router;