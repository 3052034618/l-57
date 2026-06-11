import { create } from 'zustand';
import type { User, UserRole } from '@/types';

interface UserState {
  currentUser: User | null;
  userRole: UserRole;
  setCurrentUser: (user: User) => void;
  setUserRole: (role: UserRole) => void;
  logout: () => void;
}

const defaultEnterpriseUser: User = {
  id: 'ent-001',
  name: '张明远',
  role: 'enterprise',
  company: '绿能智造科技有限公司',
};

const defaultSupplierUser: User = {
  id: 'sup-001',
  name: '李建国',
  role: 'supplier',
  company: '华东钢铁集团',
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  userRole: 'enterprise',
  setCurrentUser: (user) => set({ currentUser: user }),
  setUserRole: (role) =>
    set({
      userRole: role,
      currentUser: role === 'enterprise' ? defaultEnterpriseUser : defaultSupplierUser,
    }),
  logout: () => set({ currentUser: null, userRole: 'enterprise' }),
}));
