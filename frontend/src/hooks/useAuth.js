import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, AuthStorage } from '../lib/api'; // ✅ Dono import karo

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // ✅ Check karo ki AuthStorage available hai
      if (typeof AuthStorage === 'undefined') {
        console.error('❌ AuthStorage is not defined');
        setLoading(false);
        return;
      }

      // ✅ localStorage se auth data lo
      const { user: storedUser, token } = AuthStorage.getAuthData();
      
      console.log('🔄 AuthProvider mounting - localStorage data:', { 
        storedUser: !!storedUser, 
        token: !!token,
        role: storedUser?.role,
        hasLocation: !!(storedUser?.location)
      });
      
      if (storedUser && token) {
        try {
          setUser(storedUser);
          console.log('✅ Restored user from localStorage:', { 
            email: storedUser.email, 
            role: storedUser.role,
            hasLocation: !!(storedUser.location)
          });
          
          // ✅ Server se verify karo (optional)
          try {
            const response = await authAPI.getProfile();
            if (response.data && response.data.user) {
              const serverUser = response.data.user;
              setUser(serverUser);
              // ✅ Update localStorage with fresh data
              AuthStorage.setAuthData(token, serverUser);
              console.log('✅ Updated user from server profile:', {
                role: serverUser.role,
                hasLocation: !!(serverUser.location)
              });
            }
          } catch (error) {
            console.error('❌ Profile verification failed:', error?.response?.data || error.message);
            // Server error hai, but stored user use karo
          }
        } catch (error) {
          console.error('❌ Error initializing auth:', error);
          AuthStorage.clearAuthData();
          setUser(null);
        }
      } else {
        console.log('🔍 No stored auth data found');
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (email, password) => {
  try {
    console.log('🔐 useAuth: Attempting login for:', email);
    
    const response = await authAPI.login(email, password);
    console.log('✅ useAuth: Login successful - full response:', response.data);
    
    if (response.data) {
      const { user, token } = response.data;
      
      // ✅ Wait a moment to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ Verify data was stored in localStorage
      const storedData = AuthStorage.getAuthData();
      console.log('💾 Verified localStorage after login:', {
        token: !!storedData.token,
        user: !!storedData.user,
        userRole: storedData.user?.role
      });
      
      // ✅ Update React state
      setUser(user);
      console.log('👤 User set in context:', { 
        email: user.email,
        role: user.role,
        hasLocation: !!(user.location)
      });
      
      return response.data;
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('❌ useAuth: SignIn error:', error.response?.data || error.message);
    throw error;
  }
};

  // ✅ UPDATED: signUp function to handle new NGO location data structure
  const signUp = async (signupData) => {
    try {
      console.log('🔐 useAuth: Attempting registration for:', signupData.email, 'as', signupData.role);
      console.log('📍 Location data:', signupData.role === 'ngo' ? signupData.location : 'Not required for donor');
      
      const response = await authAPI.register(signupData);
      console.log('✅ useAuth: Registration successful - full response:', response.data);
      
      if (response.data) {
        setUser(response.data.user);
        console.log('👤 User set in context:', { 
          email: response.data.user.email,
          role: response.data.user.role,
          hasLocation: !!(response.data.user.location)
        });
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ useAuth: SignUp error:', error.response?.data || error.message);
      throw error;
    }
  };

  // ✅ UPDATED: Enhanced updateUserProfile to handle location validation
  const updateUserProfile = async (data) => {
    try {
      console.log('🔄 useAuth: Updating profile with data:', data);
      
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data?.user || response.data;
      
      setUser(prev => ({ ...prev, ...updatedUser }));
      
      // ✅ localStorage update karo
      const { token } = AuthStorage.getAuthData();
      if (token) {
        AuthStorage.setAuthData(token, updatedUser);
      }
      
      console.log('✅ Profile updated successfully:', {
        role: updatedUser.role,
        hasLocation: !!(updatedUser.location)
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ useAuth: Update profile error:', error.response?.data || error.message);
      throw error;
    }
  };

  // ✅ NEW: Function to specifically update NGO location
  const updateNGOLocation = async (locationData) => {
    try {
      console.log('📍 useAuth: Updating NGO location:', locationData);
      
      const response = await authAPI.updateProfile({ location: locationData });
      const updatedUser = response.data?.user || response.data;
      
      setUser(prev => ({ ...prev, ...updatedUser }));
      
      // ✅ localStorage update karo
      const { token } = AuthStorage.getAuthData();
      if (token) {
        AuthStorage.setAuthData(token, updatedUser);
      }
      
      console.log('✅ NGO location updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ useAuth: Update NGO location error:', error.response?.data || error.message);
      throw error;
    }
  };

  // ✅ NEW: Function to get NGOs near a location (for donors)
  const getNGOsNearLocation = async (lat, lng, radius = 20) => {
    try {
      console.log('🗺️ useAuth: Finding NGOs near location:', { lat, lng, radius });
      
      const response = await authAPI.getNGOsNearLocation(lat, lng, radius);
      console.log('✅ Found NGOs:', response.data.ngos?.length || 0);
      
      return response.data;
    } catch (error) {
      console.error('❌ useAuth: Get NGOs near location error:', error.response?.data || error.message);
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ localStorage clear karo
      AuthStorage.clearAuthData();
      setUser(null);
      console.log('✅ Logout successful - localStorage cleared');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // ✅ NEW: Helper function to check if user is NGO with location
  const isNGOWithLocation = () => {
    return user && user.role === 'ngo' && user.location && user.location.coordinates;
  };

  // ✅ NEW: Helper function to get user's operational radius
  const getOperationalRadius = () => {
    if (user && user.role === 'ngo' && user.ngoDetails) {
      return user.ngoDetails.operationalRadius || 20;
    }
    return 20; // Default radius
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    updateUserProfile,
    updateNGOLocation, // ✅ NEW
    getNGOsNearLocation, // ✅ NEW
    changePassword,
    logout,
    isNGOWithLocation, // ✅ NEW
    getOperationalRadius, // ✅ NEW
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};