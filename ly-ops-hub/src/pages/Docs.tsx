// ============================================================
// LY-OPS Hub — Docs (admin only)
// ============================================================

export default function Docs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">📖 项目文档</h1>
        <p className="mt-1 text-sm text-gray-500">LY-OPS Hub 定位、开发与运维指南</p>
      </div>

      <Section title="1. LY-OPS 定位">
        <p>
          <strong>LY-OPS</strong> 是 Leo Young 的亚马逊运营 AI 内部工作台。
          Phase 2 实现登录、角色权限、iframe 工作区、AI Chat、使用 BI。
          所有 Agent 通过 <code>src/config/agents.ts</code> 静态驱动，
          权限通过 <code>src/config/roles.ts</code> + localStorage 管理。
        </p>
      </Section>

      <Section title="2. 登录账号">
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pb-2">用户名</th>
              <th className="pb-2">密码</th>
              <th className="pb-2">角色</th>
              <th className="pb-2">说明</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["yangle", "leo0417", "admin", "我本人 · 全部权限"],
              ["assistant01", "123456", "assistant", "助理 · 店铺安全/申诉"],
              ["ops_assistant01", "123456", "ops_assistant", "运营助理 · 转化/站外"],
              ["operator01", "123456", "operator", "运营 · 投流/广告"],
              ["designer01", "123456", "designer", "美工 · AI 生图/视频"],
            ].map(([u, p, r, d]) => (
              <tr key={u} className="border-t border-white/5">
                <td className="py-2 text-white"><code>{u}</code></td>
                <td className="py-2 text-gray-400"><code>{p}</code></td>
                <td className="py-2 text-gray-400">{r}</td>
                <td className="py-2 text-xs text-gray-500">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="3. 角色权限说明">
        <ul>
          <li><strong>admin</strong>：全部权限。全部 Agent、全部状态、部署信息、GitHub、LLM 配置、权限管理、BI。</li>
          <li><strong>普通成员</strong>：只能看到管理员分配的已上线 Agent。不显示 GitHub/文档/URL/LLM 配置/系统配置。</li>
        </ul>
      </Section>

      <Section title="4. 如何新增 Agent">
        <p>编辑 <code>src/config/agents.ts</code>，追加对象。必填字段：</p>
        <CodeBlock>{`{
  id: "my-agent",
  name: "我的 Agent",
  category: "data_analysis",
  version: "v1",
  description: "简要描述",
  status: "planned",
  entryType: "placeholder",
  embedMode: "iframe",   // 或 "external_url"
  ownerRole: "admin",
  llmRequired: true,
}`}</CodeBlock>
      </Section>

      <Section title="5. 如何给用户分配 Agent">
        <p>管理员登录后访问 <code>/admin/permissions</code>，选择用户后勾选 Agent。分配数据保存在 localStorage。</p>
        <p>也可编辑 <code>src/config/roles.ts</code> 中对应角色的 <code>visibleAgentIds</code>。</p>
      </Section>

      <Section title="6. 如何配置 LLM Provider">
        <p>编辑 <code>src/config/llmProviders.ts</code>。注意 API Key 不能写在前端。</p>
      </Section>

      <Section title="7. 为什么不能在前端放 API Key">
        <ul>
          <li>前端代码在浏览器中完全可见 — 任何人都能查看。</li>
          <li>将 API Key 写死在前端等于公开发布。</li>
          <li>Phase 2 通过 <code>apiKeyEnvName</code> 引用环境变量，真实调用走后端代理。</li>
        </ul>
      </Section>

      <Section title="8. iframe 内嵌失败的原因和解决">
        <ul>
          <li>子页面设置了 <code>X-Frame-Options</code> 或 <code>Content-Security-Policy: frame-ancestors</code> 禁止被嵌入。</li>
          <li>解决方法：在子页面的 Cloudflare Pages / Vercel 设置中移除或修改这些 header。</li>
          <li>或者在 Cloudflare Workers 中做反向代理去掉这些 header。</li>
          <li>当前系统会在 iframe 加载失败时显示 fallback 提示，管理员可选择新窗口打开。</li>
        </ul>
      </Section>

      <Section title="9. 后续扩展路线">
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-white/5 p-4">
            <strong className="text-indigo-400">Phase 3 — 后端接入</strong>
            <ul className="mt-1 list-inside list-disc text-gray-500">
              <li>Supabase Auth · PostgreSQL · Edge Functions</li>
              <li>Cloudflare Workers API Gateway</li>
              <li>环境变量注入真实 API Key</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <strong className="text-indigo-400">Phase 4 — Agent 运行时</strong>
            <ul className="mt-1 list-inside list-disc text-gray-500">
              <li>Agent 编排引擎 · 定时任务 · 文件管理 · 全链路日志</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="10. Cloudflare Pages 部署">
        <ol className="list-inside list-decimal space-y-1">
          <li>推送至 GitHub</li>
          <li>Cloudflare Dashboard → Pages → 连接 Git</li>
          <li>Build: <code>npm run build</code> · Output: <code>dist</code></li>
        </ol>
      </Section>

      <Section title="11. 新增子 Agent 必填登记项">
        <p>在 <code>src/config/agents.ts</code> 和 <code>src/config/deployments.ts</code> 中登记：</p>
        <CodeBlock>{`agentId | name | category | status | url
githubUrl | deployPlatform | projectName
branch | buildCommand | outputDirectory
embedMode | embedAllowed | allowedRoles | features`}</CodeBlock>
        <p>只有完整登记后，权限、内嵌、BI、回滚、故障排查才能正常工作。</p>
      </Section>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
        ⚠️ <strong>安全提醒</strong>：当前前端权限仅为 Phase 2 演示方案。
        真实生产环境必须配合后端权限校验（Supabase RLS / Cloudflare Workers 中间件）。
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-black/50 p-4 text-xs text-gray-300">
      <code>{children}</code>
    </pre>
  );
}
