# LY 小精品数据总控分析官

面向亚马逊小精品运营团队的数据决策中台。把每日、每周、每月的亚马逊运营数据，转化为运营可执行任务、广告调整建议、Listing 优化任务、作图任务、视频任务、库存任务、清货/二次激活任务。

## 核心思路

```
数据 → 异常 → 归因 → 决策 → 任务 → 证据 → 审计 → 复盘
```

不是普通报表工具，是运营决策中台。所有页面都围绕"发现问题、判断优先级、分发任务、执行审计、沉淀复盘"设计。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS（深色科技风） |
| 组件 | 自定义组件库（shadcn/ui 风格） |
| 图标 | Lucide React |
| 状态管理 | Zustand |
| 路由 | React Router v6（Hash Router） |
| CSV解析 | PapaParse |
| 部署 | Cloudflare Pages |

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:5173

## 构建

```bash
npm run build
```

构建产物目录：`dist`

## Cloudflare Pages 部署

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## 项目结构

```
src/
  main.tsx                  # 入口
  App.tsx                   # 路由配置
  store/index.ts            # Zustand 全局状态
  types/index.ts            # 所有 TypeScript 类型定义
  routes/
    Dashboard.tsx            # 总控首页
    DailyScan.tsx            # 每日扫描
    WeeklyDiagnosis.tsx      # 每周诊断
    MonthlyGrading.tsx       # 每月分级
    AsinDetail.tsx           # ASIN 详情
    AdAttributionAudit.tsx   # 广告归属审计
    TaskCenter.tsx           # 任务中心
    AgentHub.tsx             # Agent 路由
    DataUpload.tsx           # 数据投喂
    ModelConfig.tsx          # 模型配置
    PermissionManagement.tsx # 权限管理
    Settings.tsx             # 系统设置
  components/
    layout/
      AppLayout.tsx          # 主布局
      Sidebar.tsx            # 左侧导航
      Topbar.tsx             # 顶部状态栏
    common/
      KpiCard.tsx            # KPI 卡片
      DataTable.tsx          # 数据表格（搜索/排序/筛选）
      PriorityBadge.tsx      # P0-P3 优先级标签
      ConfidenceBadge.tsx    # A-D 归属置信度标签
      StatusBadge.tsx        # 任务状态标签
      FileUploadBox.tsx      # 文件上传组件
      AgentCard.tsx          # Agent 卡片
      ModelConfigCard.tsx    # 模型配置卡片
      AsinDrawer.tsx         # ASIN 详情抽屉
  data/
    mockAsins.ts             # 20 个 ASIN 模拟数据
    mockTasks.ts             # 32 条任务模拟数据
    mockAgents.ts            # 13 个 Agent 配置
    mockModels.ts            # 9 个模型配置
    mockDailyIssues.ts       # 15 条每日异常
    mockWeeklyPlans.ts       # 8 条每周诊断
    mockMonthlyGrades.ts     # 14 条每月分级
  lib/
    utils.ts                 # 通用工具函数
    aiRouter.ts              # AI Router 前端占位
    fileParser.ts            # CSV/XLSX 解析
    attribution.ts           # 广告归属判断逻辑
```

## 后续 API 接入

```
React 前端 (Cloudflare Pages)
  ↓
Cloudflare Workers API
  ↓
Datater 中转层
  ↓
国外 LLM: GPT / Claude / Gemini
国内 LLM: DeepSeek / Qwen / Kimi / GLM
  ↓
返回结构化 JSON
  ↓
写入 D1 / 展示到前端 / 生成任务
```

## 模型路由说明

- **高价值复杂分析**: GPT / Claude / Gemini
- **大批量低成本分析**: DeepSeek / Qwen / Kimi
- **中文运营任务**: DeepSeek / Qwen / Kimi
- **英文 Listing / 广告语**: GPT / Claude / Gemini
- **多模态图片理解**: Gemini / GPT
- **强推理和复杂归因**: Claude / GPT

## 数据安全说明

- 第一版是前端 MVP，**不保存真实数据，不调用真实模型**
- API Key **不应放在前端代码中**
- 正式上线时 API Key 必须放在 Cloudflare Workers 环境变量中
- 所有高风险广告动作必须人工审批后才能执行
- C/D 级 ASIN 归属的广告数据禁止生成强执行动作

## 当前版本限制

✅ 已实现:
- 12 个页面 + 完整导航
- 角色权限切换（管理员/运营/助理/美工/安全）
- 20 个 ASIN 模拟数据
- 32 条任务模拟数据
- 13 个 Agent 配置
- CSV 文件上传预览
- 广告归属审计逻辑
- AI Router 前端占位

🔜 待实现:
- 真实 API 接入 (Cloudflare Workers)
- D1 数据库读写
- R2 文件存储
- 用户登录/认证
- 真实 LLM 调用
- Bulk 操作文件生成
