import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Factory, Leaf, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  role: UserRole;
  title: string;
  company: string;
  description: string;
  icon: typeof Building;
  selected: boolean;
  onSelect: () => void;
}

function RoleCard({ role, title, company, description, icon: Icon, selected, onSelect }: RoleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative w-full max-w-md cursor-pointer rounded-2xl p-8 transition-all duration-500',
        'bg-white/95 backdrop-blur-sm border-2 shadow-xl',
        selected
          ? 'border-forest-500 shadow-2xl scale-[1.02] -translate-y-2'
          : 'border-forest-100 hover:border-forest-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none',
          selected && 'bg-gradient-to-br from-forest-500/5 to-forest-700/5 opacity-100'
        )}
      />

      <div className="relative flex flex-col items-center text-center gap-5">
        <div
          className={cn(
            'flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-500',
            selected
              ? 'bg-gradient-to-br from-forest-500 to-forest-700 text-white shadow-lg scale-110'
              : 'bg-gradient-to-br from-forest-100 to-forest-200 text-forest-600',
            isHovered && !selected && 'bg-gradient-to-br from-forest-200 to-forest-300 scale-105'
          )}
        >
          <Icon className="w-10 h-10" strokeWidth={1.8} />
        </div>

        <div className="space-y-2">
          <h3 className={cn(
            'text-xl font-bold transition-colors duration-300',
            selected ? 'text-forest-700' : 'text-forest-800'
          )}>
            {title}
          </h3>
          <p className="text-lg font-semibold text-forest-600">{company}</p>
          <p className="text-sm text-slate-500 leading-relaxed px-2">{description}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 w-full justify-center',
            selected
              ? 'bg-gradient-to-r from-forest-600 to-forest-500 text-white shadow-lg'
              : 'bg-forest-50 text-forest-600',
            isHovered && !selected && 'bg-forest-100'
          )}
        >
          以此身份登录
          <ArrowRight className={cn(
            'w-4 h-4 transition-transform duration-300',
            (isHovered || selected) && 'translate-x-1'
          )} />
        </div>

        {selected && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-forest-500 to-forest-700 rounded-full flex items-center justify-center shadow-lg animate-fade-in-up">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setUserRole } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      setUserRole(selectedRole);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-forest-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-forest-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-forest-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-14 animate-fade-in-up">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-300 to-forest-500 flex items-center justify-center shadow-xl">
              <Leaf className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            碳中和供应商协同平台
          </h1>
          <p className="text-lg md:text-xl text-forest-100/80 font-light max-w-xl mx-auto leading-relaxed">
            赋能绿色供应链，携手实现碳中和目标
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <RoleCard
              role="enterprise"
              title="企业用户"
              company="绿能智造科技有限公司"
              description="管理供应商碳排放数据，审核任务填报，查看产品全生命周期碳足迹分析报告"
              icon={Building}
              selected={selectedRole === 'enterprise'}
              onSelect={() => handleRoleSelect('enterprise')}
            />
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-forest-400/50 to-transparent" />
          </div>
          <div className="md:hidden flex items-center justify-center py-2">
            <div className="w-0.5 h-12 bg-gradient-to-b from-transparent via-forest-400/50 to-transparent" />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <RoleCard
              role="supplier"
              title="供应商用户"
              company="华东钢铁集团"
              description="填报原材料、生产、运输等环节碳排放数据，上传凭证，接收审核反馈"
              icon={Factory}
              selected={selectedRole === 'supplier'}
              onSelect={() => handleRoleSelect('supplier')}
            />
          </div>
        </div>

        <div className="mt-14 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedRole}
            className={cn(
              'group relative inline-flex items-center justify-center gap-3 px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden',
              selectedRole
                ? 'bg-gradient-to-r from-forest-300 via-forest-400 to-forest-500 text-forest-900 shadow-2xl hover:shadow-forest-500/30 hover:scale-[1.03] active:scale-[0.98]'
                : 'bg-white/10 text-white/40 cursor-not-allowed backdrop-blur-sm border border-white/10'
            )}
          >
            <span className="relative z-10">
              {selectedRole ? '进入工作台' : '请先选择身份'}
            </span>
            <ArrowRight className={cn(
              'w-5 h-5 relative z-10 transition-transform duration-300',
              selectedRole && 'group-hover:translate-x-1'
            )} />
            {selectedRole && (
              <div className="absolute inset-0 bg-gradient-to-r from-forest-400/0 via-white/30 to-forest-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}
          </button>
        </div>

        <p className="mt-10 text-sm text-forest-200/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          © 2024 碳中和供应商协同平台 · 绿色智造，可持续未来
        </p>
      </div>
    </div>
  );
}
