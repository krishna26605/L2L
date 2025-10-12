import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'donor',
    // ✅ NEW: Location fields for NGOs
    location: {
      address: '',
      coordinates: { lat: null, lng: null }
    },
    ngoDetails: {
      description: '',
      contactNumber: '',
      website: '',
      operationalRadius: 20
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [gettingLocation, setGettingLocation] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ✅ NEW: Handle location changes
  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));

    // Clear location errors
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  // ✅ NEW: Handle NGO details changes
  const handleNGODetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      ngoDetails: {
        ...prev.ngoDetails,
        [field]: value
      }
    }));
  };

  // ✅ NEW: Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Create address from coordinates (you can integrate with a geocoding service later)
        const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        
        handleLocationChange('address', address);
        handleLocationChange('coordinates', { 
          lat: latitude, 
          lng: longitude 
        });
        
        setGettingLocation(false);
        toast.success('Location detected successfully!');
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or enter address manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // ✅ NEW: NGO-specific validations
    if (formData.role === 'ngo') {
      if (!formData.location.address?.trim()) {
        newErrors.location = 'NGO location address is required';
      }
      
      if (!formData.location.coordinates?.lat || !formData.location.coordinates?.lng) {
        newErrors.location = 'Valid coordinates are required for NGOs';
      }
      
      // Validate coordinate ranges
      if (formData.location.coordinates?.lat) {
        const lat = formData.location.coordinates.lat;
        if (lat < -90 || lat > 90) {
          newErrors.location = 'Latitude must be between -90 and 90';
        }
      }
      
      if (formData.location.coordinates?.lng) {
        const lng = formData.location.coordinates.lng;
        if (lng < -180 || lng > 180) {
          newErrors.location = 'Longitude must be between -180 and 180';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('🔄 SignupForm: Attempting registration for:', formData.email, 'as', formData.role);
      console.log('📍 Location data:', formData.role === 'ngo' ? formData.location : 'Not required for donor');
      
      // Prepare data for API
      const signupData = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName.trim(),
        role: formData.role
      };

      // ✅ NEW: Add location and NGO details only for NGOs
      if (formData.role === 'ngo') {
        signupData.location = formData.location;
        signupData.ngoDetails = formData.ngoDetails;
      }

      const response = await signUp(signupData);
      
      console.log('✅ SignupForm: Registration successful!', response);
      
      // Verify cookies were set
      const tokenAfterSignup = Cookies.get('auth_token');
      const userAfterSignup = Cookies.get('user');
      
      console.log('🍪 Token after signup:', tokenAfterSignup ? 'PRESENT' : 'MISSING');
      console.log('🍪 User after signup:', userAfterSignup ? 'PRESENT' : 'MISSING');
      
      if (!tokenAfterSignup) {
        throw new Error('Authentication token not set after registration');
      }
      
      toast.success('Account created successfully!');
      
      // Use the redirectTo from backend response or determine based on user role
      let redirectPath = '/donor-dashboard'; // fallback
      
      if (response?.redirectTo) {
        // Use backend-provided redirect path
        redirectPath = response.redirectTo;
        console.log('🎯 Using backend redirect:', redirectPath);
      } else if (response?.user?.role) {
        // Determine redirect based on user role
        redirectPath = response.user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
        console.log('🎯 Determined redirect from role:', redirectPath);
      } else if (formData.role) {
        // Fallback to form data role
        redirectPath = formData.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
        console.log('🎯 Fallback redirect from form role:', redirectPath);
      }
      
      console.log('🔄 Redirecting to:', redirectPath);
      router.push(redirectPath);
      
    } catch (error) {
      console.error('❌ SignupForm: Registration failed!', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">ZW</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Join ZeroWaste</h2>
        <p className="text-gray-600 mt-2">Create your account to start making a difference</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Name Field */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            {formData.role === 'ngo' ? 'NGO Name' : 'Display Name'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={formData.role === 'ngo' ? 'Enter your NGO name' : 'Enter your display name'}
              disabled={loading}
            />
          </div>
          {errors.displayName && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.displayName}
            </div>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Create a password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.confirmPassword}
            </div>
          )}
        </div>

        {/* ✅ NEW: NGO Location Section */}
        {formData.role === 'ngo' && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              NGO Location Information
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Your location helps us show you nearby food donations. This is required for NGOs.
            </p>
            
            {/* Location Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                NGO Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.location ? 'border-red-300 bg-red-50' : 'border-blue-300'
                  }`}
                  placeholder="Enter your NGO's full address"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loading || gettingLocation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {gettingLocation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  <span>{gettingLocation ? 'Getting...' : 'Auto'}</span>
                </button>
              </div>
            </div>

            {/* Coordinates Display */}
            {formData.location.coordinates.lat && formData.location.coordinates.lng && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">✅ Location Set</p>
                <p className="text-xs text-green-700 mt-1">
                  Coordinates: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            {errors.location && (
              <div className="flex items-center mt-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.location}
              </div>
            )}

            {/* Operational Radius */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Operational Radius (km)
              </label>
              <select
                value={formData.ngoDetails.operationalRadius}
                onChange={(e) => handleNGODetailsChange('operationalRadius', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
              <p className="text-xs text-blue-600 mt-1">
                This determines how far you're willing to travel for food donations.
              </p>
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.role === 'donor' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="role"
                value="donor"
                checked={formData.role === 'donor'}
                onChange={handleChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex-1 text-center">
                <div className="text-lg font-medium text-gray-900">Donor</div>
                <div className="text-sm text-gray-600">I want to donate food</div>
              </div>
            </label>
            
            <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.role === 'ngo' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="role"
                value="ngo"
                checked={formData.role === 'ngo'}
                onChange={handleChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="flex-1 text-center">
                <div className="text-lg font-medium text-gray-900">NGO</div>
                <div className="text-sm text-gray-600">I want to collect food</div>
                {formData.role === 'ngo' && (
                  <div className="text-xs text-green-600 mt-1">📍 Location required</div>
                )}
              </div>
            </label>
          </div>
          {errors.role && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.role}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
            disabled={loading}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};