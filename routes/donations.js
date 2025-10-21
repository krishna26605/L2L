// backend/routes/donations.js
import express from 'express';
import { donationController } from '../controllers/donationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (without authentication)
router.get('/stats', donationController.getDonationStats);
router.get('/location', donationController.getDonationsByLocation);
router.get('/:id', donationController.getDonationById);

// Protected routes (require authentication)
router.get('/', authMiddleware.authenticate, donationController.getAllDonations);
router.post('/', authMiddleware.requireDonorDashboard, donationController.createDonation);
router.put('/:id', [authMiddleware.authenticate, authMiddleware.canAccessDonation], donationController.updateDonation);
router.delete('/:id', [authMiddleware.authenticate, authMiddleware.canAccessDonation], donationController.deleteDonation);
router.post('/:id/claim', authMiddleware.requireNGODashboard, donationController.claimDonation);
router.post('/:id/pickup', [authMiddleware.authenticate, authMiddleware.canAccessDonation], donationController.markAsPicked);

// NGO-specific donation endpoints
router.get('/ngo/my-donations', authMiddleware.requireNGODashboard, donationController.getDonationsForMyNGO);
router.get('/ngo/my-claims', authMiddleware.requireNGODashboard, donationController.getMyClaimedDonations);
router.post('/claims/:claimId/cancel', authMiddleware.requireNGODashboard, donationController.cancelClaim);

export default router;