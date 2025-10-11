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
        token: !!token 
      });
      
      if (storedUser && token) {
        try {
          setUser(storedUser);
          console.log('✅ Restored user from localStorage:', storedUser.email);
          
          // ✅ Server se verify karo (optional)
          try {
            const response = await authAPI.getProfile();
            if (response.data && response.data.user) {
              const serverUser = response.data.user;
              setUser(serverUser);
              // ✅ Update localStorage with fresh data
              AuthStorage.setAuthData(token, serverUser);
              console.log('✅ Updated user from server profile');
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
        setUser(response.data.user);
        console.log('👤 User set in context:', response.data.user);
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ useAuth: SignIn error:', error.response?.data || error.message);
      throw error;
    }
  };

  const signUp = async (email, password, displayName, role) => {
    try {
      console.log('🔐 useAuth: Attempting registration for:', email, 'as', role);
      
      const response = await authAPI.register({ email, password, displayName, role });
      console.log('✅ useAuth: Registration successful - full response:', response.data);
      
      if (response.data) {
        setUser(response.data.user);
        console.log('👤 User set in context:', response.data.user);
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ useAuth: SignUp error:', error.response?.data || error.message);
      throw error;
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data?.user || response.data;
      setUser(prev => ({ ...prev, ...updatedUser }));
      // ✅ localStorage update karo
      const { token } = AuthStorage.getAuthData();
      if (token) {
        AuthStorage.setAuthData(token, updatedUser);
      }
      return response.data;
    } catch (error) {
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








// import { useState, useEffect, createContext, useContext } from 'react';
// import { authAPI } from '../lib/api';
// import Cookies from 'js-cookie';

// const AuthContext = createContext({});

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check for stored user data on mount
//     const storedUser = Cookies.get('user');
//     const storedToken = Cookies.get('auth_token');
    
//     console.log('🔄 AuthProvider mounting - stored data:', { storedUser: !!storedUser, storedToken: !!storedToken });
    
//     if (storedUser && storedToken) {
//       try {
//         const userData = JSON.parse(storedUser);
//         setUser(userData);
//         console.log('✅ Restored user from cookies:', userData.email);
        
//         // Verify token with server but don't block on error
//         authAPI.getProfile()
//           .then(response => {
//             console.log('✅ Profile verification response:', response);
//             // Handle different response structures
//             if (response.data && response.data.user) {
//               console.log('✅ Updated user from server profile');
//               setUser(response.data.user);
//               Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
//             } else if (response.data) {
//               console.log('✅ Using profile data directly');
//               setUser(response.data);
//               Cookies.set('user', JSON.stringify(response.data), { expires: 7 });
//             }
//           })
//           .catch(error => {
//             console.error('❌ Profile verification failed:', error?.response?.data || error.message);
//             // Don't clear auth data - keep using stored user
//           });
//       } catch (error) {
//         console.error('❌ Error parsing stored user:', error);
//         Cookies.remove('user');
//       }
//     } else {
//       console.log('🔍 No stored auth data found');
//     }
    
//     setLoading(false);
//   }, []);

//   const signIn = async (email, password) => {
//     try {
//       console.log('🔐 useAuth: Attempting login for:', email);
//       const result = await authAPI.login(email, password);
//       console.log('✅ useAuth: Login successful');
      
//       // Note: authAPI.login already stores tokens in cookies
//       setUser(result.user);
//       return result;
//     } catch (error) {
//       console.error('❌ useAuth: SignIn error:', error.response?.data || error.message);
//       throw error;
//     }
//   };

//   const signUp = async (email, password, displayName, role) => {
//     try {
//       const result = await authAPI.register({ email, password, displayName, role });
//       // Note: authAPI.register already stores tokens in cookies
//       setUser(result.user);
//       return result;
//     } catch (error) {
//       console.error('❌ useAuth: SignUp error:', error.response?.data || error.message);
//       throw error;
//     }
//   };

//   const updateUserProfile = async (data) => {
//     try {
//       const result = await authAPI.updateProfile(data);
//       const updatedUser = result.user || result;
//       setUser(prev => ({ ...prev, ...updatedUser }));
//       // Update stored user data
//       Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
//       return result;
//     } catch (error) {
//       throw error;
//     }
//   };

//   const changePassword = async (currentPassword, newPassword) => {
//     try {
//       const result = await authAPI.changePassword(currentPassword, newPassword);
//       return result;
//     } catch (error) {
//       throw error;
//     }
//   };

//   const logout = async () => {
//     try {
//       // Clear cookies
//       Cookies.remove('auth_token');
//       Cookies.remove('user');
//       setUser(null);
//       console.log('✅ Logout successful');
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   };

//   const value = {
//     user,
//     loading,
//     signIn,
//     signUp,
//     updateUserProfile,
//     changePassword,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };