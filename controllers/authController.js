import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { FoodDonation } from '../models/FoodDonation.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const authController = {
  // Register a new user
  async register(req, res) {
    try {
      const { email, password, displayName, role, location, ngoDetails } = req.body;

      console.log('📝 Registration attempt:', { email, role, location });

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'User with this email already exists' 
        });
      }

      // Validate role
      if (!['donor', 'ngo'].includes(role)) {
        return res.status(400).json({ 
          success: false,
          error: 'Role must be either "donor" or "ngo"' 
        });
      }

      // ✅ NEW: Validate NGO data and require location for NGOs
      if (role === 'ngo') {
        const validationErrors = User.validateNGOData({ displayName, location });
        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: validationErrors.join(', ')
          });
        }

        console.log('🏢 NGO registration with location:', location);
      }

      // ✅ UPDATED: Create user with location for NGOs
      const userData = {
        email,
        password,
        displayName,
        role
      };

      // Add location only for NGOs
      if (role === 'ngo') {
        userData.location = location;
        
        // Add NGO details if provided
        if (ngoDetails) {
          userData.ngoDetails = ngoDetails;
        }
      }

      const user = new User(userData);
      await user.save();

      console.log('✅ User registered successfully:', { role, hasLocation: !!user.location });

      // Generate token
      const token = generateToken(user._id);

      // Determine redirect path based on role
      const redirectTo = role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';

      res.status(201).json({
        success: true,
        token,
        user: user.toJSON(),
        redirectTo,
        message: `${role === 'ngo' ? 'NGO' : 'Donor'} registered successfully`
      });
    } catch (error) {
      console.error('❌ Register error:', error);
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }
      
      // Handle duplicate email
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to register user' 
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt:', email);

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ 
          success: false,
          error: 'Account is deactivated' 
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      console.log('✅ Login successful:', { role: user.role, hasLocation: !!user.location });

      // Generate token
      const token = generateToken(user._id);

      // Determine redirect path based on role
      const redirectTo = user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';

      res.json({
        success: true,
        token,
        user: user.toJSON(),
        redirectTo,
        message: `Welcome back, ${user.displayName}!`
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to login' 
      });
    }
  },

  // Verify JWT token middleware
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          error: 'No token provided' 
        });
      }

      const token = authHeader.split('Bearer ')[1];
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
      console.error('❌ Token verification error:', error);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: req.user.toJSON(),
        role: req.user.role,
        // ✅ NEW: Include location info for frontend
        hasLocation: !!req.user.location,
        location: req.user.location
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user profile' 
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { displayName, photoURL, location, ngoDetails } = req.body;
      
      const updateData = {};
      if (displayName) updateData.displayName = displayName;
      if (photoURL !== undefined) updateData.photoURL = photoURL;
      
      // ✅ UPDATED: Handle location updates properly
      if (location) {
        // For NGOs, validate location
        if (req.user.role === 'ngo') {
          const validationErrors = User.validateNGOData({ displayName: req.user.displayName, location });
          if (validationErrors.length > 0) {
            return res.status(400).json({
              success: false,
              error: validationErrors.join(', ')
            });
          }
        }
        updateData.location = location;
      }
      
      // Update NGO details if provided
      if (ngoDetails && req.user.role === 'ngo') {
        updateData.ngoDetails = { ...req.user.ngoDetails, ...ngoDetails };
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log('✅ Profile updated:', { role: updatedUser.role, hasLocation: !!updatedUser.location });

      res.json({
        success: true,
        user: updatedUser.toJSON(),
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to update user profile' 
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          success: false,
          error: 'Current password is incorrect' 
        });
      }

      // Update password
      req.user.password = newPassword;
      await req.user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to change password' 
      });
    }
  },

  // Delete user account
  async deleteAccount(req, res) {
    try {
      // Delete user's donations if they are a donor
      if (req.user.role === 'donor') {
        await FoodDonation.deleteMany({ donorId: req.user._id });
      }

      // Delete user
      await User.findByIdAndDelete(req.user._id);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete account error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete account' 
      });
    }
  },

  // Get user statistics
  async getUserStats(req, res) {
    try {
      let stats = {};
      
      if (req.user.role === 'donor') {
        const donations = await FoodDonation.find({ donorId: req.user._id });
        stats = {
          totalDonations: donations.length,
          availableDonations: donations.filter(d => d.status === 'available').length,
          claimedDonations: donations.filter(d => d.status === 'claimed').length,
          completedDonations: donations.filter(d => d.status === 'picked').length
        };
      } else if (req.user.role === 'ngo') {
        const claimedDonations = await FoodDonation.find({ claimedBy: req.user._id });
        
        // ✅ UPDATED: Get nearby available donations for NGOs with location
        let availableDonations = [];
        if (req.user.location && req.user.location.coordinates) {
          const allDonations = await FoodDonation.find({ status: 'available' });
          const { lat, lng } = req.user.location.coordinates;
          const operationalRadius = req.user.ngoDetails?.operationalRadius || 20;
          
          availableDonations = allDonations.filter(donation => {
            if (!donation.location?.coordinates) return false;
            return req.user.isWithinRadius(
              donation.location.coordinates.lat,
              donation.location.coordinates.lng,
              operationalRadius
            );
          });
        } else {
          availableDonations = await FoodDonation.find({ status: 'available' });
        }
        
        stats = {
          totalClaims: claimedDonations.length,
          pendingClaims: claimedDonations.filter(d => d.status === 'claimed').length,
          completedClaims: claimedDonations.filter(d => d.status === 'picked').length,
          availableDonations: availableDonations.length,
          // ✅ NEW: Include location-based info
          hasLocation: !!req.user.location,
          operationalRadius: req.user.ngoDetails?.operationalRadius || 20
        };
      }

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('❌ Get user stats error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user statistics' 
      });
    }
  },

  // Check user role and redirect
  async checkUserRole(req, res) {
    try {
      const user = req.user;
      
      res.json({
        success: true,
        role: user.role,
        redirectTo: user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard',
        user: user.toJSON(),
        // ✅ NEW: Include location info
        hasLocation: !!user.location,
        location: user.location
      });
    } catch (error) {
      console.error('❌ Check role error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to check user role' 
      });
    }
  },

  // ✅ NEW: Get NGOs near a specific location (for donors)
  async getNGOsNearLocation(req, res) {
    try {
      const { lat, lng, radius = 20 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      const nearbyNGOs = await User.findNGOsNearDonation(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius)
      );

      res.json({
        success: true,
        ngos: nearbyNGOs.map(ngo => ngo.toJSON()),
        count: nearbyNGOs.length,
        searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseFloat(radius)
      });
    } catch (error) {
      console.error('❌ Get NGOs near location error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find nearby NGOs'
      });
    }
  }
};