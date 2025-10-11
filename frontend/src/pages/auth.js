import { AuthPage } from '../components/Auth/AuthPage';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function AuthPageRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Agar user already logged in hai, toh uske role ke hisaab se dashboard pe redirect karo
    if (user && !loading) {
      console.log('🔄 AuthPage: User already logged in, redirecting to dashboard...');
      console.log('👤 Current user role:', user.role);
      
      const dashboard = user.role === 'ngo' ? '/ngo-dashboard' : '/donor-dashboard';
      console.log('🎯 Redirecting to:', dashboard);
      
      router.push(dashboard);
    }
  }, [user, loading, router]);

  // Agar loading ho toh loading spinner show karo
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Agar user already logged in hai, toh kuch mat show karo (redirect ho jayega)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Agar user logged in nahi hai, toh auth page show karo
  return <AuthPage />;
}