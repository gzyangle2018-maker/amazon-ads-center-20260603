import { useState } from 'react'
import { Cpu, Loader2, Zap, Key, Shield, Copy, Check } from 'lucide-react'

const PROVIDERS = [
  { id: 'custom', name: '自定义', url: '', model: '', icon: '⚙️' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', icon: '🔵' },
  { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', icon: '🤖' },
  { id: 'qwen', name: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', icon: '🟣' },
  { id: 'moonshot', name: 'Moonshot', url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', icon: '🌙' },
  { id: 'zhipu', name: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', icon: '🧠' },
]

// Simulated operator accounts
const MOCK_OPERATORS = [
  { id: 1, name: '运营A', token: '', allocated: false },
  { id: 2, name: '运营B', token: '', allocated: false },
]

export default function LLMSettings() {
  const [provider, setProvider] = useState(() => localStorage.getItem('llm_provider') || 'custom')
  const [url, setUrl] = useState(() => localStorage.getItem('llm_url') || '')
  const [key, setKey] = useState(() => localStorage.getItem('llm_key') || '')
  const [model, setModel] = useState(() => localStorage.getItem('llm_model') || '')
  const [temp, setTemp] = useState('0.3')
  const [maxTokens, setMaxTokens] = useState('4000')
  const [enabled, setEnabled] = useState(true)
  const [testResult, setTestResult] = useState<'idle'|'testing'|'success'|'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [testDetail, setTestDetail] = useState('')
  const [operators, setOperators] = useState(MOCK_OPERATORS)
  const [copiedId, setCopiedId] = useState<number|null>(null)

  const selectProvider = (pid: string) => {
    setProvider(pid); localStorage.setItem('llm_provider', pid)
    const p = PROVIDERS.find(x => x.id === pid)
    if (p) { setUrl(p.url); setModel(p.model); localStorage.setItem('llm_url', p.url); localStorage.setItem('llm_model', p.model) }
  }

  const testConnection = async () => {
    if (!key) { setTestResult('fail'); setTestMsg('❌ 请先输入 API Key'); return }
    if (!url) { setTestResult('fail'); setTestMsg('❌ 请先输入 Base URL'); return }
    setTestResult('testing'); setTestDetail(''); setTestMsg('⏳ 检测中...')

    const fullUrl = url.endsWith('/chat/completions') ? url : url.replace(/\/$/, '') + '/chat/completions'
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 25000)
      const resp = await fetch('https://amazon-ads-center-api.gzyangle2018.workers.dev/api/llm/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_base_url: fullUrl, api_key: key, model: model || 'gpt-4o-mini', auth_type: 'bearer' }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const text = await resp.text()
      let data: any = {}; try { data = JSON.parse(text) } catch { data = { raw: text } }
      if (data.success) { setTestResult('success'); setTestMsg(`✅ 连接成功`); setTestDetail(data.url_used || fullUrl) }
      else { setTestResult('fail'); setTestMsg(data.error || '连接失败'); setTestDetail(data.url_used || fullUrl) }
    } catch (e: any) {
      setTestResult('fail'); setTestMsg(e.name === 'AbortError' ? '❌ 超时 (25s)' : `❌ ${e.message}`)
    }
  }

  const allocateToken = (opId: number) => {
    const updated = operators.map(o => o.id === opId ? { ...o, token: key.slice(0,8)+'...'+key.slice(-4), allocated: true } : o)
    setOperators(updated)
  }

  const copyToken = (opId: number, token: string) => {
    navigator.clipboard.writeText(token); setCopiedId(opId); setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">LLM API 设置</h2>
        <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">仅管理员</span>
      </div>

      {/* Provider selector */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">选择 API 提供商</h3>
        <div className="grid grid-cols-3 gap-2">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => selectProvider(p.id)}
              className={`text-left rounded-lg border px-3 py-2 text-xs transition-all ${
                provider === p.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}>
              <span className="mr-1">{p.icon}</span>{p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Config */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Base URL *</label>
          <input value={url} onChange={e => { setUrl(e.target.value); localStorage.setItem('llm_url', e.target.value) }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
            placeholder="https://your-api.com/v1" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Key *</label>
          <input type="password" value={key} onChange={e => { setKey(e.target.value); localStorage.setItem('llm_key', e.target.value) }}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
            placeholder="sk-..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Model</label>
            <input value={model} onChange={e => { setModel(e.target.value); localStorage.setItem('llm_model', e.target.value) }}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
              placeholder="gpt-4o-mini" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Temperature</label>
            <input value={temp} onChange={e => setTemp(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500" /><span className="text-xs text-gray-400">启用 LLM</span></label>
        </div>

        <div className="flex gap-3 items-center">
          <button onClick={testConnection} disabled={testResult === 'testing' || !key || !url}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40">
            {testResult === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}测试连接
          </button>
          {testResult === 'success' && <span className="text-sm text-green-400">✅ 连接成功</span>}
          {testResult === 'fail' && <span className="text-sm text-red-400">{testMsg}</span>}
        </div>
        {testDetail && <div className="text-[10px] text-gray-600 font-mono">{testDetail}</div>}
      </div>

      {/* Token allocation to operators */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">分配 Token 给运营子账号</h3>
        <div className="space-y-2">
          {operators.map(op => (
            <div key={op.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3">
              <div>
                <span className="text-sm text-gray-300">{op.name}</span>
                {op.token && <span className="ml-2 text-[10px] text-gray-500 font-mono">{op.token}</span>}
              </div>
              <div className="flex gap-2">
                {op.token ? (
                  <button onClick={() => copyToken(op.id, op.token)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700">
                    {copiedId === op.id ? <><Check className="h-3 w-3"/> 已复制</> : <><Copy className="h-3 w-3"/> 复制</>}
                  </button>
                ) : (
                  <button onClick={() => allocateToken(op.id)} disabled={!key}
                    className="text-[10px] px-2 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-30">
                    分配 Token
                  </button>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded ${op.allocated ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  {op.allocated ? '已分配' : '未分配'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
