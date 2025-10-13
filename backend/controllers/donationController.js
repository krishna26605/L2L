import { FoodDonation } from '../models/FoodDonation.js';
import { User } from '../models/User.js';

export const donationController = {
  
  // ✅ SIMPLE FIXED VERSION: Frontend will handle location filtering
  // donationController.js - yeh updated function use karo
async getAllDonations(req, res) {
  try {
    console.log('🔍 AUTH USER:', req.user?.role);
    console.log('📊 Query params:', req.query);

    const { limit = 100, status, donorId, claimedBy } = req.query;
    
    let donations;

    // ✅ FIXED: Simple query - always return available donations
    if (status === 'available') {
      console.log('🔍 Fetching available donations...');
      donations = await FoodDonation.find({
        status: 'available',
        expiryTime: { $gt: new Date() } // Not expired
      })
      .populate('donorId', 'displayName email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    } 
    else if (donorId) {
      donations = await FoodDonation.find({ donorId })
        .populate('donorId', 'displayName email phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }
    else if (claimedBy) {
      donations = await FoodDonation.find({ claimedBy })
        .populate('donorId', 'displayName email phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    }
    else {
      // ✅ DEFAULT: Show all available donations (even without status filter)
      console.log('🔍 Fetching ALL available donations (default)...');
      donations = await FoodDonation.find({
        status: 'available',
        expiryTime: { $gt: new Date() }
      })
      .populate('donorId', 'displayName email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    }

    console.log(`🎯 Final result: ${donations.length} donations`);
    
    // ✅ DEBUG: Check what's being returned
    if (donations.length > 0) {
      console.log('📍 First donation in response:', {
        id: donations[0]._id,
        title: donations[0].title,
        status: donations[0].status,
        location: donations[0].location,
        expiryTime: donations[0].expiryTime
      });
    }

    res.json({
      success: true,
      donations: donations.map(donation => donation.toJSON()),
      metadata: {
        totalCount: donations.length,
        userRole: req.user?.role
      }
    });
  } catch (error) {
    console.error('❌ Get donations error:', error);
    res.status(500).json({ error: 'Failed to get donations' });
  }
},

  // Get donation by ID
  async getDonationById(req, res) {
    try {
      const { id } = req.params;
      const donation = await FoodDonation.findById(id);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      res.json({
        success: true,
        donation: donation.toJSON()
      });
    } catch (error) {
      console.error('Get donation by ID error:', error);
      res.status(500).json({ error: 'Failed to get donation' });
    }
  },

  // Create new donation
  async createDonation(req, res) {
    try {
      console.log('📥 Received donation data:', JSON.stringify(req.body, null, 2));
      
      const {
        title,
        description,
        quantity,
        foodType,
        expiryTime,
        pickupWindow,
        location,
        imageUrl
      } = req.body;

      // Validate required fields
      if (!title || !description || !quantity || !foodType || !expiryTime || !pickupWindow || !location) {
        return res.status(400).json({
          error: 'Missing required fields: title, description, quantity, foodType, expiryTime, pickupWindow, location'
        });
      }

      // Validate location has address
      if (!location.address) {
        return res.status(400).json({
          error: 'Location address is required'
        });
      }

      // Get donor info
      const donor = await User.findById(req.user._id);
      if (!donor) {
        return res.status(404).json({ error: 'Donor not found' });
      }

      // Build location data
      const locationData = {
        address: location.address
      };
      
      // Add coordinates if provided
      if (location.coordinates && location.coordinates.lat !== undefined && location.coordinates.lng !== undefined) {
        locationData.coordinates = {
          lat: parseFloat(location.coordinates.lat),
          lng: parseFloat(location.coordinates.lng)
        };
        console.log('📍 Location with coordinates:', locationData.coordinates);
      } else {
        console.log('📍 Location without coordinates');
      }

      const donationData = {
        donorId: req.user._id,
        donorName: donor.displayName,
        title,
        description,
        quantity,
        foodType,
        expiryTime: new Date(expiryTime),
        pickupWindow: {
          start: new Date(pickupWindow.start),
          end: new Date(pickupWindow.end)
        },
        location: locationData,
        imageUrl: imageUrl || null
      };

      console.log('💾 Final donation data:', JSON.stringify(donationData, null, 2));

      const donation = new FoodDonation(donationData);
      await donation.save();

      console.log('✅ Donation saved successfully');

      res.status(201).json({
        success: true,
        donation: donation.toJSON(),
        message: 'Donation created successfully'
      });
    } catch (error) {
      console.error('❌ Create donation error:', error);
      console.error('❌ Error details:', error.message);
      
      res.status(500).json({ 
        error: 'Failed to create donation',
        details: error.message 
      });
    }
  },

  // Update donation
  async updateDonation(req, res) {
    try {
      const { id } = req.params;
      const donation = await FoodDonation.findById(id);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Check if user owns this donation
      if (donation.donorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this donation' });
      }

      const updateData = req.body;
      // Handle date fields
      if (updateData.expiryTime) {
        updateData.expiryTime = new Date(updateData.expiryTime);
      }
      if (updateData.pickupWindow) {
        if (updateData.pickupWindow.start) {
          updateData.pickupWindow.start = new Date(updateData.pickupWindow.start);
        }
        if (updateData.pickupWindow.end) {
          updateData.pickupWindow.end = new Date(updateData.pickupWindow.end);
        }
      }
      
      const updatedDonation = await FoodDonation.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        donation: updatedDonation.toJSON()
      });
    } catch (error) {
      console.error('Update donation error:', error);
      res.status(500).json({ error: 'Failed to update donation' });
    }
  },

  // Claim donation
  async claimDonation(req, res) {
    try {
      const { id } = req.params;
      const donation = await FoodDonation.findById(id);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (donation.status !== 'available') {
        return res.status(400).json({ error: 'Donation is not available for claiming' });
      }

      if (donation.isExpired) {
        return res.status(400).json({ error: 'Donation has expired' });
      }

      // Get NGO info
      const ngo = await User.findById(req.user._id);
      if (!ngo || ngo.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can claim donations' });
      }

      // Calculate distance for response
      let distance = null;
      if (donation.location?.coordinates && ngo.location?.coordinates) {
        distance = calculateDistance(
          ngo.location.coordinates.lat,
          ngo.location.coordinates.lng,
          donation.location.coordinates.lat,
          donation.location.coordinates.lng
        );
        
        const operationalRadius = ngo.ngoDetails?.operationalRadius || 20;
        
        if (distance > operationalRadius) {
          return res.status(400).json({ 
            error: `This donation is ${distance.toFixed(1)}km away, which exceeds your operational radius of ${operationalRadius}km` 
          });
        }
        
        console.log(`📍 NGO is ${distance.toFixed(1)}km from donation (within ${operationalRadius}km radius)`);
      }

      const claimedDonation = await donation.claim(req.user._id, ngo.displayName);

      res.json({
        success: true,
        donation: claimedDonation.toJSON(),
        distance: distance ? distance.toFixed(1) : null
      });
    } catch (error) {
      console.error('Claim donation error:', error);
      res.status(500).json({ error: 'Failed to claim donation' });
    }
  },

  // Mark donation as picked up
  async markAsPicked(req, res) {
    try {
      const { id } = req.params;
      const donation = await FoodDonation.findById(id);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Check if user claimed this donation
      if (donation.claimedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to mark this donation as picked' });
      }

      const pickedDonation = await donation.markAsPicked();

      res.json({
        success: true,
        donation: pickedDonation.toJSON()
      });
    } catch (error) {
      console.error('Mark as picked error:', error);
      res.status(500).json({ error: 'Failed to mark donation as picked' });
    }
  },

  // Delete donation
  async deleteDonation(req, res) {
    try {
      const { id } = req.params;
      const donation = await FoodDonation.findById(id);
      
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Check if user owns this donation
      if (donation.donorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this donation' });
      }

      await FoodDonation.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Donation deleted successfully'
      });
    } catch (error) {
      console.error('Delete donation error:', error);
      res.status(500).json({ error: 'Failed to delete donation' });
    }
  },

  // Get donations by location (for map view)
  async getDonationsByLocation(req, res) {
    try {
      const { lat, lng, radius = 10 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const donations = await FoodDonation.findAvailable();
      
      // Filter donations by distance
      const filteredDonations = donations.filter(donation => {
        if (!donation.location?.coordinates) return false;
        
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          donation.location.coordinates.lat,
          donation.location.coordinates.lng
        );
        return distance <= parseFloat(radius);
      });

      res.json({
        success: true,
        donations: filteredDonations.map(donation => donation.toJSON())
      });
    } catch (error) {
      console.error('Get donations by location error:', error);
      res.status(500).json({ error: 'Failed to get donations by location' });
    }
  },

  // Get donation statistics
  async getDonationStats(req, res) {
    try {
      const allDonations = await FoodDonation.findAll(1000);
      
      const stats = {
        total: allDonations.length,
        available: allDonations.filter(d => d.status === 'available' && !d.isExpired).length,
        claimed: allDonations.filter(d => d.status === 'claimed').length,
        picked: allDonations.filter(d => d.status === 'picked').length,
        expired: allDonations.filter(d => d.status === 'expired' || d.isExpired).length,
        byFoodType: {},
        byLocation: {}
      };

      // Group by food type
      allDonations.forEach(donation => {
        stats.byFoodType[donation.foodType] = (stats.byFoodType[donation.foodType] || 0) + 1;
      });

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get donation stats error:', error);
      res.status(500).json({ error: 'Failed to get donation statistics' });
    }
  },

  // Get donations specifically for an NGO
  async getDonationsForMyNGO(req, res) {
    try {
      if (req.user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can access this endpoint' });
      }

      const { limit = 50 } = req.query;
      
      // Return donations claimed by this NGO
      const donations = await FoodDonation.findByClaimedBy(req.user._id, parseInt(limit));

      res.json({
        success: true,
        donations: donations.map(donation => donation.toJSON()),
        count: donations.length
      });
    } catch (error) {
      console.error('Get donations for my NGO error:', error);
      res.status(500).json({ error: 'Failed to get donations for NGO' });
    }
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}