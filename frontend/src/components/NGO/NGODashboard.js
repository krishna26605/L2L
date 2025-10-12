import { useState, useEffect, useRef } from 'react';
import { Map, List, Navigation, Heart, Package, TrendingUp, Route, MapPin, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { donationsAPI } from '../../lib/api';
import { Navbar } from '../Layout/Navbar';
import { FoodMap } from './FoodMap';
import { DonationListItem } from './DonationListItem';
import { MultiLocationSelector } from './MultiLocationSelector';
import { RouteTracker } from './RouteTracker';
import toast from 'react-hot-toast';

// Radius Update Modal Component
const RadiusUpdateModal = ({ isOpen, onClose, currentRadius, onUpdate }) => {
  const [radius, setRadius] = useState(currentRadius);
  const [loading, setLoading] = useState(false);
  const { updateUserProfile } = useAuth();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        ngoDetails: { operationalRadius: radius }
      });
      onUpdate(radius);
      onClose();
      toast.success(`Operational radius updated to ${radius}km!`);
    } catch (error) {
      console.error('Error updating radius:', error);
      toast.error('Failed to update radius');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Update Operational Radius
        </h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Current radius: <span className="font-bold text-green-600">{radius} km</span>
          </label>
          
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer mb-2"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>5km</span>
            <span>15km</span>
            <span>25km</span>
            <span>35km</span>
            <span>50km</span>
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            Increase your operational radius to see more donation options in your area.
            Larger radius = more donation options.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Update Radius'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const NGODashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [myDonations, setMyDonations] = useState([]);
  const [showMultiSelector, setShowMultiSelector] = useState(false);
  const [showRouteTracker, setShowRouteTracker] = useState(false);
  const [selectedRouteData, setSelectedRouteData] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [showRadiusUpdate, setShowRadiusUpdate] = useState(false);
  const [usingLocationFiltering, setUsingLocationFiltering] = useState(false);
  const [currentRadius, setCurrentRadius] = useState(20);
  const prevDonationsRef = useRef([]);

  useEffect(() => {
    if (user) {
      setCurrentRadius(user?.ngoDetails?.operationalRadius || 20);
      fetchDonations();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMyDonations();
    
    // Check if NGO has location set
    if (user.role === 'ngo' && (!user.location || !user.location.coordinates)) {
      setShowLocationSetup(true);
      setUsingLocationFiltering(false);
    } else if (user.role === 'ngo' && user.location && user.location.coordinates) {
      setUsingLocationFiltering(true);
    }
  }, [user]);

  useEffect(() => {
    let filtered = donations;

    switch (filter) {
      case 'available':
        filtered = donations.filter(d => d.status === 'available' && new Date(d.expiryTime) > new Date());
        break;
      case 'claimed':
        filtered = donations.filter(d => d.status === 'claimed');
        break;
      case 'mine':
        filtered = myDonations;
        break;
      default:
        // Show all donations that are not expired
        filtered = donations.filter(d => new Date(d.expiryTime) > new Date());
    }

    setFilteredDonations(filtered);
  }, [donations, myDonations, filter]);

  // Fetch donations with location-based filtering
  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      console.log('🏢 NGO Dashboard - Fetching donations...');
      console.log('👤 Current User:', {
        role: user?.role,
        hasLocation: !!(user?.location),
        coordinates: user?.location?.coordinates,
        operationalRadius: user?.ngoDetails?.operationalRadius || 20
      });
      
      let response;
      let isLocationFiltered = false;
      
      if (user && user.role === 'ngo' && user.location && user.location.coordinates) {
        try {
          console.log('📍 Attempting to use NGO-specific endpoint...');
          response = await donationsAPI.getForMyNGO({ limit: 50 });
          isLocationFiltered = true;
          console.log('✅ NGO endpoint response:', {
            donationsCount: response.data.donations?.length,
            metadata: response.data.metadata
          });
        } catch (endpointError) {
          console.warn('⚠️ NGO endpoint failed, falling back to general endpoint:', endpointError);
          response = await donationsAPI.getAll();
          isLocationFiltered = false;
        }
      } else {
        // Fallback to general endpoint
        console.log('⚠️ NGO without location, using general endpoint');
        response = await donationsAPI.getAll();
        isLocationFiltered = false;
      }
      
      const donationsData = response.data.donations || [];
      setUsingLocationFiltering(isLocationFiltered);
      setDonations(donationsData);
      
      console.log('📊 Final donations data:', donationsData.length);

      // Detect new donations
      const prevDonations = prevDonationsRef.current;
      const newDonations = donationsData.filter(d => !prevDonations.some(pd => pd._id === d._id));

      if (newDonations.length > 0) {
        setNotification(`New donation${newDonations.length > 1 ? 's' : ''} added!`);
        setTimeout(() => setNotification(null), 5000);
      }

      prevDonationsRef.current = donationsData;
    } catch (error) {
      console.error('❌ Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check all donations
  const checkAllDonations = async () => {
    try {
      console.log('🔍 Checking all available donations in system...');
      const response = await donationsAPI.getAll();
      const allDonations = response.data.donations || [];
      
      console.log('📋 All donations in system:', allDonations.length);
      allDonations.forEach(donation => {
        console.log(`📍 Donation: ${donation.title}`, {
          status: donation.status,
          location: donation.location,
          expiryTime: donation.expiryTime,
          isExpired: new Date(donation.expiryTime) < new Date()
        });
      });
      
      // Check if any are available and not expired
      const availableDonations = allDonations.filter(d => 
        d.status === 'available' && new Date(d.expiryTime) > new Date()
      );
      console.log('✅ Available & not expired donations:', availableDonations.length);
      
    } catch (error) {
      console.error('Error checking all donations:', error);
    }
  };

  const fetchMyDonations = async () => {
    try {
      const response = await donationsAPI.getAll({ claimedBy: user._id });
      setMyDonations(response.data.donations);
    } catch (error) {
      console.error('Error fetching my donations:', error);
    }
  };

  const handleClaimDonation = async (donation) => {
    if (!user || donation.status !== 'available') return;

    try {
      const response = await donationsAPI.claim(donation._id);
      toast.success('Donation claimed successfully!');
      
      // Show distance info if available
      if (response.data.distance) {
        toast.success(`Donation is ${response.data.distance}km away`);
      }
      
      // Show directions option after claiming
      setTimeout(() => {
        if (confirm('Would you like to get directions to the pickup location?')) {
          handleViewRoute(donation);
        }
      }, 1000);
      
      fetchDonations();
      fetchMyDonations();
    } catch (error) {
      console.error('Error claiming donation:', error);
      const errorMessage = error.response?.data?.error || 'Failed to claim donation';
      toast.error(errorMessage);
    }
  };

  const handleViewRoute = (donation) => {
    if (!donation.location) {
      toast.error('Location information not available for this donation');
      return;
    }

    const openDirections = (userLat, userLng) => {
      if (donation.location.coordinates?.lat && donation.location.coordinates?.lng) {
        // Use coordinates for precise navigation
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${donation.location.coordinates.lat},${donation.location.coordinates.lng}`;
        window.open(url, '_blank');
      } else {
        // Fallback to address-based navigation
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodeURIComponent(donation.location.address)}`;
        window.open(url, '_blank');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          openDirections(latitude, longitude);
        }, 
        (error) => {
          console.error('Error getting current location:', error);
          let errorMessage = 'Unable to get your current location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access or use the address below.';
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
          
          // Fallback: open destination directly
          const fallbackUrl = donation.location.coordinates?.lat && donation.location.coordinates?.lng 
            ? `https://www.google.com/maps/search/${donation.location.coordinates.lat},${donation.location.coordinates.lng}`
            : `https://www.google.com/maps/search/${encodeURIComponent(donation.location.address)}`;
          window.open(fallbackUrl, '_blank');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback for browsers without geolocation
      const fallbackUrl = donation.location.coordinates?.lat && donation.location.coordinates?.lng 
        ? `https://www.google.com/maps/search/${donation.location.coordinates.lat},${donation.location.coordinates.lng}`
        : `https://www.google.com/maps/search/${encodeURIComponent(donation.location.address)}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleStartMultiPickup = () => {
    const availableDonations = donations.filter(d => 
      d.status === 'available' && new Date(d.expiryTime) > new Date()
    );
    if (availableDonations.length > 0) {
      setShowMultiSelector(true);
    }
  };

  const handleStartRoute = (selectedDonations) => {
    setSelectedRouteData(selectedDonations);
    setShowMultiSelector(false);
    setShowRouteTracker(true);
  };

  const handleRouteComplete = () => {
    setShowRouteTracker(false);
    setSelectedRouteData([]);
    fetchDonations();
    fetchMyDonations();
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = {
            address: 'Current Location',
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          };
          
          console.log('📍 Setting NGO location:', location);
          
          try {
            // Update user profile with location
            await updateUserProfile({ location });
            setShowLocationSetup(false);
            setUsingLocationFiltering(true);
            toast.success('Location set successfully! Refreshing nearby donations...');
            
            // Refresh donations with new location
            fetchDonations();
          } catch (error) {
            console.error('❌ Error saving location:', error);
            toast.error('Failed to save location');
          }
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          toast.error('Unable to get your location. Please allow location access.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleRadiusUpdate = (newRadius) => {
    setCurrentRadius(newRadius);
    fetchDonations(); // Refresh with new radius
  };

  const stats = {
    available: donations.filter(d => d.status === 'available' && new Date(d.expiryTime) > new Date()).length,
    claimed: myDonations.filter(d => d.status === 'claimed').length,
    completed: myDonations.filter(d => d.status === 'picked').length,
    total: myDonations.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="NGO Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="NGO Dashboard" />

      {notification && (
        <div className="fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {notification}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 font-bold"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Claims</p>
                <p className="text-2xl font-bold text-gray-900">{stats.claimed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Impact</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List View</span>
            </button>
            <button
              onClick={handleStartMultiPickup}
              disabled={stats.available === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Route className="h-4 w-4" />
              <span>Multi Pickup</span>
              {stats.available > 0 && (
                <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">{stats.available}</span>
              )}
            </button>
            {user && user.role === 'ngo' && (
              <button
                onClick={() => setShowLocationSetup(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  user.location && user.location.coordinates
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>
                  {user.location && user.location.coordinates ? 'Update Location' : 'Set Location'}
                </span>
              </button>
            )}
            {user && user.role === 'ngo' && user.location && user.location.coordinates && (
              <button
                onClick={() => setShowRadiusUpdate(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Radius ({currentRadius}km)</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {usingLocationFiltering && (
              <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                <span className="font-medium">📍 Location-based filtering active</span>
                <br />
                <span className="text-xs">Showing donations within {currentRadius}km radius</span>
              </div>
            )}
            {user?.role === 'ngo' && !usingLocationFiltering && (
              <div className="text-sm text-gray-600 bg-yellow-50 px-3 py-2 rounded-lg">
                <span className="font-medium">📍 Set your location</span>
                <br />
                <span className="text-xs">To see nearby donations, set your NGO location</span>
              </div>
            )}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="all">All Available</option>
              <option value="available">Available Now</option>
              <option value="claimed">Claimed</option>
              <option value="mine">My Donations</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {viewMode === 'map' ? (
            <div className="p-6">
              <FoodMap
                donations={filteredDonations}
                onMarkerClick={setSelectedDonation}
                selectedDonation={selectedDonation}
              />
              {selectedDonation && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md max-w-xs">
                  <h3 className="font-semibold text-base mb-1 truncate">{selectedDonation.title}</h3>
                  <p className="text-gray-600 mb-1 text-sm truncate">{selectedDonation.description}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewRoute(selectedDonation)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Get Directions</span>
                    </button>
                    {selectedDonation.status === 'available' && (
                      <button
                        onClick={() => handleClaimDonation(selectedDonation)}
                        className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Claim Donation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              {filteredDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                  <p className="text-gray-600 mb-4">
                    {usingLocationFiltering 
                      ? `No donations found within your ${currentRadius}km operational radius.`
                      : 'Try adjusting your filters or check back later.'
                    }
                  </p>
                  <div className="space-y-2">
                    {usingLocationFiltering && (
                      <button
                        onClick={() => setShowRadiusUpdate(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Increase Operational Radius
                      </button>
                    )}
                    {!usingLocationFiltering && user?.role === 'ngo' && (
                      <button
                        onClick={() => setShowLocationSetup(true)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Set Location to See Nearby Donations
                      </button>
                    )}
                    <button
                      onClick={checkAllDonations}
                      className="ml-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Debug: Check All Donations
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDonations.map((donation) => (
                    <DonationListItem
                      key={donation._id}
                      donation={donation}
                      onClaim={handleClaimDonation}
                      onViewRoute={handleViewRoute}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi Location Selector Modal */}
      {showMultiSelector && (
        <MultiLocationSelector
          donations={donations.filter(d => d.status === 'available' && new Date(d.expiryTime) > new Date())}
          onStartRoute={handleStartRoute}
          onClose={() => setShowMultiSelector(false)}
        />
      )}

      {/* Route Tracker */}
      {showRouteTracker && (
        <RouteTracker
          donations={selectedRouteData}
          onComplete={handleRouteComplete}
          onClose={() => setShowRouteTracker(false)}
        />
      )}

      {/* Location Setup Modal */}
      {showLocationSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {user?.location?.coordinates ? 'Update Your NGO Location' : 'Set Your NGO Location'}
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.location?.coordinates 
                ? 'Update your location to see the most relevant food donations in your area.'
                : 'To see nearby food donations, we need to know your NGO\'s location. This will help us show you donations within your operational radius.'
              }
            </p>
            <div className="flex space-x-3">
              <button
                onClick={getCurrentLocation}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Use Current Location
              </button>
              <button
                onClick={() => setShowLocationSetup(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {user?.location?.coordinates ? 'Cancel' : 'Skip for Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radius Update Modal */}
      {showRadiusUpdate && (
        <RadiusUpdateModal
          isOpen={showRadiusUpdate}
          onClose={() => setShowRadiusUpdate(false)}
          currentRadius={currentRadius}
          onUpdate={handleRadiusUpdate}
        />
      )}
    </div>
  );
};