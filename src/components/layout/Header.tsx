import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ChevronDown, Bell, LogOut, User } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useMessageStore } from '@/store/useMessageStore';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  dashboard: '工作台',
  tasks: '我的任务',
  products: '产品汇总',
  reminders: '提醒中心',
};

export default function Header() {
  const location = useLocation();
  const { currentUser, userRole, logout, setUserRole } = useUserStore();
  const messages = useMessageStore((s) => s.messages);
  const unreadCount = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = (): string[] => {
    const path = location.pathname;
    const crumbs: string[] = [];

    if (path.includes('dashboard') || path === '/') {
      crumbs.push(breadcrumbMap.dashboard);
    } else if (path.includes('tasks')) {
      crumbs.push(breadcrumbMap.tasks);
    } else if (path.includes('products')) {
      crumbs.push(breadcrumbMap.products);
    } else if (path.includes('reminders')) {
      crumbs.push(breadcrumbMap.reminders);
    }

    return crumbs;
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleSwitchRole = (role: 'enterprise' | 'supplier') => {
    setShowUserMenu(false);
    setUserRole(role);
  };

  return (
    <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-forest-100">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">首页</span>
          {getBreadcrumbs().map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-slate-300 -rotate-90" />
              <span className="text-forest-700 font-medium">{crumb}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 rounded-lg border border-forest-200 bg-forest-50/50 text-sm text-forest-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-forest-50 transition-colors">
          <Bell className="h-5 w-5 text-forest-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-clay-500 text-white text-[10px] font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-forest-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-600 text-white text-sm font-semibold">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-forest-800">
                {currentUser?.name || '未登录'}
              </p>
              <p className="text-xs text-slate-500">
                {userRole === 'enterprise' ? '企业用户' : '供应商用户'}
              </p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white shadow-card-hover border border-forest-100 py-2 z-50 animate-fade-in-up">
              <div className="px-4 py-3 border-b border-forest-100">
                <p className="text-sm font-medium text-forest-800">{currentUser?.name}</p>
                <p className="text-xs text-slate-500">{currentUser?.company}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => handleSwitchRole('enterprise')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-forest-50 transition-colors',
                    userRole === 'enterprise' ? 'text-forest-600 bg-forest-50/50' : 'text-slate-600'
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>切换为企业用户</span>
                </button>
                <button
                  onClick={() => handleSwitchRole('supplier')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-forest-50 transition-colors',
                    userRole === 'supplier' ? 'text-forest-600 bg-forest-50/50' : 'text-slate-600'
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>切换为供应商用户</span>
                </button>
              </div>

              <div className="border-t border-forest-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-clay-500 hover:bg-clay-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
