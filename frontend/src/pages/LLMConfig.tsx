import { useEffect, useState } from 'react'
import {
  Brain,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  Globe,
  Key,
  Cpu,
} from 'lucide-react'
import { fetchLLMPresets, type LLMPreset } from '../services/api'
import { cn } from '../lib/utils'

export default function LLMConfig() {
  const [presets, setPresets] = useState<LLMPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState('deepseek-chat')
  const [apiKey, setApiKey] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [model, setModel] = useState('deepseek-chat')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 加载已保存的配置
    const savedModel = localStorage.getItem('llm_model') || 'deepseek-chat'
    const savedKey = localStorage.getItem('llm_api_key') || ''
    const savedUrl = localStorage.getItem('llm_api_base_url') || ''

    setModel(savedModel)
    setSelectedPreset(savedModel)
    setApiKey(savedKey)
    setApiBaseUrl(savedUrl)

    fetchLLMPresets()
      .then(setPresets)
      .catch(() => {
        // 使用内置预设作为fallback
        setPresets([
          { model: 'deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', base_url: 'https://api.deepseek.com/v1' },
          { model: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', base_url: 'https://api.deepseek.com/v1' },
          { model: 'qwen-plus', name: '通义千问 Plus', provider: '阿里云', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
          { model: 'qwen-max', name: '通义千问 Max', provider: '阿里云', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
          { model: 'moonshot-v1-8k', name: 'Moonshot 8K', provider: '月之暗面', base_url: 'https://api.moonshot.cn/v1' },
          { model: 'glm-4', name: '智谱 GLM-4', provider: '智谱AI', base_url: 'https://open.bigmodel.cn/api/paas/v4' },
          { model: 'glm-4-flash', name: '智谱 GLM-4 Flash', provider: '智谱AI', base_url: 'https://open.bigmodel.cn/api/paas/v4' },
          { model: 'baichuan4', name: '百川 Baichuan4', provider: '百川智能', base_url: 'https://api.baichuan-ai.com/v1' },
          { model: 'hunyuan-lite', name: '混元 Lite', provider: '腾讯云', base_url: 'https://api.hunyuan.cloud.tencent.com/v1' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePresetSelect = (preset: LLMPreset) => {
    setSelectedPreset(preset.model)
    setModel(preset.model)
    setApiBaseUrl(preset.base_url)
  }

  const handleSave = () => {
    localStorage.setItem('llm_api_key', apiKey)
    localStorage.setItem('llm_api_base_url', apiBaseUrl)
    localStorage.setItem('llm_model', model)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Brain className="h-7 w-7 text-amazon-500" />
          LLM 模型配置
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          配置国内大模型 API，用于广告智能诊断分析
        </p>
      </div>

      {/* Preset selection */}
      <div className="rounded-2xl border bg-white p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-amazon-500" />
          选择模型预设
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.model}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                  selectedPreset === preset.model
                    ? 'border-amazon-500 bg-amazon-50 ring-1 ring-amazon-500'
                    : 'border-gray-200 bg-white hover:border-amazon-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{preset.name}</p>
                  {selectedPreset === preset.model && (
                    <CheckCircle2 className="h-5 w-5 text-amazon-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{preset.provider}</p>
                <p className="mt-2 text-xs text-gray-400 font-mono truncate">{preset.model}</p>
              </button>
            ))}

            {/* Custom option */}
            <button
              onClick={() => {
                setSelectedPreset('custom')
                setApiBaseUrl('')
                setModel('')
              }}
              className={cn(
                'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                selectedPreset === 'custom'
                  ? 'border-amazon-500 bg-amazon-50 ring-1 ring-amazon-500'
                  : 'border-dashed border-gray-300 bg-white hover:border-amazon-300'
              )}
            >
              <p className="font-semibold text-gray-900">自定义</p>
              <p className="mt-1 text-xs text-gray-500">手动配置 API</p>
              <p className="mt-2 text-xs text-gray-400">任意 OpenAI 兼容接口</p>
            </button>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="rounded-2xl border bg-white p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-amazon-500" />
          API 配置
        </h3>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amazon-500 focus:outline-none focus:ring-1 focus:ring-amazon-500"
            />
            <p className="mt-1 text-xs text-gray-400">系统会自动拼接 /chat/completions</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amazon-500 focus:outline-none focus:ring-1 focus:ring-amazon-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              API Key 仅保存在浏览器本地，不会上传到服务器
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型名称
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="deepseek-chat"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amazon-500 focus:outline-none focus:ring-1 focus:ring-amazon-500"
            />
          </div>

          <button
            onClick={handleSave}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors',
              saved
                ? 'bg-green-600'
                : 'bg-amazon-500 hover:bg-amazon-600'
            )}
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          支持的国内大模型
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-blue-800">
          <div>• DeepSeek V3 / R1 — api.deepseek.com</div>
          <div>• 通义千问 (Qwen) — dashscope.aliyuncs.com</div>
          <div>• Moonshot (月之暗面) — api.moonshot.cn</div>
          <div>• 智谱 GLM-4 — open.bigmodel.cn</div>
          <div>• 百川 Baichuan4 — api.baichuan-ai.com</div>
          <div>• 腾讯混元 — api.hunyuan.cloud.tencent.com</div>
          <div>• 零一万物 Yi — api.lingyiwanwu.com</div>
          <div>• Dataler 中转 — dataler.com/v1</div>
        </div>
        <p className="mt-4 text-xs text-blue-600">
          以上模型均支持 OpenAI 兼容接口，选择预设后自动填充 API 地址。只需提供 API Key 即可使用。
        </p>
      </div>
    </div>
  )
}
