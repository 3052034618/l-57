import { LayoutDashboard, FileText, ClipboardCheck, BarChart3, Bell, LogOut } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export default function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  const { currentUser, userRole, logout } = useUserStore();

  const menuItems = [
    {
      key: userRole === 'enterprise' ? 'dashboard' : 'tasks',
      label: userRole === 'enterprise' ? '工作台' : '我的任务',
      icon: userRole === 'enterprise' ? LayoutDashboard : ClipboardCheck,
    },
    {
      key: 'products',
      label: '产品汇总',
      icon: BarChart3,
    },
    {
      key: 'reminders',
      label: '提醒中心',
      icon: Bell,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-forest-100">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-forest-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-forest-500 to-forest-700">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-forest-800">碳核算平台</h1>
          <p className="text-xs text-slate-500">Carbon Accounting</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn('sidebar-item w-full', isActive && 'sidebar-item-active')}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-forest-100">
        {currentUser && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-forest-50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-600 text-white font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-forest-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.company}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-slate-500 hover:text-clay-500 hover:bg-clay-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  );
}
