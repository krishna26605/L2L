// C:\Users\Krishna\OneDrive\Desktop\L2L-Mobile-app\backend\models\ClaimRequest.js

import mongoose from 'mongoose';

const claimRequestSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodDonation',
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ngoName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
claimRequestSchema.index({ donationId: 1 });
claimRequestSchema.index({ ngoId: 1 });
claimRequestSchema.index({ status: 1 });

// Static methods
claimRequestSchema.statics.findByDonation = function(donationId) {
  return this.find({ donationId }).sort({ createdAt: -1 });
};

claimRequestSchema.statics.findByNGO = function(ngoId, limit = 50) {
  return this.find({ ngoId }).sort({ createdAt: -1 }).limit(limit);
};

claimRequestSchema.statics.findPending = function(limit = 50) {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(limit);
};

const ClaimRequest = mongoose.model('ClaimRequest', claimRequestSchema);

export { ClaimRequest };