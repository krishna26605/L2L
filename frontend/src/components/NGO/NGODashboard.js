import { useState, useEffect, useRef } from 'react';
import { Map, List, Navigation, Heart, Package, TrendingUp, Route } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { donationsAPI } from '../../lib/api';
import { Navbar } from '../Layout/Navbar';
import { FoodMap } from './FoodMap';
import { DonationListItem } from './DonationListItem';
import { MultiLocationSelector } from './MultiLocationSelector';
import { RouteTracker } from './RouteTracker';
import toast from 'react-hot-toast';

export const NGODashboard = () => {
  const { user } = useAuth();
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
  const prevDonationsRef = useRef([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyDonations();
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

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await donationsAPI.getAll();
      const donationsData = response.data.donations;

      // Detect new donations
      const prevDonations = prevDonationsRef.current;
      const newDonations = donationsData.filter(d => !prevDonations.some(pd => pd.id === d.id));

      if (newDonations.length > 0) {
        setNotification(`New donation${newDonations.length > 1 ? 's' : ''} added!`);
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      }

      prevDonationsRef.current = donationsData;
      setDonations(donationsData);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
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
      await donationsAPI.claim(donation._id);
      toast.success('Donation claimed successfully!');
      
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
      toast.error('Failed to claim donation');
    }
  };

  const handleViewRoute = (donation) => {
    if (!donation.location) {
      toast.error('Location information not available for this donation');
      return;
    }

    const openDirections = (userLat, userLng) => {
      if (donation.location.lat && donation.location.lng) {
        // Use coordinates for precise navigation
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${donation.location.lat},${donation.location.lng}/@${donation.location.lat},${donation.location.lng},15z/data=!4m2!4m1!3e0`;
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
          const fallbackUrl = donation.location.lat && donation.location.lng 
            ? `https://www.google.com/maps/search/${donation.location.lat},${donation.location.lng}`
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
      const fallbackUrl = donation.location.lat && donation.location.lng 
        ? `https://www.google.com/maps/search/${donation.location.lat},${donation.location.lng}`
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
          </div>

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
                  <p className="text-gray-600">Try adjusting your filters or check back later.</p>
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
    </div>
  );
};
