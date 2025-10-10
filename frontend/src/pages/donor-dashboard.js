import { DonorDashboard } from '../components/Donor/DonorDashboard';
import { withAuth } from '../hooks/withAuth';

function DonorDashboardPage() {
  return <DonorDashboard />;
}

export default withAuth(DonorDashboardPage);