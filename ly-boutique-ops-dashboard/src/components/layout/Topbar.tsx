import { Bell, Search, UserCircle, Shield, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: '管理员 Leo' },
  { value: 'operator', label: '运营' },
  { value: 'assistant', label: '运营助理' },
  { value: 'designer', label: '美工' },
  { value: 'safety', label: '店铺安全/合规' },
];

export function Topbar() {
  const { currentUser, setRole, globalSearch, setGlobalSearch } = useAppStore();

  return (
    <header className="h-14 border-b border-white/10 bg-[#040912]/60 backdrop-blur-md flex items-center justify-between px-6 gap-4 shrink-0">
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search size={16} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="搜索 ASIN / SKU / 任务 / 店铺..."
          className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted w-full"
        />
      </div>

      {/* Right: Status + Role + User */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span>API 正常</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-accent-yellow" />
            <span>3 个审批待处理</span>
          </div>
        </div>

        {/* Role switcher — dev only */}
        <select
          value={currentUser.role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-text-secondary outline-none cursor-pointer hover:border-accent-cyan/30 transition-colors"
        >
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value} className="bg-bg-dark text-text-primary">
              {r.label}
            </option>
          ))}
        </select>

        {/* Notifications */}
        <button className="relative text-text-muted hover:text-text-primary transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-[10px] font-bold grid place-items-center text-white">
            5
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/30 grid place-items-center">
            <Shield size={14} className="text-accent-purple" />
          </div>
          <span className="text-sm font-medium text-text-primary hidden sm:block">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
