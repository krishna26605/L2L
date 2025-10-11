import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const withAuth = (WrappedComponent, allowedRoles = []) => {
  return (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          console.log('🚫 RouteGuard: User not authenticated, redirecting to login');
          toast.error('Please login to access this page');
          router.push('/auth');
          return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          console.log(`🚫 RouteGuard: User role ${user.role} not allowed for this page`);
          toast.error('You do not have permission to access this page');
          
          // User ke role ke hisaab se redirect karo
          const redirectTo = user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
          router.push(redirectTo);
          return;
        }
      }
    }, [user, loading, router]);

    // Loading show karo
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }

    // Agar user nahi hai ya role sahi nahi hai
    if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
      return null;
    }

    // Sab sahi hai, component show karo
    return <WrappedComponent {...props} />;
  };
};

export const withDonorAuth = (Component) => withAuth(Component, ['donor']);
export const withNGOAuth = (Component) => withAuth(Component, ['ngo']);
export const withAnyAuth = (Component) => withAuth(Component, ['donor', 'ngo']);