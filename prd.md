# 项目 PRD：CheckinHub（可 Docker 部署的多站点自动签到/抽奖平台）

> 目标读者：AI 工程助手 / 开发者  
> 语言：中文  
> 输出目标：基于本文档，AI 可直接实现一个可运行的 MVP（Docker 一键部署），并具备可扩展到更多站点的能力。  
> 当前日期：2026-01-16（America/Los_Angeles）

---

## 1. 背景与目标

### 1.1 背景
用户希望实现一个“多网站自动签到/抽奖”的系统，特点包括：
- **不依赖浏览器是否打开**（服务器/本地常驻进程，定时执行）。
- 后续会不断增加更多网站，要求**新增站点成本低**。
- 需要能处理类似“转盘抽奖”这种页面交互，本质是调用接口（示例：`https://up.x666.me/api/checkin/spin`）。
- 需要能够自动携带/获取签到所需的 **cookie / session / token（例如 Bearer JWT）**。

### 1.2 核心目标（MVP）
1. 提供一个 **Web 管理台**：新增/编辑/删除站点与任务；查看执行日志与结果。
2. 提供一个 **可扩展的“站点定义”机制**：无需改代码或极少改动即可接入新站点。
3. 提供 **定时调度**：支持“每天 08:00 之后执行一次”（或 08:05 固定执行），并支持自定义 Cron。
4. 支持 **HTTP 接口型签到流程**（多步骤 request flow），并能基于响应做条件判断（例如 `can_spin=true` 才执行 `spin`）。
5. 支持 **凭证管理**：cookie / header / bearer token；支持从 HAR 导入或从浏览器复制粘贴；支持凭证加密存储（至少配置级别）。
6. 提供 **Docker 部署**：`docker compose up -d` 一键启动。

### 1.3 非目标（MVP 不做）
- 不自动绕过验证码/滑块/短信等强验证。
- 不提供破解或绕过网站安全机制。
- 不做复杂的浏览器自动化（Playwright）作为 MVP 必需项（可作为后续增强）。

---

## 2. 用户与使用场景

### 2.1 用户画像
- 个人用户/站点运营者：管理多个网站的签到、抽奖、领券等自动化任务。
- 技术用户：能导出 HAR、理解基础 HTTP 概念，愿意在系统里配置请求步骤。

### 2.2 典型场景
1. 用户在浏览器中登录某站点并完成一次签到/抽奖流程 → 导出 HAR → 导入系统 → 设置每天执行。
2. 用户新增一个网站：在管理台创建站点 → 填写多步接口（或导入 HAR）→ 设置条件与成功判定 → 保存并试跑。
3. 用户每天查看结果：成功/失败原因、响应摘要、下一次执行时间。

---

## 3. 需求范围

### 3.1 功能需求（MVP）
#### 3.1.1 站点与任务管理（Web UI）
- 站点列表：名称、启用状态、上次执行时间、下次执行时间、成功率摘要。
- 站点详情页（编辑）：
  - 基本信息：站点名、标签、备注
  - 认证方式（Auth）：`none | cookie_jar | bearer_token | custom_headers`
  - 凭证来源：`manual | har_import`
  - 请求流程（Flow）：步骤列表（见 3.1.2）
  - 调度规则（Schedule）：每日 08:00 之后执行一次 / Cron 表达式 / 手动执行
- 操作：新增、复制站点、删除站点、立即执行（Run Now）、停止（如果支持）

#### 3.1.2 多步骤请求流程（Flow Engine）
每个站点包含 1..N 个步骤（HTTP requests），按顺序执行：
- Step 字段：
  - `name`：步骤名（status/spin 等）
  - `method`：GET/POST/PUT/DELETE
  - `url`：完整 URL 或 `baseUrl + path`
  - `headers`：键值对，可引用变量（例如 `${token}`）
  - `body`：可空；支持 `json` 或 `form` 或 `raw`
  - `timeoutMs`
  - `expect`：成功判定（JSON 字段匹配 / 正则 / HTTP 状态码）
  - `condition`：前置条件（基于上一步或当前响应 JSON 的表达式）
  - `extract`：从响应 JSON/headers 中提取变量（供后续步骤引用）
- 运行语义：
  - 若某步 `condition` 不满足：跳过剩余步骤并标记为 `SKIPPED`（例如 `can_spin=false`）。
  - 若 `expect` 不满足：标记为 `FAILED`，记录失败原因与响应摘要。
  - 全部步骤通过：标记 `SUCCESS`。

#### 3.1.3 凭证管理（Auth & Secrets）
支持至少以下方式：
1. **Bearer Token（JWT）**：管理台手动粘贴；或从 HAR 自动提取 `Authorization: Bearer ...`。
2. **Cookie Jar**：从 HAR 导入 Cookie；或手动粘贴 `Cookie:` 头。
3. **自定义 Headers**：如 `X-CSRF-Token` 等，支持变量引用。
4. 机密存储：
   - MVP：使用服务端 `ENCRYPTION_KEY` 对敏感字段加密后存 DB（AES-GCM）。
   - 或最小化实现：敏感字段仅存 `.env` 或以“引用环境变量名”方式存储（推荐）。

**凭证生命周期（Token Lifecycle，MVP 增强）**
- 明确识别“凭证失效/需重新登录”的情形：
  - 在 `expect` 中增加 `auth_fail` 判定（例如 HTTP 401/403、响应 body 包含 `login required`、`unauthorized` 等）。
- 当触发 `auth_fail`：
  1) 将本次执行标记为 `AUTH_FAILED`（区别于一般 FAILED）；
  2) 发送“凭证已过期/需重新登录”的通知（标题需明确，例如：`Cookie 已过期，请重新登录`）；
  3) **自动暂停该站点**的后续定时任务（避免重复 401 导致封禁/风控）；
  4) 用户更新凭证并保存后，自动解除暂停。



#### 3.1.4 HAR 导入（降低新增站点成本）
- 管理台上传 `.har` 文件（或粘贴 HAR JSON）。
- 系统解析 HAR：
  - 列出请求清单（URL、方法、状态码、时间）
  - 用户勾选参与签到的请求步骤（如 status/spin）
  - 系统自动填充 headers、body、cookies，并生成 Flow
  - 自动检测并提示敏感字段（Authorization、Cookie），允许用户选择“保存为 secret”或“引用 env”
- 支持“转盘类”场景：多请求链路（status→spin）可被一次导入。

**HAR 智能化（MVP 推荐纳入）**
- 智能过滤：默认隐藏静态资源与噪声请求，降低用户筛选成本。
  - 静态后缀：`.png .jpg .jpeg .gif .svg .webp .css .js .map .woff .woff2 .ttf` 等
  - 常见埋点/统计域名（可维护黑名单）：`google-analytics`, `googletagmanager`, `doubleclick`, `sentry`, `datadog` 等
- 默认高亮 **POST/PUT/PATCH/DELETE** 请求（签到/抽奖多为写操作）。
- **User-Agent 保留策略**：
  - 导入 HAR 时应优先保留原请求的 `User-Agent`；除非用户在站点/全局配置中显式覆盖。



#### 3.1.5 定时调度（Scheduler）
- 每站点可设置：
  - `DailyAfter`：每天本地时区 08:00 之后执行一次（默认 08:05）
  - `Cron`：标准 cron 表达式（可选）
- 去重：同一天只执行一次（DailyAfter 模式）。
- 失败重试（MVP 简版）：可配置 `maxRetries` 与 `retryDelaySeconds`。

#### 3.1.6 日志与通知
- 日志分级：INFO/WARN/ERROR
- 每次执行记录：
  - 开始/结束时间
  - 每一步请求的状态码、耗时
  - 响应摘要（前 500 字符），可选择脱敏
  - 结果：SUCCESS/FAILED/SKIPPED
- 通知（MVP 至少一个渠道）：
- **首选实现：Webhook**（服务端只负责发送结构化事件，降低适配成本）。
- 事件载荷需包含：siteId/siteName/runId/status/failedStep/authFailed/summary/timestamps。
- 推荐用户配合聚合通知工具（不强制实现，但 PRD 需支持）：
  - Bark / Gotify / ntfy / PushDeer 等
  - 或兼容 `shoutrrr` 风格配置（后续可选）
- 触发策略：失败必通知；`AUTH_FAILED` 必通知且标题明确“凭证过期/需登录”。


---

## 4. 示例站点：up.x666.me（样例需求固化）

> 该示例用于验证系统的“多步骤 + 条件判断 + bearer token”能力。  
> 接口样例（用户抓包确认）：
- `GET https://up.x666.me/api/checkin/status`  
  返回示例（关键字段）：`success: true`, `can_spin: true|false`
- `POST https://up.x666.me/api/checkin/spin`  
  返回示例（关键字段）：`success: true`, `message: "恭喜获得 300次！"`

### 4.1 Flow 定义（逻辑）
1. Step `status`：
   - expect：`json.success == true`
   - extract：`can_spin = json.can_spin`
2. Step `spin`：
   - condition：`${can_spin} == true`
   - expect：`json.success == true`
   - extract：`reward_message = json.message`, `times = json.times`, `quota = json.quota`, `new_balance = json.new_balance`

### 4.2 Auth 定义
- Bearer Token：`Authorization: Bearer <JWT>`  
  来源：HAR 导入自动提取，或手动粘贴；建议支持 env 引用 `UPX666_BEARER`.

---

## 5. 交互与界面（Web UI）

### 5.1 页面结构（MVP）
1. 登录页（可选，MVP 可做无鉴权但必须提供管理员口令环境变量）
2. Dashboard：
   - 站点列表（表格）
   - 过滤：启用/禁用、标签
   - 快捷按钮：Run Now、查看日志
3. 站点编辑页：
   - 基本信息
   - Auth 配置（含 secret 输入）
   - Flow 编辑器：
     - 步骤列表（可拖拽排序）
     - 步骤详情表单：method/url/headers/body/expect/condition/extract
   - Schedule 配置
4. HAR 导入页：
   - 上传 HAR
   - 请求列表预览
   - 选择并生成 Flow
5. 执行历史页：
   - 某站点的执行记录列表
   - 查看单次执行详情（每一步请求明细）

### 5.2 可用性要求
- 一键“试跑”（Run Now），在 UI 中显示结果与错误原因。
- 常见错误提示友好：
  - 401/403：凭证无效或过期
  - 5xx：站点服务异常
  - JSON 解析失败：响应不是 JSON
  - condition 不满足：标记 SKIPPED 并解释原因

---


## 5.x 反爬与风控对抗（Anti-Detection，MVP 增强）

> 说明：本项目不做“绕过验证码/破解安全机制”。Anti-Detection 仅指降低机械化特征、减少无效请求、提升稳定性。

### 5.x.1 随机偏移（Jitter/Randomness）
- 在 Schedule 中支持随机执行窗口：`randomDelaySeconds`。
- 示例：`DailyAfter: 08:00` + `randomDelaySeconds: 3600` → 08:00~09:00 随机执行。

### 5.x.2 User-Agent 管理
- 支持全局 `defaultUserAgent`（可选）：配置一个真实浏览器 UA 作为缺省值。
- HAR 导入优先：默认保留 HAR 里的 UA，不轻易覆盖；仅当用户显式指定覆盖时才替换。

### 5.x.3 请求节奏控制
- 支持 `sleepRangeMs`（步骤间随机延迟），以及站点级 `rateLimit`（例如每分钟最多 N 次执行/重试），避免频繁失败触发风控。


## 5.y 调试与数据（Debug & Data，MVP 增强）

### 5.y.1 Dry-Run 与单步调试
- 支持“从第 X 步开始执行”与“仅执行第 X 步”。
- 支持在调试时手动注入上下文变量（例如 `${token}`、`${can_spin}`），用于跳过前序步骤。
- 站点配置应提供“调试配置不落库/不影响定时去重”的选项（避免误触发真实签到）。

### 5.y.2 敏感字段部分脱敏
- 默认日志脱敏，但允许在 Debug 视图中使用“部分脱敏”展示：保留前 3 位与后 3 位，中间用 `...` 替代。
  - 示例：`sess_abc...xyz`
- 任何情况下不得在日志中完整明文输出 Authorization/Cookie。

## 6. 系统设计（建议架构）

### 6.1 技术栈建议（可替换，但需满足功能）
- 后端：Node.js (NestJS/Express/Fastify) 或 Python (FastAPI)
- 前端：React/Vue（也可用简单模板）
- 存储：SQLite（MVP）→ 可升级 Postgres
- 调度：内置任务队列（BullMQ/Agenda）或 node-cron；Python 可用 APScheduler
- 部署：Docker + docker-compose

### 6.2 模块划分
1. `api-server`：提供 REST API（站点 CRUD、执行记录、HAR 导入）
2. `worker`：执行 Flow（HTTP 请求、条件判断、提取变量、写执行记录）
3. `scheduler`：定时触发站点执行（可与 worker 合并为同进程）
4. `web-ui`：管理台（可与 api-server 同容器静态托管）
5. `db`：SQLite 文件卷（MVP）

### 6.3 数据模型（MVP）
#### Site
- `id` (uuid)
- `name`
- `enabled` (bool)
- `tags` (string[])
- `baseUrl` (string, optional)
- `auth` (json)
- `flow` (json)
- `schedule` (json)
- `createdAt`, `updatedAt`

#### Run（执行记录）
- `id`
- `siteId`
- `status` (SUCCESS/FAILED/SKIPPED/RUNNING)
- `startedAt`, `finishedAt`
- `summary`（文本）
- `steps`（json：每步请求详情，含耗时、状态码、响应摘要、错误）

#### Secret（可选）
- `id`
- `siteId`
- `keyName`
- `ciphertext`（加密后）
- `createdAt`

---

## 7. API（示例，供实现）

### 7.1 Site
- `GET /api/sites`
- `POST /api/sites`
- `GET /api/sites/:id`
- `PUT /api/sites/:id`
- `DELETE /api/sites/:id`
- `POST /api/sites/:id/run`（立即执行）

### 7.2 Runs
- `GET /api/sites/:id/runs`
- `GET /api/runs/:runId`

### 7.3 HAR Import
- `POST /api/har/parse`（上传 HAR → 返回请求列表）
- `POST /api/har/generate-flow`（选择请求 → 生成 flow 配置）

---

## 8. 安全与合规

1. **敏感信息保护**：Authorization、Cookie 等不得在日志中明文输出（默认脱敏）。
2. **管理员访问控制**：
   - MVP：环境变量 `ADMIN_TOKEN`，UI 登录后写入 localStorage，API Bearer 校验。
3. **免责声明**：UI 中提示用户只对授权站点使用，遵守站点条款。

---

## 9. 非功能性需求

- 可靠性：单站点失败不影响其他站点执行。
- 可观测性：每次执行可追踪到具体哪个步骤失败、响应片段、耗时。
- 可扩展性：新增站点优先通过 HAR 导入完成；复杂站点可写“脚本插件”（后续版本）。
- 性能：MVP 并发可先限制为 1~3；后续支持队列并发。

---

## 10. 验收标准（MVP）

1. Docker 一键启动成功：`docker compose up -d` 后能访问管理台。
2. 可新增站点并配置两步 Flow。
3. 对示例站点 up.x666.me：
   - 导入 HAR 或手动配置 Bearer token；
   - 执行 `status` 并基于 `can_spin` 决定是否执行 `spin`；
   - 在执行记录中看到 `message` 等提取结果。
4. 定时执行：设置“每天 08:00 之后执行一次”，当天只执行一次。
5. 日志完整：每次执行至少包含步骤明细（状态码/耗时/摘要）与总体状态。
6. 通知（至少一种）可用：失败必通知。
7. 调度支持 `randomDelaySeconds`：DailyAfter 可在窗口内随机执行。
8. 能识别并处理 `AUTH_FAILED`：401/403 触发专门通知并自动暂停站点定时任务，更新凭证后恢复。
9. HAR 导入具备智能过滤（静态资源/埋点默认隐藏）并默认保留 HAR 的 User-Agent。

---

## 11. 里程碑（建议）

- M1（1~2 天）：后端 CRUD + SQLite + worker 执行 HTTP flow（无 UI 或极简 UI）
- M2（2~4 天）：完整 Web UI + HAR 导入 + 运行记录
- M3（1~2 天）：通知 + 凭证加密/环境变量引用 + 脱敏日志
- M4（后续）：Playwright 插件、刷新 token、更多通知渠道、并发队列

---

## 12. 附录：Flow 配置示例（JSON）

```json
{
  "name": "up.x666.me 转盘",
  "enabled": true,
  "auth": {
    "type": "bearer",
    "tokenSource": "env",
    "envKey": "UPX666_BEARER"
  },
  "schedule": {
    "type": "dailyAfter",
    "timezone": "Asia/Shanghai",
    "hour": 8,
    "minute": 5,
    "randomDelaySeconds": 3600
  },
  "flow": [
    
    // 可选：步骤间随机延迟（降低机械化特征）
    // "sleepRangeMs": [500, 1500],

    {
      "name": "status",
      "method": "GET",
      "url": "https://up.x666.me/api/checkin/status",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "authorization": "Bearer ${token}"
      },
      "expect": { "type": "json", "path": "success", "equals": true },
      "extract": [
        { "var": "can_spin", "type": "json", "path": "can_spin" }
      ]
    },
    {
      "name": "spin",
      "condition": "${can_spin} == true",
      "method": "POST",
      "url": "https://up.x666.me/api/checkin/spin",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "authorization": "Bearer ${token}"
      },
      "body": null,
      "expect": { "type": "json", "path": "success", "equals": true },
      "extract": [
        { "var": "reward_message", "type": "json", "path": "message" },
        { "var": "times", "type": "json", "path": "times" },
        { "var": "quota", "type": "json", "path": "quota" },
        { "var": "new_balance", "type": "json", "path": "new_balance" }
      ]
    }
  ]
}
```

---

## 13. 给 AI 的实现提示（务必遵守）

- 优先实现“HTTP Flow Engine + HAR 导入 + 定时调度 + Docker”这四件事。
- **不要**实现任何绕过验证码/安全校验的功能。
- 日志必须默认脱敏：Authorization/Cookie 等输出 `***`。
- 配置中支持 `${var}` 模板替换，变量来自 auth/前序 extract。
- condition 表达式建议用安全表达式引擎（避免任意代码执行），例如：
  - JS：jexl / expr-eval
  - Python：simpleeval

---

**文档结束**
