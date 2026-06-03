import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Play, Loader2 } from 'lucide-react'
import type { ReportRecognition, StandardAdRow } from '../types'
import { classifySheet, extractDateRange } from '../services/reportClassifier'
import { mapAllFields, standardizeRow } from '../services/fieldMapper'


export default function DataUpload() {
  const [files, setFiles] = useState<{ name: string; size: number; data: ArrayBuffer }[]>([])
  const [results, setResults] = useState<ReportRecognition[]>([])
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [allDataRows, setAllDataRows] = useState<StandardAdRow[]>([])

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: { name: string; size: number; data: ArrayBuffer }[] = []
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      if (f.name.match(/\.(csv|xlsx|xls)$/i)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newFiles.push({ name: f.name, size: f.size, data: e.target!.result as ArrayBuffer })
          if (newFiles.length === fileList.length) {
            setFiles(prev => [...prev, ...newFiles])
          }
        }
        reader.readAsArrayBuffer(f)
      }
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const startParse = async () => {
    setParsing(true); setProgress('解析中...')
    const recognitions: ReportRecognition[] = []
    const allRows: StandardAdRow[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(`解析 ${i+1}/${files.length}: ${file.name}`)
      try {
        const wb = XLSX.read(new Uint8Array(file.data), { type: 'array', codepage: 65001 })
        const sheets: any[] = []

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName]
          const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          if (rawData.length < 2) continue

          // Find header row (scan first 20 for ABA)
          let headerIdx = 0, maxSignals = 0
          const signals = ['广告活动名称','客户搜索词','（父）ASIN','搜索查询','Search Query','展示量','点击量','Impressions','Clicks','（子）ASIN','搜索词']
          for (let r = 0; r < Math.min(20, rawData.length); r++) {
            const rowText = rawData[r].map(String).join(' ')
            const score = signals.filter(s => rowText.includes(s)).length
            if (score > maxSignals) { maxSignals = score; headerIdx = r }
          }

          const headers = rawData[headerIdx].map(String)
          const dataRows = rawData.slice(headerIdx + 1).filter(r => r.some((c: any) => String(c).trim()))

          // Classify
          const recognition = classifySheet(file.name, sheetName, headers)
          recognition.rowCount = dataRows.length

          // Map fields & standardize
          if (recognition.status === 'recognized') {
            const mapping = mapAllFields(headers)
            const fieldMap: Record<string, string> = {}
            mapping.forEach(m => { if (m.inCalculation) fieldMap[m.originalField] = m.standardField })

            for (const dataRow of dataRows) {
              const raw: Record<string, any> = {}
              headers.forEach((h, idx) => { raw[h] = dataRow[idx] ?? '' })
              const stdRow = standardizeRow(raw, fieldMap)
              stdRow.source_file = file.name
              stdRow.sheet_name = sheetName
              stdRow.report_type = recognition.reportType
              const dates = extractDateRange(file.name)
              if (dates.start) { stdRow.date_start = dates.start; stdRow.date_end = dates.end }
              // ASIN fallback: from filename if no ASIN in data
              if (!stdRow.asin && !stdRow.child_asin && !stdRow.parent_asin) {
                const fnAsin = file.name.match(/B0[A-Z0-9]{8}/)
                if (fnAsin && recognition.reportType?.startsWith('Business_')) {
                  stdRow.child_asin = fnAsin[0]
                } else if (fnAsin) {
                  stdRow.asin = fnAsin[0]
                }
              }
              // Extract ASIN from search term / target text (for targeting reports)
              const st = stdRow.search_term || stdRow.target_text || ''
              const stAsin = st.match(/B0[A-Z0-9]{8}/)
              if (stAsin && !stdRow.asin && !stdRow.child_asin) {
                stdRow.asin = stAsin[0]
              }
              allRows.push(stdRow)
            }

            // Count
            recognition.asinCount = new Set(allRows.filter(r => r.source_file === file.name).map(r => r.asin || r.child_asin).filter(Boolean)).size
            recognition.keywordCount = new Set(allRows.filter(r => r.source_file === file.name).map(r => r.search_term || r.target_text).filter(Boolean)).size
          }

          sheets.push(recognition)
        }

        recognitions.push({
          filename: file.name,
          fileType: file.name.split('.').pop() || '',
          fileSize: file.size,
          sheets,
          status: 'parsed',
        })
      } catch (err: any) {
        recognitions.push({ filename: file.name, fileType: '', fileSize: file.size, sheets: [], status: 'error', error: err.message })
      }
    }

    setResults(recognitions)
    setAllDataRows(allRows)
    setParsing(false)
    setProgress(`完成！${recognitions.length} 文件, ${allRows.length} 行数据, ${new Set(allRows.map(r => r.report_type)).size} 种报表类型`)

    // Store for other pages
    ;(window as any).__adData = allRows
    ;(window as any).__adResults = recognitions
  }

  const clearAll = () => { setFiles([]); setResults([]); setAllDataRows([]); setProgress('') }

  // Summary stats
  const recogSheets = results.flatMap(r => r.sheets)
  const recogCount = recogSheets.filter(s => s.status === 'recognized').length
  const unrecogCount = recogSheets.filter(s => s.status === 'unrecognized').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">数据上传</h2>
        <p className="text-sm text-gray-500 mt-1">支持 CSV / XLSX / XLS，批量上传亚马逊广告报表、Business Reports、ABA、ERP汇总</p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-orange-500 bg-orange-500/5' : 'border-gray-700 hover:border-gray-500 bg-gray-900'
        }`}
      >
        <Upload className="mx-auto h-10 w-10 text-gray-500 mb-3" />
        <p className="text-gray-400 font-medium">拖拽文件到此处 或 点击选择</p>
        <p className="text-xs text-gray-600 mt-1">单次最多 20 个文件</p>
        <input ref={fileInputRef} type="file" multiple accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                {['文件名','类型','大小','Sheet','报表类型','置信度','行数','状态'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {files.map((f, i) => {
                const result = results[i]
                return result?.sheets.map((s, j) => (
                  <tr key={`${i}-${j}`} className="hover:bg-gray-900/50">
                    {j === 0 && <td className="px-4 py-2 text-white" rowSpan={result.sheets.length}>{f.name}</td>}
                    {j === 0 && <td className="px-4 py-2 text-gray-400 text-xs" rowSpan={result.sheets.length}>{f.name.split('.').pop()}</td>}
                    {j === 0 && <td className="px-4 py-2 text-gray-400 text-xs" rowSpan={result.sheets.length}>{(f.size/1024).toFixed(1)}KB</td>}
                    <td className="px-4 py-2 text-gray-300">{s.sheetName}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'recognized' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{s.reportType}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">{(s.confidence*100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-gray-400">{s.rowCount}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs ${s.status === 'recognized' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {s.status === 'recognized' ? '已识别' : '未识别'}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr key={i}>
                    <td className="px-4 py-2 text-white">{f.name}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{f.name.split('.').pop()}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{(f.size/1024).toFixed(1)}KB</td>
                    <td colSpan={4} className="px-4 py-2 text-gray-600">待解析</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={startParse} disabled={parsing || files.length === 0}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors">
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {parsing ? '解析中...' : '开始解析'}
        </button>
        <button onClick={clearAll}
          className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
          清空
        </button>
        {progress && <span className="self-center text-sm text-gray-400">{progress}</span>}
      </div>

      {/* Debug panel */}
      {allDataRows.length > 0 && (
        <details className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <summary className="px-5 py-3 text-sm text-gray-400 cursor-pointer hover:text-gray-200 select-none">
            调试面板：{allDataRows.length} 行标准化数据，{recogCount} 个已识别 Sheet
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                const blob = new Blob([JSON.stringify({ results, allDataRows: allDataRows.slice(0, 50), fieldMappings: results[0]?.sheets[0]?.columns?.map((c: string) => ({ original: c, ...(mapAllFields([c])[0] || {}) })) || [] }, null, 2)], { type: 'application/json' })
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'debug_pipeline.json'; a.click()
              }}
              className="ml-4 text-xs text-orange-400 hover:text-orange-300 underline">下载调试JSON</button>
          </summary>
          <div className="px-5 pb-4 space-y-3 border-t border-gray-800 pt-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">报表识别结果</p>
              <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono">
                {results.slice(0, 10).map((r, i) => r.sheets.map((s, j) => (
                  <div key={`${i}-${j}`} className="flex gap-3 text-gray-500">
                    <span className="text-gray-400">{r.filename}</span>
                    <span className={s.status === 'recognized' ? 'text-green-400' : 'text-yellow-400'}>{s.reportType}</span>
                    <span>{(s.confidence*100).toFixed(0)}%</span>
                    <span className="text-gray-600">{s.matchedReason}</span>
                  </div>
                )))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">字段映射样例（首个Sheet）</p>
              <div className="max-h-32 overflow-y-auto text-xs font-mono text-gray-500">
                {(() => { const m = results[0]?.sheets[0]?.columns?.slice(0, 15) || []; return m.map((c: string) => { const r = mapAllFields([c])[0]; return <div key={c} className="flex gap-3"><span>{c}</span><span>→</span><span className={r?.inCalculation ? 'text-green-400' : 'text-red-400'}>{r?.standardField || '未识别'}</span><span className="text-gray-600">{(r?.confidence*100).toFixed(0)}%</span></div> }) })()}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">标准化数据样例（前3行）</p>
              <pre className="text-[10px] font-mono text-gray-500 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(allDataRows.slice(0, 3).map(r => ({
                  source: r.source_file, report: r.report_type, campaign: r.campaign_name, search: r.search_term, target: r.target_text,
                  spend: r.spend, sales: r.sales, orders: r.orders, clicks: r.clicks, impressions: r.impressions,
                  acos: r.acos, ctr: r.ctr, cpc: r.cpc, asin: r.asin || r.child_asin
                })), null, 2)}
              </pre>
            </div>
          </div>
        </details>
      )}

      {/* Stats after parsing */}
      {allDataRows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: '总文件', value: results.length },
            { label: '已识别Sheet', value: recogCount },
            { label: '未识别Sheet', value: unrecogCount },
            { label: '数据行', value: allDataRows.length },
            { label: 'ASIN数', value: new Set(allDataRows.map(r => r.asin || r.child_asin).filter(Boolean)).size },
            { label: '报表类型', value: new Set(allDataRows.map(r => r.report_type).filter(Boolean)).size },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
