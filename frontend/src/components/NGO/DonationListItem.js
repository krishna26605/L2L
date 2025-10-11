import { Clock, MapPin, Package, Navigation, CheckCircle, AlertCircle } from 'lucide-react';

export const DonationListItem = ({ donation, onClaim, onViewRoute }) => {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = new Date(donation.expiryTime) < new Date();
  const timeUntilExpiry = donation.timeUntilExpiry || 'Expired';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-200">
        {donation.imageUrl ? (
          <img
            src={donation.imageUrl}
            alt={donation.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center text-gray-500"
          style={{ display: donation.imageUrl ? 'none' : 'flex' }}
        >
          <Package className="h-12 w-12" />
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {donation.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {donation.description}
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
            {getStatusIcon(donation.status)}
            <span className="capitalize">{donation.status}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Package className="h-4 w-4 mr-2" />
            <span>{donation.quantity} • {donation.foodType}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{donation.location.address}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>Expires: {formatDate(donation.expiryTime)}</span>
          </div>
        </div>

        {/* Time until expiry */}
        {donation.status === 'available' && (
          <div className="mb-4">
            <div className={`text-sm font-medium ${
              isExpired ? 'text-red-600' : 'text-orange-600'
            }`}>
              {isExpired ? 'Expired' : `Expires in ${timeUntilExpiry}`}
            </div>
          </div>
        )}

        {/* Claimed by info */}
        {donation.status === 'claimed' && donation.claimedByName && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Claimed by:</strong> {donation.claimedByName}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Pickup window: {formatDate(donation.pickupWindow.start)} - {formatDate(donation.pickupWindow.end)}
            </p>
            <div className="mt-3">
              <button
                onClick={() => onViewRoute(donation)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Get Directions to Pickup</span>
              </button>
            </div>
          </div>
        )}

        {/* Pickup window */}
        {donation.status === 'available' && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Pickup available:</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              {formatDate(donation.pickupWindow.start)} - {formatDate(donation.pickupWindow.end)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Posted {formatDate(donation.createdAt)}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onViewRoute(donation)}
              className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md transition-colors ${
                donation.status === 'claimed' 
                  ? 'text-white bg-blue-600 hover:bg-blue-700' 
                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span>{donation.status === 'claimed' ? 'Get Directions' : 'Directions'}</span>
            </button>
            
            {donation.status === 'available' && (
              <button
                onClick={() => onClaim(donation)}
                className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Claim Donation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
