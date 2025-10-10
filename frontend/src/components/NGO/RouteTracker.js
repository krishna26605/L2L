import { useState, useEffect } from 'react';
import { X, Navigation, CheckCircle, Clock, MapPin, Package } from 'lucide-react';
import { donationsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export const RouteTracker = ({ donations, onComplete, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedDonations, setCompletedDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentDonation = donations[currentIndex];
  const isLastDonation = currentIndex === donations.length - 1;
  const allCompleted = completedDonations.length === donations.length;

  const handleMarkAsPicked = async () => {
    if (!currentDonation) return;

    setLoading(true);
    try {
      await donationsAPI.markAsPicked(currentDonation.id);
      setCompletedDonations(prev => [...prev, currentDonation.id]);
      toast.success('Donation marked as picked up!');
      
      if (!isLastDonation) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error marking as picked:', error);
      toast.error('Failed to mark donation as picked');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!isLastDonation) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleGetDirections = () => {
    if (!currentDonation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${currentDonation.location.lat},${currentDonation.location.lng}/@${currentDonation.location.lat},${currentDonation.location.lng},15z/data=!4m2!4m1!3e0`;
        window.open(url, '_blank');
      }, (error) => {
        console.error('Error getting current location:', error);
        const url = `https://www.google.com/maps/search/${currentDonation.location.address}`;
        window.open(url, '_blank');
      });
    } else {
      const url = `https://www.google.com/maps/search/${currentDonation.location.address}`;
      window.open(url, '_blank');
    }
  };

  const handleCompleteRoute = () => {
    onComplete();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentDonation && !allCompleted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {allCompleted ? 'Route Completed!' : `Pickup Route (${currentIndex + 1}/${donations.length})`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {allCompleted ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
            <p className="text-gray-600 mb-6">
              You've successfully completed your pickup route. Thank you for helping reduce food waste!
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Total donations picked up: {completedDonations.length}
              </p>
            </div>
            <button
              onClick={handleCompleteRoute}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Finish Route
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{currentIndex + 1} of {donations.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / donations.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Donation */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentDonation.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {currentDonation.description}
                  </p>
                </div>
                
                {currentDonation.imageUrl && (
                  <img
                    src={currentDonation.imageUrl}
                    alt={currentDonation.title}
                    className="w-20 h-20 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{currentDonation.quantity} • {currentDonation.foodType}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Expires: {formatDate(currentDonation.expiryTime)}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="font-medium">Pickup Location:</span>
                </div>
                <p className="text-gray-800 ml-6">{currentDonation.location.address}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Pickup Window:</strong> {formatDate(currentDonation.pickupWindow.start)} - {formatDate(currentDonation.pickupWindow.end)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGetDirections}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Navigation className="h-5 w-5" />
                <span>Get Directions</span>
              </button>
              
              <button
                onClick={handleMarkAsPicked}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{loading ? 'Marking...' : 'Mark as Picked Up'}</span>
              </button>
              
              {!isLastDonation && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Skip for Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
