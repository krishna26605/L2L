// routes/donations.js - YEH CORRECTED VERSION USE KARO

import express from 'express';
import { donationController } from '../controllers/donationController.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// Public routes (without authentication)
router.get('/stats', donationController.getDonationStats);
router.get('/location', donationController.getDonationsByLocation);

// ✅ FIXED: Main donations route ko bhi protected banao
router.get('/', authController.verifyToken, donationController.getAllDonations);

// Protected routes (require authentication)
router.get('/:id', authController.verifyToken, donationController.getDonationById);
router.post('/', authController.verifyToken, donationController.createDonation);
router.put('/:id', authController.verifyToken, donationController.updateDonation);
router.delete('/:id', authController.verifyToken, donationController.deleteDonation);
router.post('/:id/claim', authController.verifyToken, donationController.claimDonation);
router.post('/:id/pickup', authController.verifyToken, donationController.markAsPicked);

// NGO-specific donation endpoint
router.get('/ngo/my-donations', authController.verifyToken, donationController.getDonationsForMyNGO);

export default router;