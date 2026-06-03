import { useState } from "react";

const FUTURE_MODULES = [
  { id: "supabase-auth", name: "Supabase 登录", icon: "🔐", desc: "基于 Supabase Auth 的邮箱/Google/GitHub 登录，支持 RLS。", phase: "Phase 2" },
  { id: "database", name: "数据库", icon: "🗄️", desc: "Supabase PostgreSQL，Agent 运行记录、用户偏好、操作日志。", phase: "Phase 2" },
  { id: "file-storage", name: "文件存储", icon: "📁", desc: "Supabase Storage / R2，Agent 输入输出文件存储。", phase: "Phase 2" },
  { id: "api-gateway", name: "API Gateway", icon: "🔗", desc: "Cloudflare Workers / Supabase Edge Functions，LLM 调用代理。", phase: "Phase 2" },
  { id: "permissions", name: "权限角色", icon: "👥", desc: "admin / assistant / ops_assistant / operator / designer 多角色。", phase: "Phase 3" },
  { id: "task-logs", name: "任务日志", icon: "📝", desc: "Agent 运行全链路日志记录，支持回放和审计。", phase: "Phase 3" },
];

interface SystemConfig {
  enablePublicSignup: boolean;
  allowMemberChat: boolean;
  allowMemberUpload: boolean;
  showDevAgents: boolean;
  defaultLLMProvider: string;
  businessMode: string;
  recordUsage: boolean;
  hideDeployInfo: boolean;
}

const DEFAULT_CONFIG: SystemConfig = {
  enablePublicSignup: false,
  allowMemberChat: true,
  allowMemberUpload: true,
  showDevAgents: false,
  defaultLLMProvider: "dataler",
  businessMode: "fast",
  recordUsage: true,
  hideDeployInfo: true,
};

export default function Settings() {
  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const stored = localStorage.getItem("lyops_system_config");
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const update = (key: keyof SystemConfig, value: unknown) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    localStorage.setItem("lyops_system_config", JSON.stringify(next));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">⚙️ 系统配置</h1>
        <p className="mt-1 text-sm text-gray-500">仅管理员可见</p>
      </div>

      {/* Phase 1 config */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">📋 系统配置项</h2>
        <div className="space-y-3">
          <ToggleRow
            label="启用公开注册"
            desc="Phase 2 生效，当前为 mock 登录"
            checked={config.enablePublicSignup}
            onChange={(v) => update("enablePublicSignup", v)}
          />
          <ToggleRow
            label="允许普通成员使用 AI Chat"
            checked={config.allowMemberChat}
            onChange={(v) => update("allowMemberChat", v)}
          />
          <ToggleRow
            label="允许普通成员上传文件"
            checked={config.allowMemberUpload}
            onChange={(v) => update("allowMemberUpload", v)}
          />
          <ToggleRow
            label="显示开发中 Agent"
            desc="仅 admin 可见，此开关对普通成员无效"
            checked={config.showDevAgents}
            onChange={(v) => update("showDevAgents", v)}
          />
          <ToggleRow
            label="记录 usage logs"
            checked={config.recordUsage}
            onChange={(v) => update("recordUsage", v)}
          />
          <ToggleRow
            label="隐藏部署信息"
            desc="对非管理员隐藏 GitHub、URL、Cloudflare 等"
            checked={config.hideDeployInfo}
            onChange={(v) => update("hideDeployInfo", v)}
          />
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <div>
              <span className="text-sm text-gray-300">默认 LLM Provider</span>
              <p className="text-xs text-gray-600">新 Agent 的默认推理 Provider</p>
            </div>
            <code className="rounded bg-indigo-500/10 px-2 py-1 text-xs text-indigo-400">
              {config.defaultLLMProvider}
            </code>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
            <div>
              <span className="text-sm text-gray-300">默认业务模式</span>
              <p className="text-xs text-gray-600">快速 / 深度 / 文件分析 / 图片分析</p>
            </div>
            <select
              value={config.businessMode}
              onChange={(e) => update("businessMode", e.target.value)}
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
            >
              <option value="fast">⚡ 快速模式</option>
              <option value="deep">🧠 深度模式</option>
              <option value="file">📁 文件分析模式</option>
              <option value="image">🖼️ 图片分析模式</option>
            </select>
          </div>
        </div>
      </section>

      {/* Current status */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">📋 当前运行状态</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            ["认证状态", "Mock (未启用)"],
            ["数据库", "未连接"],
            ["API Gateway", "待部署"],
            ["文件存储", "待配置"],
            ["默认 LLM", config.defaultLLMProvider],
            ["版本", "2.0.0 · Phase 2"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between rounded-lg bg-white/5 px-4 py-3">
              <span className="text-gray-500">{label}</span>
              <span className="rounded bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Future modules */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">🔮 未来预留模块</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_MODULES.map((mod) => (
            <div key={mod.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl">{mod.icon}</div>
              <h3 className="mt-2 font-semibold text-white">{mod.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{mod.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-400">
                {mod.phase}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
      <div>
        <span className="text-sm text-gray-300">{label}</span>
        {desc && <p className="text-xs text-gray-600">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-white/20"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
