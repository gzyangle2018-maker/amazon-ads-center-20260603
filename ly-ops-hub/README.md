# LY-OPS Hub

> **Leo Young 的亚马逊运营 AI 内部工作台** — Phase 2

## 项目概述

LY-OPS Hub 是亚马逊运营 AI Agent 的内部工作台 / Agent Hub。Phase 2 实现了登录系统、角色权限 (RBAC)、iframe 工作区、AI Chat、使用 BI、Agent 资产登记。

### 技术栈

- **框架**: Vite + React 18 + TypeScript
- **样式**: Tailwind CSS（深色科技风）
- **路由**: React Router v6
- **部署**: Cloudflare Pages（免费）

---

## 本地启动

```bash
git clone <your-repo-url>
cd ly-ops-hub
npm install
cp .env.example .env  # 可选
npm run dev
```

访问 `http://localhost:5173`。

---

## 登录账号

| 用户名 | 密码 | 角色 | 说明 |
|---|---|---|---|
| `yangle` | `leo0417` | admin | 管理员 · 全部权限 |
| `assistant01` | `123456` | assistant | 助理 · 店铺安全/申诉 |
| `ops_assistant01` | `123456` | ops_assistant | 运营助理 · 转化/站外 |
| `operator01` | `123456` | operator | 运营 · 投流/广告 |
| `designer01` | `123456` | designer | 美工 · AI 生图/视频 |

---

## 角色权限说明

| 能力 | admin | 普通成员 |
|---|---|---|
| 查看所有 Agent | ✅ | ❌ 只看分配 & 已上线 |
| 查看 developing/planned Agent | ✅ | ❌ |
| 查看 GitHub / URL / 部署信息 | ✅ | ❌ |
| LLM 配置 | ✅ | ❌ |
| 权限管理 | ✅ | ❌ |
| 使用 BI | ✅ | ❌ |
| AI Chat | ✅ | 管理员控制 |
| 文档 | ✅ | ❌ |
| 系统配置 | ✅ | ❌ |

---

## 如何新增 Agent

编辑 `src/config/agents.ts`，追加对象：

```ts
{
  id: "my-agent",
  name: "我的 Agent",
  category: "data_analysis",
  version: "v1",
  description: "简要描述",
  status: "planned",
  entryType: "placeholder",
  embedMode: "iframe",
  url: "https://my-agent.pages.dev",
  features: [
    { id: "feature1", name: "功能1", enabledByDefault: true },
  ],
}
```

同时在 `src/config/deployments.ts` 登记部署信息，
在 `src/config/embedConfigs.ts` 登记内嵌配置。

## 如何给用户分配 Agent

1. 管理员登录后访问 `/admin/permissions`
2. 左侧选择用户
3. 右侧勾选要分配的 Agent
4. 也可点击"按角色批量分配"

分配数据保存于 localStorage（后续迁移至 Supabase）。

## 如何配置 LLM Provider

编辑 `src/config/llmProviders.ts`。每个 Provider 包含：

| 字段 | 说明 |
|---|---|
| `id` | 唯一标识 |
| `name` | 显示名称 |
| `type` | Provider 类型 |
| `protocol` | 协议：openai-compatible / openai-responses / anthropic-messages / gemini-native |
| `baseUrl` | API 地址 |
| `apiKeyEnvName` | 环境变量名（不存真实 Key） |
| `defaultModel` | 默认模型 |
| `models` | 可用模型列表 |
| `region` | global / china / relay / local |

## 为什么不能在前端放 API Key

1. 前端代码在浏览器中完全可见 — 任何人都能通过 DevTools 查看
2. 将 Key 写死在前端等于公开发布
3. 当前通过 `apiKeyEnvName` 引用环境变量占位
4. 后续通过 Cloudflare Workers / Supabase Edge Functions 代理 LLM 调用

## iframe 内嵌失败的原因和解决

- 子页面设置了 `X-Frame-Options` 或 `Content-Security-Policy: frame-ancestors` 禁止嵌入
- 解决方法：移除或修改子页面的 header 设置
- 或在 Cloudflare Workers 中做反向代理去掉这些 header
- 系统在 iframe 加载失败时显示 fallback 提示

## 后续扩展路线

### Phase 3 — 后端接入
- Supabase Auth（登录/注册/RLS）
- Supabase PostgreSQL（Agent 配置和运行记录）
- Cloudflare Workers API Gateway（LLM 调用代理）
- 环境变量注入真实 API Key

### Phase 4 — Agent 运行时
- Agent 编排引擎
- 定时任务调度
- 文件管理
- 全链路日志

## Cloudflare Pages 部署

1. 推送至 GitHub
2. Cloudflare Dashboard → Pages → 连接 Git
3. Build: `npm run build` · Output: `dist`

## 新增子 Agent 必填登记项

```
agentId | name | category | status | url
githubUrl | deployPlatform | projectName
branch | buildCommand | outputDirectory
embedMode | embedAllowed | allowedRoles | features
```

## 安全提醒

⚠️ 当前前端权限仅为 Phase 2 演示方案。真实生产环境必须配合后端权限校验（Supabase RLS / Cloudflare Workers 中间件）。localStorage 只是临时方案，后续替换为数据库。

## 许可证

MIT
