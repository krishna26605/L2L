import { User } from '../models/User.js';
import { FoodDonation } from '../models/FoodDonation.js';

export const userController = {
  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const { limit = 50, role } = req.query;
      
      let users;
      if (role) {
        users = await User.findByRole(role, parseInt(limit));
      } else {
        users = await User.findAll(parseInt(limit));
      }

      res.json({
        success: true,
        users: users.map(user => user.toJSON())
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  },

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  },

  // Get user profile with statistics
  async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let stats = {};
      
      if (user.role === 'donor') {
        const donations = await FoodDonation.findByDonor(user._id);
        stats = {
          totalDonations: donations.length,
          availableDonations: donations.filter(d => d.status === 'available').length,
          claimedDonations: donations.filter(d => d.status === 'claimed').length,
          completedDonations: donations.filter(d => d.status === 'picked').length,
          totalImpact: donations.filter(d => d.status === 'picked').length
        };
      } else if (user.role === 'ngo') {
        const claimedDonations = await FoodDonation.findByClaimedBy(user._id);
        const availableDonations = await FoodDonation.findAvailable();
        
        stats = {
          totalClaims: claimedDonations.length,
          pendingClaims: claimedDonations.filter(d => d.status === 'claimed').length,
          completedClaims: claimedDonations.filter(d => d.status === 'picked').length,
          availableDonations: availableDonations.length,
          totalImpact: claimedDonations.filter(d => d.status === 'picked').length
        };
      }

      res.json({
        success: true,
        user: user.toJSON(),
        stats
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  // Update user (admin only or self)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is updating their own profile or is admin
      if (req.user._id.toString() !== id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this user' });
      }

      const updateData = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData._id;
      delete updateData.email;
      delete updateData.createdAt;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        user: updatedUser.toJSON()
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete users' });
      }

      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },

  // Get user's donations
  async getUserDonations(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, status } = req.query;
      
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let donations;
      
      if (user.role === 'donor') {
        donations = await FoodDonation.findByDonor(user._id, parseInt(limit));
      } else if (user.role === 'ngo') {
        donations = await FoodDonation.findByClaimedBy(user._id, parseInt(limit));
      } else {
        return res.status(400).json({ error: 'Invalid user role' });
      }

      // Filter by status if provided
      if (status) {
        donations = donations.filter(donation => donation.status === status);
      }

      res.json({
        success: true,
        donations: donations.map(donation => donation.toJSON())
      });
    } catch (error) {
      console.error('Get user donations error:', error);
      res.status(500).json({ error: 'Failed to get user donations' });
    }
  },

  // Search users
  async searchUsers(req, res) {
    try {
      const { q, role, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Get all users and filter by search query
      const users = await User.findAll(parseInt(limit) * 2); // Get more to filter
      
      const filteredUsers = users.filter(user => 
        user.displayName.toLowerCase().includes(q.toLowerCase()) ||
        user.email.toLowerCase().includes(q.toLowerCase())
      );

      // Filter by role if provided
      const finalUsers = role ? 
        filteredUsers.filter(user => user.role === role) : 
        filteredUsers;

      res.json({
        success: true,
        users: finalUsers.slice(0, parseInt(limit)).map(user => user.toJSON())
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  },

  // Get user statistics for dashboard
  async getUserDashboardStats(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let dashboardStats = {};
      
      if (user.role === 'donor') {
        const donations = await FoodDonation.findByDonor(user._id);
        const recentDonations = donations.slice(0, 5);
        
        dashboardStats = {
          totalDonations: donations.length,
          availableDonations: donations.filter(d => d.status === 'available').length,
          claimedDonations: donations.filter(d => d.status === 'claimed').length,
          completedDonations: donations.filter(d => d.status === 'picked').length,
          recentDonations: recentDonations.map(d => d.toJSON()),
          impactScore: donations.filter(d => d.status === 'picked').length * 10 // Simple scoring
        };
      } else if (user.role === 'ngo') {
        const claimedDonations = await FoodDonation.findByClaimedBy(user._id);
        const availableDonations = await FoodDonation.findAvailable();
        const recentClaims = claimedDonations.slice(0, 5);
        
        dashboardStats = {
          totalClaims: claimedDonations.length,
          pendingClaims: claimedDonations.filter(d => d.status === 'claimed').length,
          completedClaims: claimedDonations.filter(d => d.status === 'picked').length,
          availableDonations: availableDonations.length,
          recentClaims: recentClaims.map(d => d.toJSON()),
          impactScore: claimedDonations.filter(d => d.status === 'picked').length * 15 // Higher score for NGOs
        };
      }

      res.json({
        success: true,
        stats: dashboardStats
      });
    } catch (error) {
      console.error('Get user dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to get user dashboard statistics' });
    }
  }
};
