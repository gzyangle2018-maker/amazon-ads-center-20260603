import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Upload, FolderOpen, ArrowsLeftRight, Warning, SquaresFour, TreeStructure,
  ListChecks, ClipboardText, Calendar, Download, ShieldCheck, Sliders,
  Cpu, Scroll, List, X, ChartBar,
} from '@phosphor-icons/react'
import { useTheme, ThemePicker } from '../hooks/useTheme'

const menuItems = [
  { to: '/', label: '数据上传', icon: Upload },
  { to: '/catalog', label: '数据目录', icon: FolderOpen },
  { to: '/fields', label: '字段识别', icon: ArrowsLeftRight },
  { to: '/missing', label: '缺失检查', icon: Warning },
  { to: '/asin-overview', label: 'ASIN 总览', icon: SquaresFour },
  { to: '/traffic-tree', label: '流量结构树', icon: TreeStructure },
  { to: '/action-plan', label: '12 维度行动计划', icon: ListChecks },
  { to: '/today-tasks', label: '今日执行清单', icon: ClipboardText },
  { to: '/monitor', label: '7 天监控计划', icon: Calendar },
  { to: '/download', label: 'Excel 报告下载', icon: Download },
  { to: '/audit', label: '管理员审计', icon: ShieldCheck },
  { to: '/bi', label: 'BI 数据看板', icon: ChartBar },
  { to: '/category-config', label: '运营模式配置', icon: Sliders },
  { to: '/llm-settings', label: 'LLM API 设置', icon: Cpu },
  { to: '/logs', label: '系统日志', icon: Scroll },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const themeCtx = useTheme()

  const currentPage = menuItems.find(m => {
    if (m.to === '/') return location.pathname === '/'
    return location.pathname.startsWith(m.to)
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B14' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Floating glass sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[232px] transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:static lg:translate-x-0 overflow-hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full m-3 rounded-[1.75rem] border border-white/[0.06] overflow-y-auto"
          style={{ background: 'rgba(15,20,38,0.9)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>

          {/* Logo area */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.7), rgba(249,115,22,0.3))', boxShadow: '0 4px 16px rgba(249,115,22,0.25)' }}>
                <ChartBar className="h-[18px] w-[18px] text-white" weight="fill" />
              </div>
              <div>
                <h1 className="text-[14px] font-bold tracking-[-0.01em] text-white leading-tight">Amazon Ads</h1>
                <p className="text-[10px] text-white/25 tracking-wider">广告执行中枢</p>
              </div>
              <button className="ml-auto rounded-lg p-1.5 hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4 text-white/30" />
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 pb-4 space-y-0.5">
            {menuItems.map((item) => {
              const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                  style={isActive ? { background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' } : {}}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" weight={isActive ? 'fill' : 'regular'} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-5 mt-auto border-t border-white/[0.04] space-y-1.5">
            <p className="text-[10px] text-white/20">Amazon Ads Center v2.0</p>
            <p className="text-[9px] text-white/10">Designed by Leo Young</p>
            <p className="text-[9px] text-white/10">Shenzhen, China</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Glass top bar */}
        <header className="flex items-center h-[60px] px-5 mx-3 mt-3 rounded-2xl border border-white/[0.05] shrink-0"
          style={{ background: 'rgba(15,20,38,0.7)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <button className="rounded-xl p-2 -ml-1 hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <List className="h-5 w-5 text-white/40" />
          </button>
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            {currentPage && (
              <>
                <currentPage.icon className="h-[15px] w-[15px] shrink-0 text-white/25" weight="regular" />
                <span className="text-[13px] font-medium text-white/60 tracking-[-0.01em] truncate">{currentPage.label}</span>
              </>
            )}
          </div>
          <ThemePicker {...themeCtx} />
          <span className="text-[10px] text-white/15 ml-2 tracking-wider hidden sm:inline">v2.0</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 relative">
          <div className="animate-fade-in">
            <Outlet />
          </div>
          <div className="fixed bottom-3 right-5 text-[9px] text-white/[0.08] select-none pointer-events-none z-0">
            Designed by Leo Young in Shenzhen, China
          </div>
        </main>
      </div>
    </div>
  )
}
