# CheckinHub Implementation Plan

> **架构**：FastAPI + APScheduler + SQLite + React + Docker
> **目标**：MVP 可运行，支持 up.x666.me 示例站点

---

## 📁 项目结构

```
/
  backend/
    app/
      main.py
      api/routers/          # health, sites, runs, har, auth
      core/                 # config, logging, security
      db/                   # models, session
      services/             # flow_engine, scheduler, worker, har_parser, credential_manager, notifier
      schemas/              # site, run, har, auth
      utils/                # templating, extraction, conditions, redaction
    tests/
  frontend/
    src/
      pages/                # Dashboard, SiteEditor, HarImport, RunHistory
      components/           # SiteTable, FlowEditor, ScheduleForm, AuthForm
      api/                  # client, sites, runs, har
  docker/
    Dockerfile
  docker-compose.yml
```

---

## 🏗️ 核心模块

### 1. API Server (FastAPI)
- REST API：Sites CRUD、Runs 查询、HAR 解析、手动执行
- 静态文件托管：React 构建产物

### 2. Flow Engine
- 多步骤 HTTP 请求执行
- 条件判断（simpleeval）
- 变量提取（JSON path）
- Expect 验证（状态码/JSON/正则）
- 日志脱敏

### 3. Scheduler (APScheduler)
- DailyAfter + Cron + jitter
- 每日去重
- 启动时从 DB 重建任务

### 4. Worker
- 执行站点任务
- 创建 Run 记录
- Auth-fail 检测 → 自动暂停站点

### 5. HAR Parser
- 解析 HAR JSON
- 过滤静态资源/埋点
- 生成 Flow 配置

### 6. Credential Manager
- AES-GCM 加密/解密
- 环境变量引用
- 日志脱敏（Authorization/Cookie）

### 7. Notifier (Webhook)
- 失败/AUTH_FAILED 通知
- 结构化事件载荷

---

## 💾 数据模型

### Site
```python
id: UUID
name: str
enabled: bool
paused: bool              # Auth-fail 自动暂停
tags: JSON
base_url: str | null
auth: JSON                # Bearer/Cookie/Headers
flow: JSON                # 步骤列表
schedule: JSON            # DailyAfter/Cron/jitter
last_run_at: datetime
next_run_at: datetime
last_run_status: str
```

### Run
```python
id: UUID
site_id: UUID
status: str               # SUCCESS/FAILED/SKIPPED/RUNNING/AUTH_FAILED
started_at: datetime
finished_at: datetime
summary: str
steps: JSON               # 每步详情
auth_failed: bool
```

### Secret
```python
id: UUID
site_id: UUID
key_name: str
ciphertext: str           # AES-GCM 加密
nonce: str
```

---

## 🔄 Flow Engine 执行逻辑

1. **初始化上下文**：从 auth 解析凭证，初始化变量
2. **逐步执行**：
   - 评估 `condition`（false → SKIPPED，停止）
   - 渲染模板（`${var}` 替换）
   - 执行 HTTP 请求（httpx）
   - 脱敏日志
   - 验证 `expect`（失败 → FAILED，停止）
   - 提取变量到上下文
3. **Auth-fail 处理**：
   - 检测 401/403 或 expect auth_fail
   - 标记 AUTH_FAILED
   - 暂停站点
   - 发送通知
4. **全部通过** → SUCCESS

---

## 🚀 API 端点

### Health
- `GET /api/health`

### Sites
- `GET /api/sites`
- `POST /api/sites`
- `GET /api/sites/{id}`
- `PUT /api/sites/{id}`
- `DELETE /api/sites/{id}`
- `POST /api/sites/{id}/run`
- `POST /api/sites/{id}/pause`
- `POST /api/sites/{id}/resume`

### Runs
- `GET /api/sites/{id}/runs`
- `GET /api/runs/{runId}`

### HAR
- `POST /api/har/parse`
- `POST /api/har/generate-flow`

---

## 🐳 Docker 部署

### Dockerfile（多阶段构建）
1. **backend**：安装 Python 依赖
2. **frontend**：构建 React 应用
3. **final**：合并 backend + frontend 静态文件

### docker-compose.yml
```yaml
services:
  checkinhub:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ADMIN_TOKEN=change-me
      - ENCRYPTION_KEY=change-me-32-bytes
      - WEBHOOK_URL=
    volumes:
      - ./data:/app/backend/data
```

---

## 📦 依赖

### Python
- fastapi, uvicorn, sqlmodel, aiosqlite
- apscheduler, httpx, cryptography
- simpleeval, pydantic

### Frontend
- react, react-dom, vite
- axios, react-router

---

## 📅 实施计划（M1-M3）

### M1：核心后端 + Flow Engine + Scheduler（1-2 天）
1. **项目骨架 + Health 端点**
   - 创建 FastAPI 应用
   - 实现 `/api/health`
   - 编写测试

2. **数据模型 + DB Session**
   - 定义 Site/Run/Secret 模型
   - SQLite 会话管理
   - 测试 CRUD

3. **Flow Engine 核心**
   - 条件评估（simpleeval）
   - 变量提取（JSON path）
   - Expect 验证
   - HTTP 请求执行（httpx）

4. **Scheduler + Worker 集成**
   - APScheduler 初始化
   - DailyAfter + Cron + jitter
   - Worker 创建 Run 记录

### M2：API + HAR + React UI（2-4 天）
5. **Sites/Runs API**
   - CRUD 端点
   - Run Now 端点
   - 测试

6. **HAR Parser**
   - 解析 HAR JSON
   - 过滤静态资源/埋点
   - 生成 Flow
   - API 端点

7. **React UI**
   - Dashboard（站点列表）
   - SiteEditor（编辑站点）
   - HarImport（导入 HAR）
   - RunHistory（执行历史）

### M3：安全 + 通知（1-2 天）
8. **凭证加密 + 脱敏**
   - AES-GCM 加密/解密
   - 日志脱敏（Authorization/Cookie）
   - 集成到 Flow Engine

9. **Webhook 通知 + Auth-fail 暂停**
   - Webhook 发送
   - AUTH_FAILED 检测
   - 自动暂停站点
   - 测试

---

## ✅ 验收标准

1. ✅ Docker 一键启动：`docker compose up -d`
2. ✅ 新增站点并配置两步 Flow
3. ✅ up.x666.me 示例：
   - 导入 HAR 或手动配置 Bearer token
   - 执行 status → 基于 can_spin 决定是否执行 spin
   - 查看执行记录（message 等提取结果）
4. ✅ 定时执行：每天 08:00 之后执行一次
5. ✅ 日志完整：步骤明细（状态码/耗时/摘要）
6. ✅ 通知可用：失败必通知
7. ✅ 随机延迟：DailyAfter 窗口内随机执行
8. ✅ Auth-fail 处理：401/403 → 通知 + 暂停站点
9. ✅ HAR 智能过滤：静态资源/埋点默认隐藏，保留 User-Agent

---

## 🔑 关键技术决策

- **单服务 MVP**：简化 Docker 部署，降低运维成本
- **APScheduler 进程内**：无需 Redis，直接支持 DailyAfter/Cron
- **JSON 字段**：flow/auth/schedule 存 JSON，快速迭代
- **simpleeval**：安全表达式评估，避免代码执行
- **AES-GCM**：认证加密，保护凭证

---

**计划完成！准备进入执行阶段。**
