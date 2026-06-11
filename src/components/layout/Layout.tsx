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
    if (path.includes('dashboard') || path === '/') return 'dashboard';
    if (path.includes('tasks')) return 'tasks';
    if (path.includes('products')) return 'products';
    if (path.includes('reminders')) return 'reminders';
    return 'dashboard';
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'dashboard') {
      navigate(userRole === 'enterprise' ? '/dashboard' : '/tasks');
    } else if (tab === 'tasks') {
      navigate('/tasks');
    } else if (tab === 'products') {
      navigate('/products');
    } else if (tab === 'reminders') {
      navigate('/reminders');
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
