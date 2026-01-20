# CheckinHub

多站点自动签到/抽奖平台 - Docker 一键部署

## 快速开始

1. 复制环境变量配置：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置管理员 token 和加密密钥

3. 启动服务：
```bash
docker compose up -d
```

4. 访问 API：http://localhost:8000/api/health

## API 文档

启动后访问：http://localhost:8000/docs

## 核心功能

- ✅ 多步骤 HTTP 请求流程引擎
- ✅ 条件判断和变量提取
- ✅ Bearer Token / Cookie / 自定义 Headers 认证
- ✅ 定时调度（DailyAfter + Cron + 随机延迟）
- ✅ Auth-fail 自动暂停
- ✅ Webhook 通知
- ✅ 日志脱敏

## 示例：up.x666.me 站点配置

```json
{
  "name": "up.x666.me 转盘",
  "enabled": true,
  "auth": {
    "type": "bearer",
    "token": "your-jwt-token"
  },
  "schedule": {
    "type": "dailyAfter",
    "hour": 8,
    "minute": 5,
    "randomDelaySeconds": 3600
  },
  "flow": [
    {
      "name": "status",
      "method": "GET",
      "url": "https://up.x666.me/api/checkin/status",
      "headers": {
        "authorization": "Bearer ${token}"
      },
      "expect": {
        "type": "json",
        "path": "success",
        "equals": true
      },
      "extract": [
        {
          "var": "can_spin",
          "type": "json",
          "path": "can_spin"
        }
      ]
    },
    {
      "name": "spin",
      "condition": "${can_spin} == True",
      "method": "POST",
      "url": "https://up.x666.me/api/checkin/spin",
      "headers": {
        "authorization": "Bearer ${token}"
      },
      "expect": {
        "type": "json",
        "path": "success",
        "equals": true
      },
      "extract": [
        {
          "var": "reward_message",
          "type": "json",
          "path": "message"
        }
      ]
    }
  ]
}
```

## 技术栈

- FastAPI + APScheduler + SQLite
- Python 3.11
- Docker + docker-compose
