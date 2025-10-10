import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../lib/api';
import Cookies from 'js-cookie';

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
    // Check for stored user data on mount
    const storedUser = Cookies.get('user');
    const storedToken = Cookies.get('auth_token');
    
    console.log('🔄 AuthProvider mounting - stored data:', { storedUser: !!storedUser, storedToken: !!storedToken });
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('✅ Restored user from cookies:', userData.email);
        
        // Verify token with server but don't block on error
        authAPI.getProfile()
          .then(response => {
            console.log('✅ Profile verification response:', response);
            // Handle different response structures
            if (response.data && response.data.user) {
              console.log('✅ Updated user from server profile');
              setUser(response.data.user);
              Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
            } else if (response.data) {
              console.log('✅ Using profile data directly');
              setUser(response.data);
              Cookies.set('user', JSON.stringify(response.data), { expires: 7 });
            }
          })
          .catch(error => {
            console.error('❌ Profile verification failed:', error?.response?.data || error.message);
            // Don't clear auth data - keep using stored user
          });
      } catch (error) {
        console.error('❌ Error parsing stored user:', error);
        Cookies.remove('user');
      }
    } else {
      console.log('🔍 No stored auth data found');
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log('🔐 useAuth: Attempting login for:', email);
      const result = await authAPI.login(email, password);
      console.log('✅ useAuth: Login successful');
      
      // Note: authAPI.login already stores tokens in cookies
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('❌ useAuth: SignIn error:', error.response?.data || error.message);
      throw error;
    }
  };

  const signUp = async (email, password, displayName, role) => {
    try {
      const result = await authAPI.register({ email, password, displayName, role });
      // Note: authAPI.register already stores tokens in cookies
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('❌ useAuth: SignUp error:', error.response?.data || error.message);
      throw error;
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const result = await authAPI.updateProfile(data);
      const updatedUser = result.user || result;
      setUser(prev => ({ ...prev, ...updatedUser }));
      // Update stored user data
      Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const result = await authAPI.changePassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear cookies
      Cookies.remove('auth_token');
      Cookies.remove('user');
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    updateUserProfile,
    changePassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};