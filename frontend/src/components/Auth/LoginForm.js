import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export const LoginForm = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signIn } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setErrors({});

  try {
    console.log('🔄 LoginForm: Attempting login for:', email);
    console.log('📝 LoginForm: Calling signIn function...');
    
    const response = await signIn(email, password);
    
    console.log('✅ LoginForm: signIn response received:', response);
    
    if (!response) {
      throw new Error('No response from signIn function');
    }
    
    // Check if signIn was successful
    if (response.success === false) {
      throw new Error(response.error || 'Login failed');
    }
    
    console.log('✅ LoginForm: Login successful!', response);
    
    // ✅ Wait a bit more to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // ✅ Verify auth state after login
    const { user: authUser } = useAuth();
    console.log('🔍 Auth state after login:', {
      user: authUser,
      hasUser: !!authUser
    });
    
    toast.success('Welcome back!');
    
    // Determine redirect path
    let redirectPath = '/donor-dashboard'; // fallback
    
    if (response?.redirectTo) {
      redirectPath = response.redirectTo;
      console.log('🎯 Using backend redirect:', redirectPath);
    } else if (response?.user?.role) {
      redirectPath = response.user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
      console.log('🎯 Determined redirect from role:', redirectPath);
    } else if (response?.role) {
      redirectPath = response.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
      console.log('🎯 Determined redirect from role in response:', redirectPath);
    }
    
    console.log('🔄 Final redirect to:', redirectPath);
    
    // ✅ Use window.location for more reliable redirect
    window.location.href = redirectPath;
    
  } catch (error) {
    console.error('❌ LoginForm: Login failed!', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Specific error handling
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      errorMessage = 'Cannot connect to server. Please check if backend is running.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    console.log('📢 Showing error to user:', errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">ZW</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your ZeroWaste account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
            disabled={loading}
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};












// import { useState } from 'react';
// import { useRouter } from 'next/router';
// import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import toast from 'react-hot-toast';
// import Cookies from 'js-cookie';

// export const LoginForm = ({ onSwitchToSignup }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   const { signIn } = useAuth();
//   const router = useRouter();

//   const validateForm = () => {
//     const newErrors = {};

//     if (!email) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = 'Email is invalid';
//     }

//     if (!password) {
//       newErrors.password = 'Password is required';
//     } else if (password.length < 6) {
//       newErrors.password = 'Password must be at least 6 characters';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);
//     setErrors({});

//     try {
//       console.log('🔄 LoginForm: Attempting login for:', email);
      
//       await signIn(email, password);
      
//       console.log('✅ LoginForm: Login successful, checking cookies...');
      
//       // Verify cookies were set
//       const tokenAfterLogin = Cookies.get('auth_token');
//       const userAfterLogin = Cookies.get('user');
      
//       console.log('🍪 Token after login:', tokenAfterLogin ? 'PRESENT' : 'MISSING');
//       console.log('🍪 User after login:', userAfterLogin ? 'PRESENT' : 'MISSING');
      
//       if (!tokenAfterLogin) {
//         throw new Error('Authentication token not set after login');
//       }
      
//       toast.success('Welcome back!');
//       console.log('🔄 Redirecting to donor dashboard...');
//       router.push('/donor-dashboard');
      
//     } catch (error) {
//       console.error('❌ LoginForm: Login failed!', error);
      
//       let errorMessage = 'Login failed. Please try again.';
      
//       if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       // Specific error handling
//       if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
//         errorMessage = 'Cannot connect to server. Please check if backend is running.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Invalid email or password';
//       } else if (error.response?.status === 500) {
//         errorMessage = 'Server error. Please try again later.';
//       }
      
//       console.log('📢 Showing error to user:', errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-xl p-8">
//       <div className="text-center mb-8">
//         <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
//           <span className="text-white font-bold text-2xl">ZW</span>
//         </div>
//         <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
//         <p className="text-gray-600 mt-2">Sign in to your ZeroWaste account</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Email Field */}
//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//             Email Address
//           </label>
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Mail className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
//                 errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
//               }`}
//               placeholder="Enter your email"
//               disabled={loading}
//             />
//           </div>
//           {errors.email && (
//             <div className="flex items-center mt-2 text-sm text-red-600">
//               <AlertCircle className="h-4 w-4 mr-1" />
//               {errors.email}
//             </div>
//           )}
//         </div>

//         {/* Password Field */}
//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//             Password
//           </label>
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Lock className="h-5 w-5 text-gray-400" />
//             </div>
//             <input
//               id="password"
//               type={showPassword ? 'text' : 'password'}
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
//                 errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
//               }`}
//               placeholder="Enter your password"
//               disabled={loading}
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute inset-y-0 right-0 pr-3 flex items-center"
//               disabled={loading}
//             >
//               {showPassword ? (
//                 <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
//               ) : (
//                 <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
//               )}
//             </button>
//           </div>
//           {errors.password && (
//             <div className="flex items-center mt-2 text-sm text-red-600">
//               <AlertCircle className="h-4 w-4 mr-1" />
//               {errors.password}
//             </div>
//           )}
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//         >
//           {loading ? (
//             <div className="flex items-center justify-center">
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//               Signing in...
//             </div>
//           ) : (
//             'Sign In'
//           )}
//         </button>
//       </form>

//       {/* Switch to Signup */}
//       <div className="mt-6 text-center">
//         <p className="text-gray-600">
//           Don't have an account?{' '}
//           <button
//             onClick={onSwitchToSignup}
//             className="text-green-600 hover:text-green-700 font-medium transition-colors"
//             disabled={loading}
//           >
//             Sign up here
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// };