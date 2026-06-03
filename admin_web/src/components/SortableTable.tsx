// ─── 可排序筛选表格 + Excel Blob 导出 ───
import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'

export function SortableTable({ title, columns, data, empty }: {
  title: string; columns: string[]; data: any[]; empty: string
}) {
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [filters, setFilters] = useState<Record<string,string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const sorted = useMemo(() => {
    let rows = [...data]
    for (const [col, val] of Object.entries(filters)) {
      if (!val) continue
      rows = rows.filter(r => String(r[col] ?? '').toLowerCase().includes(val.toLowerCase()))
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        const na = isNaN(Number(av)) ? String(av ?? '') : Number(av)
        const nb = isNaN(Number(bv)) ? String(bv ?? '') : Number(bv)
        if (typeof na === 'number' && typeof nb === 'number') return sortDir === 'desc' ? nb - na : na - nb
        return sortDir === 'desc' ? String(nb).localeCompare(String(na)) : String(na).localeCompare(String(nb))
      })
    }
    return rows
  }, [data, sortCol, sortDir, filters])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const exportExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(sorted)
      ws['!cols'] = columns.map(() => ({ wch: 20 }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${title}_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click(); URL.revokeObjectURL(url)
    } catch(e) { alert('导出失败: ' + (e as Error).message) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
            {showFilters ? '隐藏筛选' : '筛选'}
          </button>
          <button onClick={exportExcel} disabled={sorted.length===0}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-30 transition-colors">
            导出 Excel
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex gap-2 flex-wrap">
          {columns.slice(0, 8).map(col => (
            <input key={col} placeholder={col} value={filters[col] || ''}
              onChange={e => setFilters(f => ({...f, [col]: e.target.value}))}
              className="w-28 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none" />
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {columns.map(col => (
                <th key={col} onClick={() => handleSort(col)}
                  className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap">
                  {col}{sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sorted.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">{empty}</td></tr>
            ) : sorted.map((row, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {row[col] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-600">共 {sorted.length} 条（筛选自 {data.length} 条）</p>
    </div>
  )
}
