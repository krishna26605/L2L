import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['donor', 'ngo'],
    default: 'donor'
  },
  photoURL: {
    type: String,
    default: null
  },
  location: {
    type: locationSchema,
    required: function() { 
      return this.role === 'ngo'; // ✅ Location required only for NGOs
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // ✅ NEW: Additional NGO-specific fields
  ngoDetails: {
    description: {
      type: String,
      default: ''
    },
    contactNumber: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    operationalRadius: {
      type: Number,
      default: 20 // Default 20km radius
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// ✅ NEW: Compound index for location-based queries
userSchema.index({ 
  role: 1, 
  'location.coordinates': '2dsphere' 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ NEW: Custom validation for NGO location
userSchema.pre('save', function(next) {
  if (this.role === 'ngo') {
    if (!this.location || !this.location.coordinates) {
      return next(new Error('Location with coordinates is required for NGOs'));
    }
    
    const { lat, lng } = this.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return next(new Error('Valid coordinates (lat, lng) are required for NGOs'));
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return next(new Error('Invalid coordinates: lat must be between -90 and 90, lng between -180 and 180'));
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// ✅ NEW: Method to check if NGO is within radius of a location
userSchema.methods.isWithinRadius = function(targetLat, targetLng, radiusKm = null) {
  if (this.role !== 'ngo' || !this.location || !this.location.coordinates) {
    return false;
  }
  
  const operationalRadius = radiusKm || this.ngoDetails.operationalRadius || 20;
  const distance = this.calculateDistance(
    targetLat,
    targetLng,
    this.location.coordinates.lat,
    this.location.coordinates.lng
  );
  
  return distance <= operationalRadius;
};

// ✅ NEW: Calculate distance between two points
userSchema.methods.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByRole = function(role, limit = 50) {
  return this.find({ role }).limit(limit).sort({ createdAt: -1 });
};

userSchema.statics.findAll = function(limit = 50) {
  return this.find({}).limit(limit).sort({ createdAt: -1 });
};

// ✅ UPDATED: Find NGOs by location with proper geospatial query
userSchema.statics.findNGOsByLocation = function(lat, lng, radiusKm = 20) {
  return this.find({
    role: 'ngo',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // MongoDB uses [longitude, latitude] order
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  });
};

// Add this to your User model (models/User.js)
userSchema.statics.getDonationsForNGO = async function(ngoId, filters = {}) {
  try {
    const Donation = mongoose.model('FoodDonation');
    let query = { claimedBy: ngoId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    const donations = await Donation.find(query)
      .populate('donorId', 'displayName email phone')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);

    return donations;
  } catch (error) {
    console.error('❌ Get donations for NGO error:', error);
    throw error;
  }
};

// ✅ NEW: Find NGOs within radius of a donation location
userSchema.statics.findNGOsNearDonation = function(donationLat, donationLng, radiusKm = 20) {
  return this.find({
    role: 'ngo',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [donationLng, donationLat]
        },
        $maxDistance: radiusKm * 1000
      }
    },
    isActive: true
  });
};



// ✅ NEW: Get all NGOs with location data
userSchema.statics.getAllNGOsWithLocation = function(limit = 100) {
  return this.find({
    role: 'ngo',
    'location.coordinates': { $exists: true }
  })
  .limit(limit)
  .sort({ createdAt: -1 });
};

// ✅ NEW: Validate NGO data
userSchema.statics.validateNGOData = function(data) {
  const errors = [];
  
  if (!data.displayName || data.displayName.trim().length < 2) {
    errors.push('NGO name is required and must be at least 2 characters long');
  }
  
  if (!data.location || !data.location.coordinates) {
    errors.push('Location with coordinates is required for NGOs');
  } else {
    const { lat, lng } = data.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      errors.push('Valid coordinates (lat, lng) are required');
    } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Invalid coordinates: lat must be between -90 and 90, lng between -180 and 180');
    }
  }
  
  return errors;
};

const User = mongoose.model('User', userSchema);

export { User };