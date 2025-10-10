import { useState } from 'react';
import { X, MapPin, Check, Package } from 'lucide-react';

export const MultiLocationSelector = ({ donations, onStartRoute, onClose }) => {
  const [selectedDonations, setSelectedDonations] = useState([]);

  const handleToggleDonation = (donation) => {
    setSelectedDonations(prev => {
      const isSelected = prev.some(d => d.id === donation.id);
      if (isSelected) {
        return prev.filter(d => d.id !== donation.id);
      } else {
        return [...prev, donation];
      }
    });
  };

  const handleStartRoute = () => {
    if (selectedDonations.length === 0) {
      alert('Please select at least one donation');
      return;
    }
    onStartRoute(selectedDonations);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select Donations for Multi-Pickup</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600">
              Select multiple donations to create an optimized pickup route. 
              {selectedDonations.length > 0 && (
                <span className="ml-2 font-medium text-green-600">
                  {selectedDonations.length} donation{selectedDonations.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {donations.map((donation) => {
              const isSelected = selectedDonations.some(d => d.id === donation.id);
              
              return (
                <div
                  key={donation.id}
                  onClick={() => handleToggleDonation(donation)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {isSelected && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">{donation.title}</h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {donation.description}
                      </p>
                      
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          <span>{donation.quantity} • {donation.foodType}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{donation.location.address}</span>
                        </div>
                        
                        <div>
                          <span>Expires: {formatDate(donation.expiryTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {donations.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No available donations</h3>
              <p className="text-gray-600">There are no available donations for multi-pickup at the moment.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartRoute}
            disabled={selectedDonations.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Route ({selectedDonations.length})
          </button>
        </div>
      </div>
    </div>
  );
};
