import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: false
  },
  coordinates: {
    lat: {
      type: Number,
      required: false
    },
    lng: {
      type: Number,
      required: false
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
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

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

userSchema.statics.findNGOsByLocation = function(lat, lng, radiusKm = 5) {
  return this.find({
    role: 'ngo',
    'location.coordinates.lat': { $exists: true },
    'location.coordinates.lng': { $exists: true },
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  });
};

const User = mongoose.model('User', userSchema);

export { User };
