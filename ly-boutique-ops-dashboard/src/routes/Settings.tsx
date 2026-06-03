import { Wrench, Database, Cloud, Server, Globe, Github, Shield } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">系统设置</h1>
        <p className="text-sm text-text-secondary mt-1">
          系统配置 · 部署信息 · 数据安全说明
        </p>
      </div>

      {/* Deployment info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel-card">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Cloud size={16} /> 部署信息
          </h2>
          <div className="space-y-2 text-xs">
            <SettingRow label="前端托管" value="Cloudflare Pages" />
            <SettingRow label="构建命令" value="npm run build" />
            <SettingRow label="输出目录" value="dist" />
            <SettingRow label="框架" value="Vite + React" />
            <SettingRow label="代码托管" value="GitHub" />
            <SettingRow label="域名" value="boutique.ly-ops.com (预留)" />
          </div>
        </div>

        <div className="panel-card">
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Server size={16} /> 后端架构（后续）
          </h2>
          <div className="space-y-2 text-xs">
            <SettingRow label="API 层" value="Cloudflare Workers" />
            <SettingRow label="数据库" value="Cloudflare D1" />
            <SettingRow label="文件存储" value="Cloudflare R2" />
            <SettingRow label="LLM 中转" value="Datater API" />
            <SettingRow label="前端状态" value="Zustand" />
            <SettingRow label="路由" value="React Router v6" />
          </div>
        </div>
      </div>

      {/* Data security */}
      <div className="panel-card border-accent-yellow/20">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Shield size={16} className="text-accent-yellow" /> 数据安全
        </h2>
        <div className="space-y-3 text-xs text-text-secondary">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-accent-green shrink-0 mt-0.5" />
            <p>API Key <strong className="text-text-primary">不在前端代码中存储</strong>，生产环境使用 Cloudflare Workers 环境变量</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-accent-green shrink-0 mt-0.5" />
            <p>第一版为 <strong className="text-text-primary">前端 MVP</strong>，不保存真实数据，不调用真实模型</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-accent-green shrink-0 mt-0.5" />
            <p>文件上传仅做 <strong className="text-text-primary">本地预览</strong>，不传输到服务器</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-accent-yellow shrink-0 mt-0.5" />
            <p>所有高风险广告动作<strong className="text-accent-yellow">必须人工审批</strong>后才能执行</p>
          </div>
        </div>
      </div>

      {/* Current version limits */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Wrench size={16} /> 当前版本限制
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/8">
            <h3 className="font-semibold text-text-primary mb-1">✅ 已实现</h3>
            <ul className="space-y-1 text-text-secondary">
              <li>12 个页面 + 完整导航</li>
              <li>角色权限切换</li>
              <li>20 个 ASIN 模拟数据</li>
              <li>32 条任务模拟数据</li>
              <li>13 个 Agent 卡片</li>
              <li>9 个模型配置</li>
              <li>CSV 文件上传预览</li>
              <li>广告归属审计逻辑</li>
              <li>AI Router 前端占位</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/8">
            <h3 className="font-semibold text-text-primary mb-1">🔜 待实现</h3>
            <ul className="space-y-1 text-text-secondary">
              <li>真实 API 接入 (Workers)</li>
              <li>D1 数据库读写</li>
              <li>R2 文件存储</li>
              <li>用户登录/认证</li>
              <li>真实 LLM 调用</li>
              <li>Bulk 操作文件生成</li>
              <li>数据自动同步</li>
              <li>邮件/通知推送</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3">技术栈</h2>
        <div className="flex flex-wrap gap-2">
          {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'React Router v6', 'Lucide React', 'PapaParse', 'xlsx', 'Cloudflare Pages'].map((tech) => (
            <span key={tech} className="chip bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 text-xs">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-medium font-mono">{value}</span>
    </div>
  );
}
