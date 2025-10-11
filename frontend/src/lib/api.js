import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ✅ AuthStorage ko properly export karo
export const AuthStorage = {
  // Save auth data
  setAuthData: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('💾 Auth data saved to localStorage');
  },

  // Get auth data
  getAuthData: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    return { 
      token, 
      user: user ? JSON.parse(user) : null 
    };
  },

  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    console.log('🗑️ Auth data cleared from localStorage');
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // ✅ localStorage se token lo
    const { token } = AuthStorage.getAuthData();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 API Request: Added auth token from localStorage');
    }
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('🚫 Unauthorized - clearing auth data');
      AuthStorage.clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API - Simple localStorage solution
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;
    
    console.log('🔐 authAPI.register - Full response:', response.data);
    
    // ✅ localStorage mein save karo
    AuthStorage.setAuthData(token, user);
    
    return response;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    console.log('🔐 authAPI.login - Full response:', response.data);
    
    // ✅ localStorage mein save karo
    AuthStorage.setAuthData(token, user);
    
    return response;
  },

  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
  deleteAccount: () => api.delete('/auth/account'),
  getStats: () => api.get('/auth/stats'),
};

// Donations API
export const donationsAPI = {
  getAll: (params) => api.get('/donations', { params }),
  getById: (id) => api.get(`/donations/${id}`),
  create: (data) => api.post('/donations', data),
  update: (id, data) => api.put(`/donations/${id}`, data),
  delete: (id) => api.delete(`/donations/${id}`),
  claim: (id) => api.post(`/donations/${id}/claim`),
  markAsPicked: (id) => api.post(`/donations/${id}/pickup`),
  getByLocation: (params) => api.get('/donations/location', { params }),
  getStats: () => api.get('/donations/stats'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getProfile: (id) => api.get(`/users/${id}/profile`),
  getDonations: (id, params) => api.get(`/users/${id}/donations`, { params }),
  getDashboardStats: (id) => api.get(`/users/${id}/dashboard-stats`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  search: (params) => api.get('/users/search', { params }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getUserImages: () => api.get('/upload/images'),
  getImageInfo: (fileName) => api.get(`/upload/image/${fileName}`),
  deleteImage: (fileName) => api.delete(`/upload/image/${fileName}`),
};

export default api;



// import axios from 'axios';
// import Cookies from 'js-cookie';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
// });

// // Request interceptor to add auth token
// api.interceptors.request.use(
//   (config) => {
//     const token = Cookies.get('auth_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log('🔑 API Request: Added auth token to headers');
//     }
//     console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
//     return config;
//   },
//   (error) => {
//     console.error('❌ API Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for debugging and error handling
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ API Response:', response.config.url, response.status);
//     return response;
//   },
//   (error) => {
//     console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data);
//     if (error.response?.status === 401) {
//       console.log('🚫 Unauthorized - clearing auth data');
//       Cookies.remove('auth_token');
//       Cookies.remove('user');
//       if (typeof window !== 'undefined') {
//         window.location.href = '/auth';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// // Auth API - This is the single source of truth for auth operations
// export const authAPI = {
//   register: async (userData) => {
//     const response = await api.post('/auth/register', userData);
//     const { token, user } = response.data;
    
//     // Store token and user data
//     Cookies.set('auth_token', token, { expires: 7 });
//     Cookies.set('user', JSON.stringify(user), { expires: 7 });
    
//     return response.data;
//   },

//   login: async (email, password) => {
//     const response = await api.post('/auth/login', { email, password });
//     const { token, user } = response.data;
    
//     // Store token and user data
//     Cookies.set('auth_token', token, { expires: 7 });
//     Cookies.set('user', JSON.stringify(user), { expires: 7 });
    
//     return response.data;
//   },

//   getProfile: () => api.get('/auth/profile'),
//   updateProfile: (data) => api.put('/auth/profile', data),
//   changePassword: (currentPassword, newPassword) => 
//     api.put('/auth/change-password', { currentPassword, newPassword }),
//   deleteAccount: () => api.delete('/auth/account'),
//   getStats: () => api.get('/auth/stats'),
// };

// // Donations API
// export const donationsAPI = {
//   getAll: (params) => api.get('/donations', { params }),
//   getById: (id) => api.get(`/donations/${id}`),
//   create: (data) => api.post('/donations', data),
//   update: (id, data) => api.put(`/donations/${id}`, data),
//   delete: (id) => api.delete(`/donations/${id}`),
//   claim: (id) => api.post(`/donations/${id}/claim`),
//   markAsPicked: (id) => api.post(`/donations/${id}/pickup`),
//   getByLocation: (params) => api.get('/donations/location', { params }),
//   getStats: () => api.get('/donations/stats'),
// };

// // Users API
// export const usersAPI = {
//   getAll: (params) => api.get('/users', { params }),
//   getById: (id) => api.get(`/users/${id}`),
//   getProfile: (id) => api.get(`/users/${id}/profile`),
//   getDonations: (id, params) => api.get(`/users/${id}/donations`, { params }),
//   getDashboardStats: (id) => api.get(`/users/${id}/dashboard-stats`),
//   update: (id, data) => api.put(`/users/${id}`, data),
//   delete: (id) => api.delete(`/users/${id}`),
//   search: (params) => api.get('/users/search', { params }),
// };

// // Upload API
// export const uploadAPI = {
//   uploadImage: (formData) => api.post('/upload/image', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   }),
//   getUserImages: () => api.get('/upload/images'),
//   getImageInfo: (fileName) => api.get(`/upload/image/${fileName}`),
//   deleteImage: (fileName) => api.delete(`/upload/image/${fileName}`),
// };

// export default api;