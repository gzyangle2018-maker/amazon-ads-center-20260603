import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, CalendarCheck, BarChart3, FolderKanban,
  ShieldCheck, ListTodo, Bot, Upload, Settings, Users, Wrench,
  ChevronLeft, ChevronRight, Gauge,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { id: 'dashboard', label: '总控首页', icon: 'Gauge', path: '/', roles: ['admin', 'operator', 'assistant', 'designer', 'safety'] },
  { id: 'daily', label: '每日扫描', icon: 'Search', path: '/daily', roles: ['admin', 'operator', 'assistant'] },
  { id: 'weekly', label: '每周诊断', icon: 'CalendarCheck', path: '/weekly', roles: ['admin', 'operator'] },
  { id: 'monthly', label: '每月分级', icon: 'BarChart3', path: '/monthly', roles: ['admin', 'operator'] },
  { id: 'asin', label: 'ASIN 详情', icon: 'FolderKanban', path: '/asin', roles: ['admin', 'operator', 'assistant'] },
  { id: 'attribution', label: '广告归属审计', icon: 'ShieldCheck', path: '/attribution', roles: ['admin', 'operator'] },
  { id: 'tasks', label: '任务中心', icon: 'ListTodo', path: '/tasks', roles: ['admin', 'operator', 'assistant', 'designer', 'safety'] },
  { id: 'agents', label: 'Agent 路由', icon: 'Bot', path: '/agents', roles: ['admin', 'operator'] },
  { id: 'upload', label: '数据投喂', icon: 'Upload', path: '/upload', roles: ['admin', 'operator', 'assistant'] },
  { id: 'models', label: '模型配置', icon: 'Settings', path: '/models', roles: ['admin'] },
  { id: 'permissions', label: '权限管理', icon: 'Users', path: '/permissions', roles: ['admin'] },
  { id: 'settings', label: '系统设置', icon: 'Wrench', path: '/settings', roles: ['admin'] },
];

const iconMap: Record<string, React.ReactNode> = {
  Gauge: <Gauge size={18} />,
  Search: <Search size={18} />,
  CalendarCheck: <CalendarCheck size={18} />,
  BarChart3: <BarChart3 size={18} />,
  FolderKanban: <FolderKanban size={18} />,
  ShieldCheck: <ShieldCheck size={18} />,
  ListTodo: <ListTodo size={18} />,
  Bot: <Bot size={18} />,
  Upload: <Upload size={18} />,
  Settings: <Settings size={18} />,
  Users: <Users size={18} />,
  Wrench: <Wrench size={18} />,
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, sidebarCollapsed, toggleSidebar } = useAppStore();

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } transition-all duration-200 border-r border-white/10 bg-[#040912]/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col shrink-0`}
    >
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 border-b border-white/8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple grid place-items-center text-bg-dark font-black text-xl shrink-0">
          L
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <strong className="text-sm block leading-tight">LY-OPS</strong>
            <small className="text-text-muted text-[11px] block leading-tight">小精品数据总控台</small>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-text-muted hover:text-text-primary transition-colors shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan font-semibold'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
              }`}
            >
              <span className="shrink-0">{iconMap[item.icon]}</span>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-white/8">
          <div className="p-3 rounded-xl bg-white/5 text-xs text-text-muted leading-relaxed">
            <b className="text-text-secondary text-[11px]">AI 审计原则</b>
            <p className="mt-1.5">C/D级归属禁止强执行。<br />所有任务须有证据闭环。</p>
          </div>
        </div>
      )}
    </aside>
  );
}
