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
      const { email, password, displayName, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Validate role
      if (!['donor', 'ngo'].includes(role)) {
        return res.status(400).json({ 
          error: 'Role must be either "donor" or "ngo"' 
        });
      }

      // Create user
      const user = new User({
        email,
        password,
        displayName,
        role
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  },

  // Verify JWT token middleware
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: req.user.toJSON()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { displayName, photoURL } = req.body;
      
      const updateData = {};
      if (displayName) updateData.displayName = displayName;
      if (photoURL !== undefined) updateData.photoURL = photoURL;

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        user: updatedUser.toJSON()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password
      req.user.password = newPassword;
      await req.user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
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
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  },

  // Get user statistics
  async getUserStats(req, res) {
    try {
      let stats = {};
      
      if (req.user.role === 'donor') {
        const donations = await FoodDonation.findByDonor(req.user._id);
        stats = {
          totalDonations: donations.length,
          availableDonations: donations.filter(d => d.status === 'available').length,
          claimedDonations: donations.filter(d => d.status === 'claimed').length,
          completedDonations: donations.filter(d => d.status === 'picked').length
        };
      } else if (req.user.role === 'ngo') {
        const claimedDonations = await FoodDonation.findByClaimedBy(req.user._id);
        const availableDonations = await FoodDonation.findAvailable();
        
        stats = {
          totalClaims: claimedDonations.length,
          pendingClaims: claimedDonations.filter(d => d.status === 'claimed').length,
          completedClaims: claimedDonations.filter(d => d.status === 'picked').length,
          availableDonations: availableDonations.length
        };
      }

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to get user statistics' });
    }
  }
};