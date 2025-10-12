import { useState, useEffect } from 'react';
import { Clock, MapPin, Package, Edit, Trash2, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { donationsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export const DonationCard = ({ donation, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // ✅ Same image URL processing logic as NGO dashboard
  useEffect(() => {
    const processImageUrl = (url) => {
      if (!url) return '';
      
      console.log('🖼️ Donor Dashboard - Original image URL:', url);
      
      // ✅ Case 1: If it's already a full backend URL, use it directly
      if (url.includes('localhost:5000/uploads')) {
        console.log('✅ Already correct backend URL');
        return url;
      }
      
      // ✅ Case 2: If it contains frontend URL, replace with backend URL
      if (url.includes('localhost:3000/api/uploads')) {
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const correctedUrl = url.replace('http://localhost:3000/api/uploads', `${backendUrl}/uploads`);
        console.log('🔄 Fixed frontend URL to backend:', correctedUrl);
        return correctedUrl;
      }
      
      // ✅ Case 3: If it's just a filename or relative path
      if (url.startsWith('/uploads/') || !url.includes('://')) {
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        // Remove any leading slash to avoid double slashes
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        const fullUrl = `${backendUrl}/${cleanPath}`;
        console.log('✅ Built full backend URL:', fullUrl);
        return fullUrl;
      }
      
      // ✅ Case 4: Return as-is (might be external URL)
      console.log('⚠️ Unknown URL format, using as-is:', url);
      return url;
    };

    setImageUrl(processImageUrl(donation.imageUrl));
  }, [donation.imageUrl]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'claimed':
        return 'bg-orange-100 text-orange-800';
      case 'picked':
        return 'bg-purple-100 text-purple-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <Package className="h-4 w-4" />;
      case 'claimed':
        return <Clock className="h-4 w-4" />;
      case 'picked':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const handleImageError = () => {
    console.error('❌ Donor Dashboard - Image failed to load:', imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('✅ Donor Dashboard - Image loaded successfully:', imageUrl);
    setImageLoaded(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this donation?')) {
      return;
    }

    setLoading(true);
    try {
      await donationsAPI.delete(donation._id || donation.id);
      toast.success('Donation deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete donation');
    } finally {
      setLoading(false);
    }
  };

  // Safe data access with fallbacks
  const foodItems = donation.foodItems || donation.title || 'Food Donation';
  const description = donation.description || 'No description provided';
  const quantity = donation.quantity || 'Not specified';
  const foodType = donation.foodType || 'Mixed';
  const location = donation.location?.address || donation.location || 'Location not specified';
  const expiryTime = donation.expiryTime || donation.expiryDate;
  const createdAt = donation.createdAt || new Date().toISOString();
  
  // Calculate expiry status
  const isExpired = expiryTime ? new Date(expiryTime) < new Date() : false;
  const timeUntilExpiry = donation.timeUntilExpiry || (isExpired ? 'Expired' : 'Not specified');

  // Pickup window handling
  const pickupWindow = donation.pickupWindow || {};
  const pickupStart = pickupWindow.start || donation.pickupTime;
  const pickupEnd = pickupWindow.end;

  // Claim info handling
  const claimedByName = donation.claimedByName || donation.claimedBy?.name || 'Someone';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      {/* ✅ Updated Image Section with same logic as NGO dashboard */}
      {imageUrl && !imageError ? (
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={foodItems}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            crossOrigin="anonymous"
          />
          
          {/* Loading spinner */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* Image loaded indicator */}
          {imageLoaded && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              📸
            </div>
          )}

          {/* Status Badge */}
          <div className={`absolute top-2 left-2 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
            {getStatusIcon(donation.status)}
            <span className="capitalize">{donation.status}</span>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gray-200 flex flex-col items-center justify-center text-gray-500 p-4 relative">
          <Camera className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm text-center">
            {imageError ? 'Photo not available' : 'No photo available'}
          </p>
          {imageUrl && imageError && (
            <p className="text-xs text-center mt-1 text-red-500">
              Failed to load image
            </p>
          )}
          
          {/* Status Badge for no-image state */}
          <div className={`absolute top-2 left-2 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
            {getStatusIcon(donation.status)}
            <span className="capitalize">{donation.status}</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {foodItems}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Package className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{quantity} • {foodType}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          
          {expiryTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Expires: {formatDate(expiryTime)}</span>
            </div>
          )}
        </div>

        {/* Time until expiry */}
        {donation.status === 'available' && expiryTime && (
          <div className="mb-4">
            <div className={`text-sm font-medium ${
              isExpired ? 'text-red-600' : 'text-orange-600'
            }`}>
              {isExpired ? 'Expired' : `Expires in ${timeUntilExpiry}`}
            </div>
          </div>
        )}

        {/* Claimed by info */}
        {donation.status === 'claimed' && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">
              🎉 Claimed by: {claimedByName}
            </p>
            {(pickupStart || pickupEnd) && (
              <p className="text-xs text-orange-600 mt-1">
                {pickupStart && `Pickup: ${formatDate(pickupStart)}`}
                {pickupEnd && ` - ${formatDate(pickupEnd)}`}
              </p>
            )}
          </div>
        )}

        {/* Pickup window for available donations */}
        {donation.status === 'available' && (pickupStart || pickupEnd) && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">
              📍 Pickup Available
            </p>
            <p className="text-xs text-green-600 mt-1">
              {pickupStart && `From: ${formatDate(pickupStart)}`}
              {pickupEnd && ` To: ${formatDate(pickupEnd)}`}
            </p>
          </div>
        )}

        {/* Completed donation info */}
        {donation.status === 'picked' && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800 font-medium">
              ✅ Successfully picked up!
            </p>
            {donation.pickedUpAt && (
              <p className="text-xs text-purple-600 mt-1">
                Picked up: {formatDate(donation.pickedUpAt)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Posted {formatDate(createdAt)}
          </div>
          
          {/* Show delete button only for available or expired donations */}
          {(donation.status === 'available' || isExpired) && (
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete donation"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* ✅ Debug info for development */}
        {process.env.NODE_ENV === 'development' && donation.imageUrl && (
          <div>
            {/* <p><strong>Donor Dashboard - Debug Image Info:</strong></p>
            <p><strong>DB URL:</strong> {donation.imageUrl}</p>
            <p><strong>Processed:</strong> {imageUrl}</p>
            <p><strong>Status:</strong> {imageLoaded ? '✅ Loaded' : imageError ? '❌ Error' : '⏳ Loading'}</p> */}
            {/* <button 
              onClick={() => window.open(imageUrl, '_blank')}
              className="mt-1 text-blue-600 underline text-xs"
            >
              Test URL in new tab
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
};