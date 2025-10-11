import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { AuthPage } from '../components/Auth/AuthPage';
import { DonorDashboard } from '../components/Donor/DonorDashboard';
import { NGODashboard } from '../components/NGO/NGODashboard';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.role === 'donor') {
        router.push('/donor-dashboard');
      } else if (user.role === 'ngo') {
        router.push('/ngo-dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ZeroWaste DineMap...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Show appropriate dashboard based on role
  if (user.role === 'donor') {
    return <DonorDashboard />;
  } else if (user.role === 'ngo') {
    return <NGODashboard />;
  }

  // If user exists but no role, show auth page
  return <AuthPage />;
}
