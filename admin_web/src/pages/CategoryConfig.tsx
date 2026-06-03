// ─── 运营模式配置 v2 — 短期/长期 ACOS + TACOS ───
import { useState } from 'react'

type Mode = {
  id: string; name: string; desc: string
  shortAcos: number; shortTacos: number; longAcos: number; longTacos: number
  budgetStrategy: string; bidStrategy: string
  rules: string[]
}

const DEFAULT_MODES: Mode[] = [
  { id: 'new_product', name: '新品启动', desc: '新品上线30天内，快速获取曝光和初始销量',
    shortAcos: 0.40, shortTacos: 0.25, longAcos: 0.30, longTacos: 0.15,
    budgetStrategy: '激进放量，预算不设上限，跑出数据后再优化', bidStrategy: '固定竞价 + 0.2 USD 溢价',
    rules: ['ACOS < 35% 持续放量','点击≥10 0订单 → 否词','3天内无订单 → 检查Listing','自动投放 + 广泛匹配优先'] },
  { id: 'reboost', name: '老品二次推爆', desc: '老品销量下滑或需要重新拉升排名',
    shortAcos: 0.30, shortTacos: 0.18, longAcos: 0.22, longTacos: 0.12,
    budgetStrategy: '精准放量，只看高转化词，预算集中在高效活动', bidStrategy: '动态竞价-提高和降低',
    rules: ['重点投放历史高转化词','低效词→否词','高转化词→拆精准组','SB视频+SD重定向配合'] },
  { id: 'profit', name: '利润维护', desc: '稳定期产品，维持排名和利润平衡',
    shortAcos: 0.20, shortTacos: 0.12, longAcos: 0.15, longTacos: 0.08,
    budgetStrategy: '保守投放，预算控制在销售额的10%', bidStrategy: '动态竞价-只降低',
    rules: ['ACOS > 20% → 降价','ACOS < 15% → 稳定出价','精准匹配为主','防守词+品牌词保护'] },
  { id: 'clearance', name: '清库存', desc: '需要快速清理库存，优先出单而非利润',
    shortAcos: 0.55, shortTacos: 0.40, longAcos: 0.45, longTacos: 0.30,
    budgetStrategy: '最大化曝光，预算不限，以出单为首要目标', bidStrategy: '固定竞价 + 高溢价',
    rules: ['ACOS 容忍度提高到50%','所有词广泛匹配','SD浏览再营销+购买再营销','Coupon+Promotion配合'] },
]

export default function CategoryConfig() {
  const [modes, setModes] = useState<Mode[]>(() => {
    const saved = localStorage.getItem('ad_operational_modes')
    return saved ? JSON.parse(saved) : DEFAULT_MODES
  })
  const [selected, setSelected] = useState<Mode | null>(null)
  const [editing, setEditing] = useState(false)

  const save = (updated: Mode[]) => { setModes(updated); localStorage.setItem('ad_operational_modes', JSON.stringify(updated)) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">运营模式配置</h2>
        <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">仅管理员可见</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map(m => (
          <div key={m.id}
            onClick={() => { setSelected(m); setEditing(false) }}
            className={`rounded-xl border p-4 cursor-pointer transition-colors ${
              selected?.id === m.id ? 'border-orange-500 bg-orange-500/5' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
            }`}>
            <h3 className="font-semibold text-white text-sm">{m.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-gray-500">短期(≤2周)</span><br/><span className="text-orange-400">ACOS {(m.shortAcos*100).toFixed(0)}%</span> <span className="text-blue-400">TACOS {(m.shortTacos*100).toFixed(0)}%</span></div>
              <div><span className="text-gray-500">长期(&gt;2周)</span><br/><span className="text-green-400">ACOS {(m.longAcos*100).toFixed(0)}%</span> <span className="text-purple-400">TACOS {(m.longTacos*100).toFixed(0)}%</span></div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setEditing(!editing) }}
              className="mt-2 text-[10px] text-orange-400 hover:text-orange-300">
              {editing && selected?.id === m.id ? '收起编辑' : '编辑规则'}
            </button>
          </div>
        ))}
      </div>

      {selected && editing && (
        <div className="rounded-xl border border-orange-500/50 bg-gray-900 p-5 space-y-3">
          <h3 className="font-bold text-white">编辑: {selected.name}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['name','模式名称'], ['desc','描述']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input value={String((selected as any)[key] || '')}
                  onChange={e => setSelected({...selected, [key]: e.target.value})}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[['shortAcos','短期ACOS'],['shortTacos','短期TACOS'],['longAcos','长期ACOS'],['longTacos','长期TACOS']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
                <input type="number" step="0.01" min="0" max="1"
                  value={(selected as any)[key]}
                  onChange={e => setSelected({...selected, [key]: parseFloat(e.target.value)||0})}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['budgetStrategy','预算策略'],['bidStrategy','竞价策略']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input value={String((selected as any)[key] || '')}
                  onChange={e => setSelected({...selected, [key]: e.target.value})}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">规则列表（每行一条）</label>
            <textarea value={(selected.rules || []).join('\n')}
              onChange={e => setSelected({...selected, rules: e.target.value.split('\n').filter(Boolean)})}
              rows={4} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { const updated = modes.map(m => m.id === selected.id ? selected : m); save(updated); setEditing(false) }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">保存</button>
            <button onClick={() => setEditing(false)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
