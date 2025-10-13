import { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { donationsAPI } from '../../lib/api';
import { Navbar } from '../Layout/Navbar';
import { PostFoodForm } from './PostFoodForm';
import { DonationCard } from './DonationCard';
import toast from 'react-hot-toast';

export const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDonations();
  }, [user]);

  const fetchDonations = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      console.log('📊 Fetching donations for user:', user._id);
      const response = await donationsAPI.getAll({ donorId: user._id });
      console.log('✅ Donations fetched:', response.data);
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('❌ Error fetching donations:', error);
      setError('Failed to load donations');
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePostSuccess = (newDonation) => {
    console.log('🎉 New donation posted successfully:', newDonation);
    
    // ✅ OPTIMISTIC UPDATE: Add new donation to the beginning of the list immediately
    if (newDonation) {
      setDonations(prev => [newDonation, ...prev]);
    } else {
      // If no newDonation data provided, refresh the list
      fetchDonations(false);
    }
    
    // ✅ Show success message
    toast.success('🎉 Donation posted successfully! NGOs near you will be notified.', {
      duration: 4000,
      icon: '✅'
    });
    
    // ✅ Close the form
    setShowPostForm(false);
  };

  const handleRefresh = () => {
    fetchDonations(false);
    toast.success('Donations list refreshed!');
  };

  const stats = {
    total: donations.length,
    available: donations.filter(d => d.status === 'available').length,
    claimed: donations.filter(d => d.status === 'claimed').length,
    completed: donations.filter(d => d.status === 'picked').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Donor Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Donor Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDonations}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Donor Dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your food donations and track their status</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">Claimed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.claimed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Post Food Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPostForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Post Surplus Food</span>
          </button>
        </div>

        {/* Donations List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Food Donations</h2>
            <span className="text-sm text-gray-600">
              {donations.length} donation{donations.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {donations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No donations yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start making a difference by posting your first food donation. Help reduce food waste and feed those in need.
              </p>
              <button
                onClick={() => setShowPostForm(true)}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md"
              >
                Post Your First Donation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((donation) => (
                <DonationCard 
                  key={donation._id} 
                  donation={donation}
                  onUpdate={fetchDonations}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Food Modal */}
      {showPostForm && (
        <PostFoodForm
          onClose={() => setShowPostForm(false)}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
};