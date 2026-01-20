# CheckinHub 部署指南

## 快速开始

### 1. 克隆项目
```bash
git clone <repo-url>
cd qd
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，设置安全的 ADMIN_TOKEN 和 ENCRYPTION_KEY
```

### 3. 一键启动
```bash
docker compose up -d --build
```

### 4. 访问服务
- **Web 界面**: http://localhost
- **API 文档**: http://localhost/api/docs (如果启用)

---

## 配置说明

| 变量 | 说明 | 默认值 |
|:---|:---|:---|
| `ADMIN_TOKEN` | 管理员 API Token | `change-me` |
| `ENCRYPTION_KEY` | 凭证加密密钥 (32 字节) | `change-me-32-bytes-key-here!!` |
| `WEBHOOK_URL` | 通知 Webhook URL | (空) |
| `CORS_ORIGINS` | 允许的跨域来源 | `*` |

---

## 架构说明

```
┌─────────────────────────────────────────┐
│              Docker Compose             │
├─────────────────┬───────────────────────┤
│    Frontend     │       Backend         │
│   (Nginx:80)    │    (Uvicorn:8000)     │
├─────────────────┼───────────────────────┤
│  静态文件服务    │      FastAPI          │
│  /api → 代理    │      SQLite           │
└─────────────────┴───────────────────────┘
```

---

## 常用命令

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 重建并启动
docker compose up -d --build

# 停止服务
docker compose down

# 停止并清理数据
docker compose down -v
```

---

## 生产环境建议

1. **修改默认密钥**：务必设置强密码的 `ADMIN_TOKEN` 和 `ENCRYPTION_KEY`
2. **HTTPS**：建议在 Nginx 前加一层反向代理 (如 Traefik) 处理 SSL
3. **备份**：定期备份 `./data` 目录中的 SQLite 数据库
4. **监控**：配置 `WEBHOOK_URL` 接收任务执行通知

---

## 故障排查

### 容器无法启动
```bash
docker compose logs backend
docker compose logs frontend
```

### API 返回 401
检查请求是否携带正确的 `Authorization: Bearer <ADMIN_TOKEN>` 头

### 前端无法连接后端
确认 `frontend` 容器能够访问 `backend:8000`：
```bash
docker compose exec frontend curl http://backend:8000/api/health
```
