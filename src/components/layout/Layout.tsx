import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useUserStore();

  const getActiveTab = (): string => {
    const path = location.pathname;
    if (path.startsWith('/dashboard') || path.startsWith('/report') || path.startsWith('/audit')) return 'dashboard';
    if (path.startsWith('/summary')) return 'summary';
    if (path.startsWith('/notifications')) return 'notifications';
    return 'dashboard';
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'dashboard') {
      navigate('/dashboard');
    } else if (tab === 'summary') {
      navigate('/summary');
    } else if (tab === 'notifications') {
      navigate('/notifications');
    }
  };

  return (
    <div className="flex h-screen bg-sand-50">
      <Sidebar activeTab={getActiveTab()} onNavigate={handleNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
