# CheckinHub 前端架构规划文档 v1.0

## 技术栈
- **Core**: React 19 + Vite
- **UI Framework**: Ant Design v5
- **Data Fetching/State**: @tanstack/react-query v5
- **Routing**: react-router-dom v6
- **HTTP**: Axios
- **Icons**: @ant-design/icons, lucide-react
- **Utils**: dayjs, lodash-es, clsx

## 目录结构
```
src/
├── components/         # 全局通用组件
│   ├── Layout/         # AppLayout, Sidebar, Header
│   ├── Guard/          # AuthGuard
│   └── Common/         # StatusTag, JsonViewer
├── config/             # 全局配置
├── hooks/              # 全局 Hooks (useAuth)
├── lib/                # axios 实例, queryClient
├── pages/              # 页面视图
│   ├── Auth/           # 登录
│   ├── Dashboard/      # 仪表盘
│   ├── Sites/          # 站点管理
│   │   ├── components/ # SiteCard, SiteForm
│   │   ├── FlowEditor/ # 流程编辑器
│   │   ├── SiteList.jsx
│   │   └── SiteEdit.jsx
│   ├── Runs/           # 执行历史
│   │   ├── components/ # RunLogViewer, StepTimeline
│   │   ├── RunList.jsx
│   │   └── RunDetail.jsx
│   └── HarImport/      # HAR 导入
├── services/           # API 服务层
│   ├── api.js
│   ├── auth.js
│   ├── site.js
│   ├── run.js
│   └── har.js
├── utils/              # 工具函数
└── App.jsx             # 路由入口
```

## 核心组件设计

### FlowEditor
- 基于 `Antd Form.List`
- 支持拖拽排序（`@dnd-kit/sortable`）
- 子组件：FlowList, FlowStepItem, StepRequestForm, StepLogicForm

### RunDetailDrawer
- 抽屉式展示
- 左侧：Steps 组件展示执行链路
- 右侧：HTTP 详细信息（Req/Res）

## 认证流程
- Token 存储：localStorage (Key: `checkinhub_token`)
- Axios 拦截器：Request 注入 Bearer Token，Response 拦截 401

## 开发顺序

### 阶段一：基础设施与核心 CRUD (P0)
1. 脚手架初始化：安装依赖，配置 Vite proxy
2. API 封装与 Auth：axios 拦截器，Login 页面
3. Layout：侧边栏导航框架
4. 站点管理（基础）：列表、新增/编辑（基本信息，flow 暂用 JSON TextArea）

### 阶段二：核心业务逻辑 (P0)
5. FlowEditor（完整版）：可视化动态表单
6. 执行功能：Run Now 接口对接
7. 执行历史：RunList & RunDetail

### 阶段三：增强功能 (P1)
8. Dashboard：统计数据
9. HAR 导入：文件上传、解析、生成 Flow
10. UI 优化：响应式、Loading、错误提示
