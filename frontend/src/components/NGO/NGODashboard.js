import { useState, useEffect, useRef } from 'react';
import { Map, List, Navigation, Heart, Package, TrendingUp, Route, MapPin, Settings, RefreshCw } from 'lucide-react';
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
  const [allDonations, setAllDonations] = useState([]); // All donations from API
  const [filteredDonations, setFilteredDonations] = useState([]); // Donations after filtering
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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const prevDonationsRef = useRef([]);

  // Distance calculation function (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Real-time refresh setup
  useEffect(() => {
    if (user && autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing donations...');
        fetchAllDonations(false); // Silent refresh
      }, 30000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [user, autoRefresh]);

  useEffect(() => {
    if (user) {
      setCurrentRadius(user?.ngoDetails?.operationalRadius || 20);
      fetchAllDonations();
      fetchMyDonations();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'ngo') {
      if (!user.location || !user.location.coordinates) {
        setShowLocationSetup(true);
        setUsingLocationFiltering(false);
      } else {
        setUsingLocationFiltering(true);
      }
    }
  }, [user]);

  // ✅ UPDATED: Apply all filtering logic whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [allDonations, myDonations, filter, user, currentRadius]);

  // ✅ NEW: Main filtering function that handles everything
  const applyFilters = () => {
    console.log('🎯 Applying filters...');
    
    let filtered = [...allDonations];

    // Step 1: Filter by status and expiry
    filtered = filtered.filter(donation => {
      const isAvailable = donation.status === 'available';
      const isNotExpired = new Date(donation.expiryTime) > new Date();
      return isAvailable && isNotExpired;
    });

    console.log('📊 After status/expiry filter:', filtered.length);

    // Step 2: Apply location-based filtering if NGO has location
    if (user?.role === 'ngo' && user?.location?.coordinates && usingLocationFiltering) {
      const ngoLat = user.location.coordinates.lat;
      const ngoLng = user.location.coordinates.lng;
      
      console.log(`📍 NGO location: ${ngoLat}, ${ngoLng} (${currentRadius}km radius)`);
      
      filtered = filtered.filter(donation => {
        if (!donation.location?.coordinates) {
          console.log('❌ Donation missing coordinates:', donation.title);
          return false;
        }
        
        const distance = calculateDistance(
          ngoLat,
          ngoLng,
          donation.location.coordinates.lat,
          donation.location.coordinates.lng
        );
        
        const isWithinRadius = distance <= currentRadius;
        
        if (isWithinRadius) {
          console.log(`✅ "${donation.title}" - ${distance.toFixed(2)}km away`);
        } else {
          console.log(`❌ "${donation.title}" - ${distance.toFixed(2)}km away (outside radius)`);
        }
        
        return isWithinRadius;
      });
      
      console.log('📍 After location filter:', filtered.length);
    }

    // Step 3: Apply view filter
    switch (filter) {
      case 'available':
        // Already filtered above
        break;
      case 'claimed':
        filtered = myDonations.filter(d => d.status === 'claimed');
        break;
      case 'mine':
        filtered = myDonations;
        break;
      default:
        // 'all' - use the already filtered available donations
        break;
    }

    console.log('🎯 Final filtered donations:', filtered.length);
    setFilteredDonations(filtered);

    // Detect new donations for notifications
    const prevDonations = prevDonationsRef.current;
    const newDonations = filtered.filter(d => 
      !prevDonations.some(pd => pd._id === d._id)
    );

    if (newDonations.length > 0) {
      const notificationMessage = `🎉 ${newDonations.length} new donation${newDonations.length > 1 ? 's' : ''} available nearby!`;
      setNotification(notificationMessage);
      toast.success(notificationMessage, { duration: 5000 });
      setTimeout(() => setNotification(null), 5000);
    }

    prevDonationsRef.current = filtered;
  };

  // ✅ UPDATED: Fetch ALL donations (not just available)
  const fetchAllDonations = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log('🏢 NGO Dashboard - Fetching ALL donations...');
      
      // Fetch all donations without filters
      const response = await donationsAPI.getAll();
      
      console.log('🔍 Full API Response:', response);
      
      // 🛠️ FIX: Handle different response formats
      let donationsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        // Case 1: Response data is directly an array
        donationsData = response.data;
        console.log('📦 Response is direct array:', donationsData.length);
      } else if (response.data && response.data.donations && Array.isArray(response.data.donations)) {
        // Case 2: Response has donations property
        donationsData = response.data.donations;
        console.log('📦 Response has donations property:', donationsData.length);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Case 3: Response has data property
        donationsData = response.data.data;
        console.log('📦 Response has data property:', donationsData.length);
      } else {
        // Case 4: Try to find any array in response
        console.warn('⚠️ Unknown response format, searching for array...');
        for (let key in response.data) {
          if (Array.isArray(response.data[key])) {
            donationsData = response.data[key];
            console.log(`🔄 Found array in key "${key}":`, donationsData.length);
            break;
          }
        }
      }
      
      console.log('📊 All donations from backend:', donationsData.length);
      
      // Debug first few donations
      if (donationsData.length > 0) {
        console.log('🔍 Sample donations:');
        donationsData.slice(0, 3).forEach((donation, index) => {
          console.log(`  ${index + 1}. "${donation.title}" - Status: ${donation.status}`, {
            coordinates: donation.location?.coordinates,
            expiryTime: donation.expiryTime,
            isExpired: new Date(donation.expiryTime) < new Date()
          });
        });
      }
      
      setAllDonations(donationsData);

    } catch (error) {
      console.error('❌ Error fetching donations:', error);
      toast.error('Failed to load donations');
      setAllDonations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch NGO's claimed donations
  const fetchMyDonations = async () => {
    try {
      const response = await donationsAPI.getAll({ 
        claimedBy: user?._id 
      });
      
      let myDonationsData = [];
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        myDonationsData = response.data;
      } else if (response.data && response.data.donations && Array.isArray(response.data.donations)) {
        myDonationsData = response.data.donations;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        myDonationsData = response.data.data;
      }
      
      setMyDonations(myDonationsData || []);
      console.log('📦 My claimed donations:', myDonationsData.length);
      
    } catch (error) {
      console.error('Error fetching my donations:', error);
      setMyDonations([]);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAllDonations(false);
    await fetchMyDonations();
    setRefreshing(false);
    toast.success('Donations list updated!');
  };

  // Debug function
  const debugCurrentState = () => {
    console.log('🔍 DEBUG CURRENT STATE:', {
      user: {
        role: user?.role,
        location: user?.location,
        coordinates: user?.location?.coordinates,
        operationalRadius: user?.ngoDetails?.operationalRadius
      },
      donations: {
        all: allDonations,
        allCount: allDonations.length,
        filtered: filteredDonations,
        filteredCount: filteredDonations.length
      },
      myDonations: {
        all: myDonations,
        count: myDonations.length
      },
      usingLocationFiltering,
      currentRadius,
      filter
    });

    // Calculate distances for first few donations
    if (user?.location?.coordinates && allDonations.length > 0) {
      const ngoLat = user.location.coordinates.lat;
      const ngoLng = user.location.coordinates.lng;
      
      console.log('📍 DISTANCE CALCULATIONS:');
      allDonations.slice(0, 5).forEach((donation, index) => {
        if (donation.location?.coordinates) {
          const distance = calculateDistance(
            ngoLat,
            ngoLng,
            donation.location.coordinates.lat,
            donation.location.coordinates.lng
          );
          console.log(`  ${index + 1}. "${donation.title}" - ${distance.toFixed(2)}km - Status: ${donation.status}`);
        }
      });
    }
  };

  const handleClaimDonation = async (donation) => {
    if (!user || donation.status !== 'available') return;

    try {
      const response = await donationsAPI.claim(donation._id);
      toast.success('Donation claimed successfully!');
      
      if (response.data?.distance) {
        toast.success(`Donation is ${response.data.distance}km away`);
      }
      
      setTimeout(() => {
        if (confirm('Would you like to get directions to the pickup location?')) {
          handleViewRoute(donation);
        }
      }, 1000);
      
      // Refresh data after claiming
      fetchAllDonations(false);
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
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${donation.location.coordinates.lat},${donation.location.coordinates.lng}`;
        window.open(url, '_blank');
      } else {
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
          toast.error('Unable to get your current location. Opening donation location...');
          
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
      const fallbackUrl = donation.location.coordinates?.lat && donation.location.coordinates?.lng 
        ? `https://www.google.com/maps/search/${donation.location.coordinates.lat},${donation.location.coordinates.lng}`
        : `https://www.google.com/maps/search/${encodeURIComponent(donation.location.address)}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleStartMultiPickup = () => {
    const availableDonations = filteredDonations.filter(d => 
      d.status === 'available' && new Date(d.expiryTime) > new Date()
    );
    if (availableDonations.length > 0) {
      setShowMultiSelector(true);
    } else {
      toast.error('No available donations for multi-pickup');
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
    fetchAllDonations(false);
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
            await updateUserProfile({ location });
            setShowLocationSetup(false);
            setUsingLocationFiltering(true);
            toast.success('Location set successfully! Refreshing nearby donations...');
            fetchAllDonations();
          } catch (error) {
            console.error('❌ Error saving location:', error);
            toast.error('Failed to save location');
          }
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          toast.error('Unable to get your location. Please allow location access.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleRadiusUpdate = (newRadius) => {
    setCurrentRadius(newRadius);
    // No need to refetch - filtering happens automatically via useEffect
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.info(!autoRefresh ? 'Auto-refresh enabled (30s)' : 'Auto-refresh disabled');
  };

  // Stats calculation
  const stats = {
    available: filteredDonations.length,
    claimed: (myDonations || []).filter(d => d.status === 'claimed').length,
    completed: (myDonations || []).filter(d => d.status === 'picked').length,
    total: (myDonations || []).length,
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
        <div className="fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            {notification}
            <button
              onClick={() => setNotification(null)}
              className="ml-4 font-bold hover:text-gray-200"
            >
              ×
            </button>
          </div>
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
            {/* Debug Button */}
            <button
              onClick={debugCurrentState}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <span>Debug State</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-sm">Auto</span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

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
          donations={filteredDonations.filter(d => d.status === 'available' && new Date(d.expiryTime) > new Date())}
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