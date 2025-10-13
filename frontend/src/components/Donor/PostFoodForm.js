import { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin, Clock, Package, AlertCircle, Navigation } from 'lucide-react';
import { donationsAPI, uploadAPI } from '../../lib/api';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import toast from 'react-hot-toast';

export const PostFoodForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    foodType: 'prepared',
    expiryTime: '',
    pickupWindow: { start: '', end: '' },
    location: { address: '', lat: 0, lng: 0 }
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  
  const locationInputRef = useRef(null);
  const { isLoaded, loadError, createAutocomplete, getCurrentLocation, reverseGeocode } = useGoogleMaps();

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !locationInputRef.current) {
      return;
    }

    try {
      const autocomplete = createAutocomplete(locationInputRef.current);
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setFormData(prev => ({
            ...prev,
            location: {
              address: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          }));
        }
      });

      console.log('✅ Google Places Autocomplete initialized');
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error);
      toast.error('Location autocomplete unavailable. Please enter address manually.');
    }
  }, [isLoaded, createAutocomplete]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const handleGetCurrentLocation = async () => {
    if (!isLoaded) {
      toast.error('Google Maps is not loaded yet. Please wait.');
      return;
    }

    setLocationLoading(true);
    try {
      const position = await getCurrentLocation();
      const locationData = await reverseGeocode(position.lat, position.lng);
      
      setFormData(prev => ({
        ...prev,
        location: {
          address: locationData.address,
          lat: locationData.lat,
          lng: locationData.lng
        }
      }));
      
      toast.success('Current location detected!');
    } catch (error) {
      console.error('Error getting current location:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please allow location access or enter address manually.');
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please enter address manually.');
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again or enter address manually.');
      } else {
        toast.error('Failed to get current location. Please enter address manually.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    }

    if (!formData.expiryTime) {
      newErrors.expiryTime = 'Expiry time is required';
    }

    if (!formData.pickupWindow.start || !formData.pickupWindow.end) {
      newErrors.pickupWindow = 'Pickup window is required';
    }

    if (!formData.location.address.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (file) => {
    try {
      console.log('📤 Uploading image...', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadAPI.uploadImage(formData);
      console.log('✅ Image uploaded successfully:', response.data);
      return response.data.imageUrl;
    } catch (error) {
      console.error('❌ Image upload error:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
  };

  // In PostFoodForm.js - handleSubmit function ko update karo
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Please fill in all required fields');
    return;
  }

  setLoading(true);

  try {
    let imageUrl = '';
    
    // Upload image if selected
    if (image) {
      try {
        imageUrl = await uploadImage(image);
        toast.success('Image uploaded successfully');
      } catch (uploadError) {
        console.warn('Image upload failed, continuing without image:', uploadError);
        toast.error('Image upload failed. Posting donation without image.');
      }
    }

    // Proper location structure with coordinates
    const donationData = {
      title: formData.title,
      description: formData.description,
      quantity: formData.quantity,
      foodType: formData.foodType,
      expiryTime: formData.expiryTime,
      pickupWindow: {
        start: formData.pickupWindow.start,
        end: formData.pickupWindow.end
      },
      location: {
        address: formData.location.address,
        coordinates: {
          lat: formData.location.lat,
          lng: formData.location.lng
        }
      },
      status: 'available'
    };

    // Only add imageUrl if it was successfully uploaded
    if (imageUrl) {
      donationData.imageUrl = imageUrl;
    }

    console.log('📦 Submitting donation data:', JSON.stringify(donationData, null, 2));
    
    const response = await donationsAPI.create(donationData);
    console.log('✅ Donation posted successfully:', response.data);
    
    // 🎉 SUCCESS: Show success message
    toast.success('🎉 Donation posted successfully! NGOs near you will be notified.', {
      duration: 4000,
      icon: '✅'
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      quantity: '',
      foodType: 'prepared',
      expiryTime: '',
      pickupWindow: { start: '', end: '' },
      location: { address: '', lat: 0, lng: 0 }
    });
    setImage(null);
    setImagePreview('');
    
    // ✅ Close the form after successful submission
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(response.data); // Pass the new donation data to parent
      }
      onClose(); // Close the form modal
    }, 1500); // Small delay to show success message
    
  } catch (error) {
    console.error('❌ Post donation error:', error);
    let errorMessage = 'Failed to post donation';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    // 🚨 ERROR: Show detailed error message
    toast.error(`Donation failed: ${errorMessage}`, {
      duration: 5000,
      icon: '❌'
    });
  } finally {
    setLoading(false);
  }
};

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Post Surplus Food</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Food Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Food Details</h3>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Food Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Fresh sandwiches, Pizza, Fruits"
                disabled={loading}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the food items, ingredients, packaging, etc."
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5 meals, 2 kg, 10 pieces"
                  disabled={loading}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="foodType" className="block text-sm font-medium text-gray-700 mb-2">
                  Food Type
                </label>
                <select
                  id="foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="prepared">Prepared Meal</option>
                  <option value="fresh">Fresh Produce</option>
                  <option value="packaged">Packaged Food</option>
                  <option value="beverages">Beverages</option>
                  <option value="bakery">Bakery</option>
                  <option value="dairy">Dairy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Timing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Time *
                </label>
                <input
                  type="datetime-local"
                  id="expiryTime"
                  name="expiryTime"
                  value={formData.expiryTime}
                  onChange={handleInputChange}
                  min={getCurrentDateTime()}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.expiryTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.expiryTime && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.expiryTime}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Window *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pickupStart" className="block text-xs text-gray-500 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="pickupStart"
                    name="pickupWindow.start"
                    value={formData.pickupWindow.start}
                    onChange={handleInputChange}
                    min={getCurrentDateTime()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.pickupWindow ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="pickupEnd" className="block text-xs text-gray-500 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="pickupEnd"
                    name="pickupWindow.end"
                    value={formData.pickupWindow.end}
                    onChange={handleInputChange}
                    min={formData.pickupWindow.start || getCurrentDateTime()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.pickupWindow ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                </div>
              </div>
              {errors.pickupWindow && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.pickupWindow}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address *
              </label>
              <div className="flex space-x-2">
                <input
                  ref={locationInputRef}
                  type="text"
                  id="location"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter address for pickup or use current location"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={loading || locationLoading || !isLoaded}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  title="Use current location"
                >
                  {locationLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Current</span>
                </button>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.location}
                </p>
              )}
              {!isLoaded && (
                <p className="mt-1 text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Google Maps is loading... Location features will be available shortly.
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Food Image (Optional)</h3>
            <p className="text-sm text-gray-600">
              Add a photo of your food donation. If upload fails, your donation will still be posted without the image.
            </p>
            
            <div className="flex items-center justify-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="h-48 w-48 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </div>
              ) : (
                'Post Donation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};