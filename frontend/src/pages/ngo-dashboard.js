import { NGODashboard } from '../components/NGO/NGODashboard';
import { withNGOAuth } from '../middleware/routeGuard';

function NGODashboardPage() {
  return <NGODashboard />;
}

// ✅ Sirf NGOs hi access kar payenge
export default withNGOAuth(NGODashboardPage);