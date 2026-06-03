import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'

export function MonitorPlan() {
  const actions = (window as any).__actions || []
  const data = [
    { '目标':'ACOS控制','监控指标':'ACOS','阈值/Trigger':'> 35%','触发动作':'预算减少50%','时间窗口':'3天','负责角色':'运营','复盘日期':'Day 7' },
    { '目标':'花费效率','监控指标':'ROAS','阈值/Trigger':'< 2.0','触发动作':'暂停低效活动','时间窗口':'7天','负责角色':'运营','复盘日期':'Day 7' },
    { '目标':'否词效果','监控指标':'点击量','阈值/Trigger':'≥10且订单=0','触发动作':'加Negative Exact','时间窗口':'持续','负责角色':'运营','复盘日期':'Day 3' },
    { '目标':'精准拆分验证','监控指标':'新活动ACOS','阈值/Trigger':'< 原活动ACOS','触发动作':'继续观察','时间窗口':'14天','负责角色':'运营','复盘日期':'Day 14' },
    ...(actions.length > 0 ? [{ '目标':'规则引擎动作','监控指标':'动作执行率','阈值/Trigger':'> 80%','触发动作':'复盘未执行动作','时间窗口':'7天','负责角色':'运营','复盘日期':'Day 7' }] : []),
  ]
  return <SimpleTable title="7天监控计划" cols={['目标','监控指标','阈值/Trigger','触发动作','时间窗口','负责角色','复盘日期']} data={data} />
}

export function ExcelDownload() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Excel 报告下载</h2>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-gray-400">分析完成后，可在各页面点击「导出 Excel」下载对应报表</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
          {['数据目录','ASIN总览','流量结构树','12维度行动计划','今日执行清单','7天监控计划'].map(s => (
            <div key={s} className="border border-gray-800 rounded-lg px-3 py-2">{s}.xlsx</div>
          ))}
        </div>
        <p className="text-xs text-orange-400 mt-4">桌面端 EXE 支持完整 17 Sheet 报告导出</p>
      </div>
    </div>
  )
}

export function SystemLogs() {
  return <SimpleTable title="系统日志" cols={['时间','级别','模块','消息']} data={[
    { '时间':new Date().toISOString().slice(0,19).replace('T',' '),'级别':'INFO','模块':'系统','消息':'Amazon Ads Center v2.0 运行中' },
  ]} />
}

function SimpleTable({ title, cols, data }: { title: string; cols: string[]; data: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 bg-gray-900">{cols.map(h => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((r,i) => <tr key={i} className="hover:bg-gray-900/50">{cols.map(c => <td key={c} className="px-4 py-2 text-gray-300 text-xs">{r[c]??'-'}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function TodayTasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const stored = (window as any).__todayTasks || []
    if (stored.length === 0) {
      // Fallback: generate from actions
      const actions = (window as any).__actions || []
      if (actions.length > 0) {
        const t = actions.filter((a: any) => a.priority === 'P0' || a.priority === 'P1').map((a: any, i: number) => ({
          seq: i + 1, priority: a.priority, asin: a.asin || '', campaign: a.campaign_name || '',
          adGroup: a.ad_group_name || '', target: a.target_text || a.search_term || '',
          action: a.suggested_action, adjustment: a.adjustment_value || '',
          status: '待执行', deadline: a.execute_time, note: a.reason,
        }))
        setTasks(t); (window as any).__todayTasks = t
      }
    } else {
      setTasks(stored)
    }
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tasks
    return tasks.filter(t => t.status === statusFilter)
  }, [tasks, statusFilter])

  const updateStatus = (idx: number, status: string) => {
    const updated = tasks.map((t, i) => i === idx ? { ...t, status } : t)
    setTasks(updated); (window as any).__todayTasks = updated
  }

  const exportExcel = () => {
    const rows = filtered.map(t => ({
      '序号': t.seq, '优先级': t.priority, 'ASIN': t.asin, '广告活动': t.campaign,
      '广告组': t.adGroup, '目标词': t.target, '具体动作': t.action,
      '调整值': t.adjustment, '执行状态': t.status, '截止时间': t.deadline, '备注': t.note,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '今日执行清单')
    XLSX.writeFile(wb, `今日执行清单_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const pushToAdmin = () => {
    // Store to localStorage for admin audit page
    localStorage.setItem('pushed_tasks', JSON.stringify({ tasks: filtered, pushedAt: new Date().toISOString() }))
    alert(`已推送 ${filtered.length} 条任务到管理员审计面板`)
  }

  const stats = { total: tasks.length, pending: tasks.filter(t => t.status === '待执行').length, done: tasks.filter(t => t.status === '已完成').length }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">今日执行清单</h2>
        <div className="flex gap-2">
          <button onClick={exportExcel} disabled={tasks.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-30 transition-colors">
            导出 Excel
          </button>
          <button onClick={pushToAdmin} disabled={tasks.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition-colors">
            推送管理员
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-400">总计: <b className="text-white">{stats.total}</b></span>
        <span className="text-yellow-400">待执行: <b>{stats.pending}</b></span>
        <span className="text-green-400">已完成: <b>{stats.done}</b></span>
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {['all','待执行','进行中','已完成','需确认'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>{s === 'all' ? '全部' : s}</button>
        ))}
      </div>

      {/* Memo-style task cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          暂无执行任务。请先在「数据上传」解析数据后到「12维度行动计划」查看。
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t, i) => (
            <div key={i} className={`rounded-xl border p-4 flex items-start gap-4 transition-colors ${
              t.status === '已完成' ? 'border-green-500/20 bg-green-500/5' :
              t.status === '需确认' ? 'border-yellow-500/20 bg-yellow-500/5' :
              'border-gray-800 bg-gray-900 hover:border-gray-700'
            }`}>
              {/* Priority badge */}
              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                t.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
              }`}>{t.priority}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">{t.action}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                  {t.asin && <span>ASIN: {t.asin}</span>}
                  {t.campaign && <span>活动: {t.campaign}</span>}
                  {t.adGroup && <span>广告组: {t.adGroup}</span>}
                  {t.target && <span className="text-gray-400">目标: {t.target}</span>}
                  {t.adjustment && <span className="text-orange-400">调整: {t.adjustment}</span>}
                </div>
              </div>

              {/* Status + Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <select value={t.status} onChange={e => updateStatus(i, e.target.value)}
                  className="text-[11px] rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300 focus:border-orange-500 focus:outline-none">
                  <option value="待执行">待执行</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                  <option value="需确认">需确认</option>
                </select>
                {t.deadline && <span className="text-[10px] text-gray-600">{t.deadline}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
