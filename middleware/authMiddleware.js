// C:\Users\Krishna\OneDrive\Desktop\L2L-Mobile-app\backend\middleware\authMiddleware.js

import { User } from '../models/User.js';
import jwt from 'jsonwebtoken'; // Import directly instead of dynamic import

// Base authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Use jwt directly since we imported it above
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

// Role-based middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireDonor = requireRole(['donor']);
export const requireNGO = requireRole(['ngo']);
export const requireDonorOrNGO = requireRole(['donor', 'ngo']);

// Dashboard-specific middleware
export const requireDonorDashboard = [
  authenticate,
  requireDonor
];

export const requireNGODashboard = [
  authenticate,
  requireNGO
];

// Optional: Check if user can access specific resource
export const canAccessDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { FoodDonation } = await import('../models/FoodDonation.js');
    const donation = await FoodDonation.findById(id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    // Donors can access their own donations
    // NGOs can access donations they've claimed or available donations
    if (req.user.role === 'donor' && donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own donations'
      });
    }

    if (req.user.role === 'ngo' && 
        donation.claimedBy && 
        donation.claimedBy.toString() !== req.user._id.toString() &&
        donation.status !== 'available') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access donations you have claimed'
      });
    }

    req.donation = donation;
    next();
  } catch (error) {
    console.error('Donation access check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check donation access'
    });
  }
};

// User profile access control
export const canAccessUserProfile = (req, res, next) => {
  const requestedUserId = req.params.id;

  // Users can only access their own profile
  if (requestedUserId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own profile'
    });
  }

  next();
};

// Check if user is active
export const requireActiveUser = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Account is deactivated. Please contact support.'
    });
  }
  next();
};

// Complete authentication with active check
export const fullAuth = [
  authenticate,
  requireActiveUser
];

// Export all middleware in organized groups
export const authMiddleware = {
  // Basic authentication
  authenticate,
  
  // Role-based access
  requireRole,
  requireDonor,
  requireNGO,
  requireDonorOrNGO,
  
  // Dashboard protection
  requireDonorDashboard,
  requireNGODashboard,
  
  // Resource access control
  canAccessDonation,
  canAccessUserProfile,
  
  // Account status
  requireActiveUser,
  
  // Complete auth stack
  fullAuth
};

export default authMiddleware;