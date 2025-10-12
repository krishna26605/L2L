import { FoodDonation } from '../models/FoodDonation.js';
import { ClaimRequest } from '../models/ClaimRequest.js';
import { User } from '../models/User.js';

export const donationController = {
  
  // ✅ UPDATED: Enhanced getAllDonations with proper NGO location filtering
  async getAllDonations(req, res) {
    try {
      const { limit = 50, status, donorId, claimedBy } = req.query;
      
      let donations;
      
      console.log('🔍 Fetching donations for user:', req.user?.role, req.user?._id);
      console.log('📊 Query params:', { status, donorId, claimedBy });

      // ✅ ENHANCED: Location-based filtering for NGOs with operational radius
      if (req.user && req.user.role === 'ngo') {
        console.log('🏢 NGO user detected, checking location...');
        
        // Check if NGO has location coordinates
        const ngoUser = await User.findById(req.user._id);
        if (ngoUser && ngoUser.location && ngoUser.location.coordinates) {
          const { lat, lng } = ngoUser.location.coordinates;
          const operationalRadius = ngoUser.ngoDetails?.operationalRadius || 20;
          
          console.log(`📍 NGO has location: ${lat}, ${lng} with ${operationalRadius}km radius`);
          
          // Use location-based filtering with NGO's operational radius
          donations = await this.getDonationsForNGO(
            req.user._id, 
            { lat, lng }, 
            parseInt(limit),
            operationalRadius
          );
          console.log(`✅ Found ${donations.length} donations using location-based filtering`);
        } else {
          // NGO without location - show all available donations
          console.log('⚠️ NGO has no location, showing all available donations');
          donations = await FoodDonation.findAvailable(parseInt(limit));
        }
      } 
      // Other filters (preserve existing functionality)
      else if (status) {
        donations = await FoodDonation.findByStatus(status, parseInt(limit));
      } else if (donorId) {
        donations = await FoodDonation.findByDonor(donorId, parseInt(limit));
      } else if (claimedBy) {
        donations = await FoodDonation.findByClaimedBy(claimedBy, parseInt(limit));
      } else {
        // Default: show available donations for donors or unauthenticated users
        donations = await FoodDonation.findAvailable(parseInt(limit));
      }

      console.log(`🎯 Final result: ${donations.length} donations`);

      res.json({
        success: true,
        donations: donations.map(donation => donation.toJSON()),
        // ✅ ENHANCED: Better metadata about filtering
        metadata: {
          totalCount: donations.length,
          filteredByLocation: (req.user?.role === 'ngo' && donations.length > 0),
          userRole: req.user?.role,
          ngoLocation: req.user?.role === 'ngo' ? req.user.location : null,
          operationalRadius: req.user?.role === 'ngo' ? (req.user.ngoDetails?.operationalRadius || 20) : null
        }
      });
    } catch (error) {
      console.error('Get donations error:', error);
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

  // ✅ ENHANCED: Create new donation with nearby NGO notification
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

      // Build location data - handle coordinates properly
      const locationData = {
        address: location.address
      };
      
      // Only add coordinates if both lat and lng are provided
      if (location.lat !== undefined && location.lng !== undefined) {
        locationData.coordinates = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lng)
        };
        console.log('📍 Location with coordinates:', locationData);
      } else {
        console.log('📍 Location without coordinates');
        // Don't include coordinates field at all
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

      // ✅ NEW: Find and notify nearby NGOs
      try {
        if (locationData.coordinates) {
          const nearbyNGOs = await User.findNGOsNearDonation(
            locationData.coordinates.lat,
            locationData.coordinates.lng,
            20 // 20km radius for notifications
          );

          console.log(`📢 Notifying ${nearbyNGOs.length} nearby NGOs about new donation`);

          // Here you can implement:
          // - Push notifications
          // - Email alerts
          // - WebSocket events
          // - etc.
          
          // For now, just log the notification
          nearbyNGOs.forEach(ngo => {
            console.log(`📨 Would notify NGO: ${ngo.displayName} (${ngo.email})`);
          });
        }
      } catch (notificationError) {
        console.error('❌ Notification error:', notificationError);
        // Don't fail the donation creation if notification fails
      }

      res.status(201).json({
        success: true,
        donation: donation.toJSON(),
        nearbyNGOsCount: nearbyNGOs?.length || 0
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

      // ✅ NEW: Check if NGO is within operational radius of donation
      if (donation.location?.coordinates && ngo.location?.coordinates) {
        const distance = calculateDistance(
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
      
      // Filter donations by distance (simple implementation)
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
      const allDonations = await FoodDonation.findAll(1000); // Get more for stats
      
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

  // ✅ ENHANCED: Get donations for NGO based on location with operational radius
  async getDonationsForNGO(ngoId, ngoLocation, limit = 50, operationalRadius = 20) {
    try {
      console.log(`🔍 Searching donations for NGO ${ngoId} at location:`, ngoLocation);
      console.log(`🎯 Operational radius: ${operationalRadius}km`);
      
      const { lat, lng } = ngoLocation;
      if (!lat || !lng) {
        console.log('❌ Invalid NGO location, returning all available donations');
        return await FoodDonation.findAvailable(limit);
      }

      // Start with smaller radius and progressively increase up to operational radius
      let radiusKm = 5;
      let maxRadiusKm = operationalRadius; // Use NGO's operational radius as maximum
      let donations = [];

      while (radiusKm <= maxRadiusKm && donations.length === 0) {
        console.log(`🔍 Searching within ${radiusKm}km radius...`);
        
        // Get all available donations
        const allDonations = await FoodDonation.findAvailable(1000);
        console.log(`📊 Total available donations: ${allDonations.length}`);
        
        // Filter donations by distance
        donations = allDonations.filter(donation => {
          // Skip donations without coordinates
          if (!donation.location || !donation.location.coordinates || 
              donation.location.coordinates.lat === undefined || 
              donation.location.coordinates.lng === undefined) {
            return false;
          }
          
          const donationLat = donation.location.coordinates.lat;
          const donationLng = donation.location.coordinates.lng;
          
          // Skip if coordinates are invalid
          if (isNaN(donationLat) || isNaN(donationLng)) {
            return false;
          }
          
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            parseFloat(donationLat),
            parseFloat(donationLng)
          );
          
          const isWithinRadius = distance <= radiusKm;
          if (isWithinRadius) {
            console.log(`📍 Donation ${donation._id} is ${distance.toFixed(2)}km away`);
          }
          
          return isWithinRadius;
        });

        console.log(`📦 Found ${donations.length} donations within ${radiusKm}km`);

        if (donations.length > 0) {
          console.log(`✅ Found ${donations.length} donations within ${radiusKm}km radius`);
          break;
        }

        radiusKm += 5; // Increase radius by 5km
        if (radiusKm <= maxRadiusKm) {
          console.log(`🔄 Expanding search radius to ${radiusKm}km`);
        }
      }

      // Sort by distance and limit results
      donations.sort((a, b) => {
        const distanceA = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          a.location.coordinates.lat,
          a.location.coordinates.lng
        );
        const distanceB = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          b.location.coordinates.lat,
          b.location.coordinates.lng
        );
        return distanceA - distanceB;
      });

      const finalResults = donations.slice(0, limit);
      console.log(`🎯 Final results: ${finalResults.length} donations after sorting and limiting`);
      
      return finalResults;
    } catch (error) {
      console.error('❌ Error getting donations for NGO:', error);
      // Fallback to all available donations
      console.log('🔄 Falling back to all available donations');
      return await FoodDonation.findAvailable(limit);
    }
  },

  // ✅ NEW: Get donations specifically for an NGO (separate endpoint)
  async getDonationsForMyNGO(req, res) {
    try {
      if (req.user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can access this endpoint' });
      }

      const { limit = 50 } = req.query;
      const ngo = await User.findById(req.user._id);
      
      if (!ngo.location || !ngo.location.coordinates) {
        return res.status(400).json({ 
          error: 'NGO location not set. Please update your profile with location information.' 
        });
      }

      const { lat, lng } = ngo.location.coordinates;
      const operationalRadius = ngo.ngoDetails?.operationalRadius || 20;

      const donations = await this.getDonationsForNGO(
        req.user._id,
        { lat, lng },
        parseInt(limit),
        operationalRadius
      );

      res.json({
        success: true,
        donations: donations.map(donation => donation.toJSON()),
        metadata: {
          totalCount: donations.length,
          ngoLocation: { lat, lng },
          operationalRadius,
          searchRadius: donations.length > 0 ? 'Within operational radius' : 'Expanded search'
        }
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