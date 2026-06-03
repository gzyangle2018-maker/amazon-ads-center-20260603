# Amazon Ads Center - 亚马逊广告执行中枢

> 桌面 EXE + Web 端 + 12层规则引擎 + 国内大模型LLM诊断

## 项目结构

```
amazon_ads_center/
├── desktop_client/           # Python PySide6 桌面端 EXE
│   ├── main.py               # 入口
│   └── app/                  # UI + 核心引擎
│
├── backend/                  # FastAPI 后端（Python）
│   ├── main.py               # API 入口
│   ├── app/
│   │   ├── routers/          # auth / uploads / analysis / reports
│   │   └── services/         # 核心分析管线
│   │       ├── parser_engine.py      # CSV/XLSX解析 + 编码检测
│   │       ├── report_classifier.py  # 14种报表识别
│   │       ├── field_mapper.py       # 字段标准化映射
│   │       ├── metrics_engine.py     # 指标计算
│   │       ├── rule_engine.py        # 12层规则引擎
│   │       ├── llm_client.py         # LLM调用(国内大模型)
│   │       ├── excel_writer.py       # 14 Sheet 美化导出
│   │       └── analysis_service.py   # 一键分析管线编排
│   └── requirements.txt
│
├── frontend/                 # React + Vite 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Upload.tsx          # 上传 & 一键分析
│   │   │   ├── LLMConfig.tsx       # 国内大模型配置
│   │   │   ├── Dashboard.tsx       # 仪表盘
│   │   │   └── Campaigns.tsx       # 广告活动
│   │   ├── components/Layout.tsx
│   │   └── services/api.ts
│   └── package.json
│
├── admin_web/               # React + Vite 管理员后台
├── docker-compose.yml       # 一键部署
├── Dockerfile               # 后端 Docker 镜像
└── README.md
```

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 LLM_API_KEY

# 2. 一键启动
docker-compose up -d

# 3. 访问
# 前端: http://localhost:3000
# 后端 API: http://localhost:8000/docs
```

### 方式二：本地开发

**后端：**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 配置 LLM API Key
uvicorn main:app --reload --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

## 🤖 国内大模型配置

默认使用 **DeepSeek V3**（api.deepseek.com），可在前端 LLM配置页切换：

| 模型 | 提供商 | API 地址 |
|------|--------|----------|
| DeepSeek V3 / R1 | DeepSeek | api.deepseek.com/v1 |
| 通义千问 Qwen | 阿里云 | dashscope.aliyuncs.com/compatible-mode/v1 |
| Moonshot | 月之暗面 | api.moonshot.cn/v1 |
| GLM-4 | 智谱AI | open.bigmodel.cn/api/paas/v4 |
| Baichuan4 | 百川智能 | api.baichuan-ai.com/v1 |
| 混元 | 腾讯云 | api.hunyuan.cloud.tencent.com/v1 |

所有模型均支持 OpenAI 兼容接口，只需填写 API Key 即可。

## 📊 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/analysis/run` | 一键分析：上传文件 → 解析 → 规则引擎 → LLM → Excel |
| POST | `/api/analysis/parse-only` | 仅解析文件 |
| POST | `/api/analysis/llm-diagnose` | LLM 诊断 |
| GET | `/api/analysis/llm/presets` | 获取模型预设列表 |
| GET | `/api/analysis/{id}/excel` | 下载 Excel 报告 |
| GET | `/api/analysis/` | 分析记录列表 |
| GET | `/api/analysis/{id}` | 分析详情 |

## 🌐 部署方案

### 方案 A：Docker + VPS
```bash
# 在 VPS 上
git clone <repo>
cd amazon_ads_center
cp backend/.env.example backend/.env
docker-compose up -d
```

### 方案 B：Railway / Render
1. 部署 backend 目录（Python FastAPI）
2. 设置环境变量 `LLM_API_KEY`
3. 部署 frontend（静态站点），设置 `VITE_API_BASE` 指向后端地址

### 方案 C：Cloudflare Pages（前端）+ Railway（后端）
```bash
# 前端
cd frontend
VITE_API_BASE=https://your-backend.railway.app npm run build
npx wrangler pages deploy dist --project-name=amazon-ads-center

# 后端直接在 Railway 上部署 backend/ 目录
```

## 📋 支持的报表类型 (14种)

| 类型 | 说明 |
|------|------|
| SP_Campaign_Report | 商品推广广告活动 |
| SP_Search_Term_Report | 商品推广搜索词 |
| SP_Targeting_Report | 商品推广投放 |
| SB_Campaign_Report | 品牌推广广告活动 |
| SB_Keyword_Report | 品牌推广关键词 |
| SB_Keyword_Placement_Report | 品牌推广关键词广告位 |
| SB_Search_Term_Report | 品牌推广搜索词 |
| ERP_Search_Term_Summary_Report | ERP广告搜索词汇总 |
| ABA_Search_Query_Performance_Report | ABA搜索查询绩效 |
| ABA_Top_Search_Terms_Report | ABA热门搜索词 |
| Business_Report_Child_30D | 业务报告30天子体 |
| Business_Report_Child_7D | 业务报告7天子体 |
| Business_Report_Parent_30D | 业务报告30天父体 |
| Business_Report_Parent_7D | 业务报告7天父体 |
