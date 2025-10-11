import { DonorDashboard } from '../components/Donor/DonorDashboard';
import { withDonorAuth } from '../middleware/routeGuard';

function DonorDashboardPage() {
  return <DonorDashboard />;
}

// ✅ Sirf donors hi access kar payenge
export default withDonorAuth(DonorDashboardPage);