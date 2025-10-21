// C:\Users\Krishna\OneDrive\Desktop\L2L-Mobile-app\backend\models\FoodDonation.js

import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      // required: true
    },
    lng: {
      type: Number,
      // required: true
    }
  }
}, { _id: false });

const pickupWindowSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  }
}, { _id: false });

const foodDonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: true,
    trim: true
  },
  foodType: {
    type: String,
    required: true,
    trim: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  pickupWindow: {
    type: pickupWindowSchema,
    required: true
  },
  location: {
    type: locationSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'picked', 'expired'],
    default: 'available'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedByName: {
    type: String,
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  pickedAt: {
    type: Date,
    default: null
  },
  expiredAt: {
    type: Date,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
foodDonationSchema.index({ donorId: 1 });
foodDonationSchema.index({ status: 1 });
foodDonationSchema.index({ claimedBy: 1 });
foodDonationSchema.index({ expiryTime: 1 });
foodDonationSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for checking if expired
foodDonationSchema.virtual('isExpired').get(function() {
  return new Date(this.expiryTime) < new Date();
});

// Virtual for time until expiry
foodDonationSchema.virtual('timeUntilExpiry').get(function() {
  const expiry = new Date(this.expiryTime);
  const now = new Date();
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
});

// Instance methods
foodDonationSchema.methods.claim = async function(ngoId, ngoName) {
  if (this.status !== 'available') {
    throw new Error('Donation is not available for claiming');
  }
  
  this.status = 'claimed';
  this.claimedBy = ngoId;
  this.claimedByName = ngoName;
  this.claimedAt = new Date();
  
  return await this.save();
};

foodDonationSchema.methods.markAsPicked = async function() {
  if (this.status !== 'claimed') {
    throw new Error('Donation must be claimed before it can be marked as picked');
  }
  
  this.status = 'picked';
  this.pickedAt = new Date();
  
  return await this.save();
};

foodDonationSchema.methods.markAsExpired = async function() {
  this.status = 'expired';
  this.expiredAt = new Date();
  
  return await this.save();
};

// Static methods
foodDonationSchema.statics.findByDonor = function(donorId, limit = 50) {
  return this.find({ donorId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

foodDonationSchema.statics.findByStatus = function(status, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit);
};

foodDonationSchema.statics.findAvailable = function(limit = 50) {
  const now = new Date();
  return this.find({
    status: { $in: ['available', 'claimed'] },
    expiryTime: { $gt: now }
  })
    .sort({ expiryTime: 1, createdAt: -1 })
    .limit(limit);
};

foodDonationSchema.statics.findByClaimedBy = function(ngoId, limit = 50) {
  return this.find({ claimedBy: ngoId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

foodDonationSchema.statics.findAll = function(limit = 50) {
  return this.find({})
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Include virtuals in JSON output
foodDonationSchema.set('toJSON', { virtuals: true });

const FoodDonation = mongoose.model('FoodDonation', foodDonationSchema);

export { FoodDonation };
