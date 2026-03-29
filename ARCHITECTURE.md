# ARCHITECTURE — Peemail 技术架构文档

> 版本：v0.6
> 日期：2026-03-29
> 对应 PRD：v0.6

---

## 一、系统架构图

### 1.1 整体分层架构

```
┌──────────────────────────────────────────────────────────────────┐
│                           客户端层                                │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│   │   iOS App       │  │  Android App    │  │  Web Browser   │  │
│   │  (Expo SDK 52+) │  │  (Expo SDK 52+) │  │  (Next.js)     │  │
│   └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
│            └───────────────────┬┘                   │           │
│                     Expo Router / React Native Web  │           │
│                     Mapbox SDK / Mapbox GL JS       │           │
│                     Socket.io Client v4             │           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS / WSS
┌─────────────────────────────────▼────────────────────────────────┐
│                         边缘 & 网关层                             │
│                                                                  │
│              Cloudflare（CDN、DDoS 防护、静态资源）               │
│              Nginx（反向代理、SSL 终止、限流）                     │
└──────────────┬────────────────────────────┬──────────────────────┘
               │ REST / HTTP2               │ WebSocket Upgrade
┌──────────────▼────────────┐  ┌────────────▼─────────────────────┐
│       REST API 服务        │  │       WebSocket 服务              │
│   Node.js + Hono          │  │   Node.js + Socket.io            │
│                           │  │                                  │
│  · 气味钉 CRUD             │  │  · 行进模式同行者推送             │
│  · 设备身份认证            │  │  · 邀请制聊天室管理               │
│  · 表态 / 回复             │  │  · 气味钉实时推送（附近新钉）     │
│  · 活动场景管理            │  │  · 在线心跳维护                  │
│  · 道具 / 积分（Phase 2）  │  │                                  │
└──────────────┬────────────┘  └────────────┬─────────────────────┘
               │                            │
┌──────────────▼────────────────────────────▼─────────────────────┐
│                        异步任务层                                 │
│                   BullMQ + Redis Queue                          │
│                                                                  │
│  · GPS 轨迹聚类（行进模式同行者识别）                             │
│  · 气味钉过期清理 / 内容并入处理（活动场景）                      │
│  · 互动续命计算（回复 / 表态触发延寿）                            │
│  · 推送通知发送（Expo Push / APNs / FCM）                        │
└──────────────┬────────────────────────────────────────────────── ┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                          数据层                                  │
│                                                                  │
│  ┌─────────────────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  PostgreSQL 16           │  │  Redis 7 │  │  S3 / OSS     │  │
│  │  + PostGIS 3             │  │          │  │               │  │
│  │                         │  │ · GPS 坐  │  │ · 图片 / 媒体 │  │
│  │ · 气味钉（含地理索引）    │  │   标缓存  │  │   对象存储    │  │
│  │ · 回复 / 表态 / 闻过计数  │  │ · 在线用  │  │ (Phase 2)   │  │
│  │ · 设备身份               │  │   户状态  │  └───────────────┘  │
│  │ · 活动 / 官方气味钉      │  │ · 聊天室  │                     │
│  │ · 屏蔽 / 举报记录        │  │   成员列  │                     │
│  │                         │  │   表      │                     │
│  └─────────────────────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 行进模式跨平台通信（Phase 2）

> 以下流程描述 Phase 2 的行进模式：GPS 聚类识别同行者后，通过服务器中转实现 iOS ↔ Android 跨平台邀请与聊天，MVP 阶段不涉及。

```
iOS 设备 A                    服务器（WebSocket）               Android 设备 B
     │                               │                               │
     │── 上报 GPS 坐标 ─────────────▶│                               │
     │                               │◀──────── 上报 GPS 坐标 ───────│
     │                               │                               │
     │                        [GPS 聚类 Worker]                      │
     │                        识别 A、B 同行者                       │
     │                               │                               │
     │◀── 推送可邀请列表 ────────────│                               │
     │── 发送邀请 ──────────────────▶│──── 转发邀请 ────────────────▶│
     │                               │◀─── 接受邀请 ─────────────────│
     │                               │                               │
     │◀══════════════════ Socket.io room（双向实时消息）══════════════│
```

### 1.3 Monorepo 目录结构

```
peemail/                          # AGPL-3.0
├── apps/
│   ├── mobile/                   # Expo React Native（iOS + Android）
│   │   ├── app/                  # Expo Router 页面
│   │   ├── components/           # UI 组件
│   │   └── hooks/                # 自定义 hooks（地图、WebSocket）
│   └── web/                      # Next.js（响应式 Web）
│       ├── app/                  # App Router 页面
│       └── components/
├── packages/
│   ├── api/                      # Hono REST API
│   │   ├── routes/               # pins / votes / replies / devices / events
│   │   └── middleware/           # auth、rate-limit、geo-validate
│   ├── ws/                       # Socket.io WebSocket 服务
│   │   ├── handlers/             # pins（地图推送，MVP）; motion、chat（行进模式，Phase 2）
│   │   └── rooms/                # 聊天室生命周期管理（Phase 2）
│   ├── worker/                   # BullMQ 异步任务
│   │   ├── jobs/                 # pin-expire、push-notify（MVP）; gps-cluster（Phase 2）
│   │   └── processors/
│   ├── db/                       # 数据库
│   │   ├── schema/               # Drizzle ORM schema
│   │   └── migrations/
│   └── shared/                   # 跨包共享
│       ├── types/                # TypeScript 类型定义
│       ├── constants/            # 业务常量（半径、过期时间等）
│       └── utils/                # geo 工具、时间工具
├── turbo.json
├── package.json
└── LICENSE                       # AGPL-3.0
```

---

## 二、技术栈选型

### 2.1 前端

| 技术 | 版本 | 选型理由 |
|------|------|---------|
| **Expo (React Native)** | SDK 52+ | 一套代码同时产出 iOS、Android、Web；Expo Router 支持文件系统路由和 SSR；EAS Build 简化发布流程 |
| **Mapbox Maps SDK** | RN: v10+ / JS: v3 | 国内外统一服务商，避免双地图维护；矢量瓦片支持高度自定义样式（气味钉视觉风格）；离线地图支持（Phase 3 BLE 场景） |
| **Zustand** | v5 | 轻量、无样板代码；selector 粒度细，避免不必要重渲染；比 Redux 更适合中小型状态树 |
| **Socket.io Client** | v4 | 与后端 Socket.io 一套协议；自动断线重连；支持 namespace 隔离行进聊天与留言推送 |
| **React Query (TanStack Query)** | v5 | REST 数据缓存、乐观更新（表态立即反馈）、后台轮询（附近新气味钉） |

### 2.2 后端

| 技术 | 选型理由 |
|------|---------|
| **Node.js 22 LTS** | 与前端共享 TypeScript 类型；事件循环天然适合 WebSocket 高并发；npm 生态对地理计算库支持好（turf.js） |
| **Hono v4** | 比 Express 快 ~3x；原生支持 TypeScript、Zod 校验；可部署到 Cloudflare Workers（边缘计算，后期降低延迟） |
| **Socket.io v4** | 内置 room 概念直接映射行进聊天室；adapter 支持 Redis 横向扩展；自动降级 long-polling（弱网场景） |
| **Drizzle ORM** | 类型安全的 SQL；比 Prisma 运行时更轻（无 Rust 引擎依赖）；Migration 工具链完整 |
| **BullMQ** | Redis 驱动的任务队列；支持延迟任务（气味钉到期处理）、优先级队列（Push 推送）、任务重试 |
| **turf.js** | GPS 聚类、速度计算、向量相似度等地理算法库，Node.js 原生支持 |

### 2.3 数据存储

| 存储 | 用途 | 选型理由 |
|------|------|---------|
| **PostgreSQL 16 + PostGIS 3** | 气味钉持久化、用户关系 | `ST_DWithin` 原生支持 50m 半径过滤；GiST 空间索引性能优秀；JSONB 灵活存储道具元数据 |
| **Redis 7** | GPS 坐标缓存（TTL 30s）、在线状态、聊天室成员、BullMQ 队列 | 内存操作满足 GPS 高频读写；Sorted Set 天然支持地理空间查询（GEOSEARCH）；Pub/Sub 支持 Socket.io 多节点广播 |
| **S3 / 阿里云 OSS** | 图片、媒体（Phase 2） | 对象存储标准方案；CDN 加速；国内用 OSS，海外用 S3 |

### 2.4 基础设施

| 服务 | 选型 |
|------|------|
| 云平台 | 国内：阿里云 ECS / ACK；海外：AWS EC2 / EKS |
| CDN & 安全 | Cloudflare（静态资源、DDoS 防护、Rate Limiting） |
| 推送通知 | Expo Push Notifications → APNs（iOS）/ FCM（Android） |
| 监控告警 | Sentry（错误追踪） + Grafana + Prometheus（性能指标） |
| 日志 | Loki + Grafana（结构化日志） |
| CI/CD | GitHub Actions + EAS Build（移动端）/ Vercel（Web） |

---

## 三、数据库结构草案

> ORM：Drizzle ORM
> 地理坐标类型：PostGIS `geography(Point, 4326)`

### 3.1 设备身份表 `devices`

```sql
CREATE TABLE devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_hash       TEXT NOT NULL UNIQUE,     -- SHA-256(设备唯一标识)，不可反查
  identity_key_hash TEXT UNIQUE,              -- SHA-256(恢复码派生主密钥)，用于换机恢复身份校验；服务端只存 hash，无法反推恢复码
  nickname          TEXT NOT NULL,            -- "慵懒的水獭"
  avatar_animal     TEXT NOT NULL,            -- 动物标识符，如 "otter"
  avatar_color      TEXT NOT NULL,            -- 主题色，如 "#A8D8A8"
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 封禁字段（Phase 2）
  is_banned         BOOLEAN NOT NULL DEFAULT false,
  ban_reason        TEXT,
  banned_at         TIMESTAMPTZ
);
```

### 3.2 气味钉表 `pins`

```sql
CREATE TABLE pins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES devices(id),
  content         TEXT NOT NULL CHECK (char_length(content) <= 280),
  location        GEOGRAPHY(Point, 4326) NOT NULL,
  is_private      BOOLEAN NOT NULL DEFAULT false,
  -- 公开钉：有过期时间；私密钉：expires_at IS NULL（永久）
  expires_at      TIMESTAMPTZ,
  view_count      INTEGER NOT NULL DEFAULT 0,     -- 闻过（自动计数）
  vote_up_count   INTEGER NOT NULL DEFAULT 0,     -- 气味相投
  vote_down_count INTEGER NOT NULL DEFAULT 0,     -- 臭味相投
  report_count    INTEGER NOT NULL DEFAULT 0,     -- 累计举报次数
  is_hidden       BOOLEAN NOT NULL DEFAULT false, -- 达到举报阈值后自动隐藏，待人工审核
  pin_type        TEXT NOT NULL DEFAULT 'user'    -- 'user' | 'official'
                  CHECK (pin_type IN ('user', 'official')),
  event_id        UUID REFERENCES events(id),     -- 关联活动场景（可空）
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 空间索引（核心查询性能）
CREATE INDEX pins_location_idx ON pins USING GIST (location);
-- 过期清理索引
CREATE INDEX pins_expires_at_idx ON pins (expires_at) WHERE expires_at IS NOT NULL;
-- 活动场景查询索引
CREATE INDEX pins_event_id_idx ON pins (event_id) WHERE event_id IS NOT NULL;
```

### 3.3 回复表 `replies`

```sql
CREATE TABLE replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id     UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  device_id  UUID NOT NULL REFERENCES devices(id),
  content    TEXT NOT NULL CHECK (char_length(content) <= 280),
  parent_id  UUID REFERENCES replies(id),    -- 支持二级嵌套回复
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX replies_pin_id_idx ON replies (pin_id);
```

### 3.4 表态表 `votes`

```sql
CREATE TABLE votes (
  pin_id     UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  device_id  UUID NOT NULL REFERENCES devices(id),
  value      SMALLINT NOT NULL CHECK (value IN (1, -1)),  -- 1=气味相投, -1=臭味相投
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pin_id, device_id)  -- 每设备每钉只能表态一次，可改变
);
```

### 3.5 活动场景表 `events`

```sql
CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  venue_boundary   GEOGRAPHY(Polygon, 4326) NOT NULL,  -- 场馆地理围栏
  personal_pin_ttl INTEGER NOT NULL DEFAULT 21600,     -- 个人钉存活秒数，默认 6h
  contract_ends_at TIMESTAMPTZ,                        -- 合约到期时间，NULL=长期有效
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'hidden')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX events_venue_idx ON events USING GIST (venue_boundary);
```

### 3.6 内容归档表 `archived_pin_contents`

> 活动结束后，个人气味钉内容并入官方气味钉的留言区

```sql
CREATE TABLE archived_pin_contents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_pin_id UUID NOT NULL REFERENCES pins(id),
  original_pin_id UUID NOT NULL,               -- 原始个人钉 ID（已删除，仅记录）
  device_id       UUID NOT NULL REFERENCES devices(id),
  content         TEXT NOT NULL,
  original_at     TIMESTAMPTZ NOT NULL,        -- 原始发布时间
  archived_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX archived_official_pin_idx ON archived_pin_contents (official_pin_id);
```

### 3.7 屏蔽 / 举报表

```sql
-- 屏蔽：再也看不到某只动物的气味钉
CREATE TABLE blocks (
  blocker_device_id UUID NOT NULL REFERENCES devices(id),
  blocked_device_id UUID NOT NULL REFERENCES devices(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_device_id, blocked_device_id)
);

-- 举报队列
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES devices(id),
  pin_id       UUID REFERENCES pins(id),
  reply_id     UUID REFERENCES replies(id),
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.8 行进聊天相关表（Phase 2）

```sql
CREATE TABLE motion_rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES devices(id),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'converted', 'dissolved')),
  -- 'converted'=转为普通聊天室, 'dissolved'=原地解散
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

CREATE TABLE motion_room_members (
  room_id    UUID NOT NULL REFERENCES motion_rooms(id),
  device_id  UUID NOT NULL REFERENCES devices(id),
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at    TIMESTAMPTZ,
  PRIMARY KEY (room_id, device_id)
);

-- 消息不持久化：行进聊天消息仅通过 WebSocket 实时转发，解散时直接删除，服务端不落库任何聊天内容
```

### 3.9 封禁 & 手机号验证表（Phase 2）

```sql
-- 手机号验证记录：仅在封禁解封场景写入，正常使用不涉及
-- phone_hash = SHA-256(手机号)，不存明文
CREATE TABLE phone_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash   TEXT NOT NULL,
  device_id    UUID NOT NULL REFERENCES devices(id),
  verified_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 通过 phone_hash 关联同一号码名下所有设备，防止反复绕过封禁
CREATE INDEX phone_verifications_phone_hash_idx ON phone_verifications (phone_hash);
CREATE INDEX phone_verifications_device_idx ON phone_verifications (device_id);
```

---

## 四、API 接口设计草案

> 基础路径：`/api/v1`
> 认证：所有请求携带 `X-Device-Token: <JWT>` Header
> 内容类型：`application/json`

### 4.1 设备身份

#### `POST /devices/register`
首次启动，生成设备身份。客户端本地生成恢复码和主密钥，仅将 `identity_key_hash` 提交给服务端。

**Request**
```json
{
  "device_hash": "sha256_of_device_fingerprint",
  "identity_key_hash": "sha256_of_client_derived_master_key"
}
```

**Response 201**
```json
{
  "token": "<JWT>",
  "device": {
    "id": "uuid",
    "nickname": "慵懒的水獭",
    "avatar_animal": "otter",
    "avatar_color": "#A8D8A8"
  }
}
```

> **恢复码在客户端本地生成并展示，不经过网络传输，服务端只存 `identity_key_hash`。**

#### `POST /devices/recover`
换机时通过恢复码恢复身份。客户端用恢复码在本地重新派生主密钥，计算 `identity_key_hash` 后提交。

**Request**
```json
{
  "identity_key_hash": "sha256_of_client_derived_master_key",
  "new_device_hash": "sha256_of_new_device_fingerprint"
}
```

**Response 200**
```json
{
  "token": "<JWT>",
  "device": {
    "id": "uuid",
    "nickname": "慵懒的水獭",
    "avatar_animal": "otter",
    "avatar_color": "#A8D8A8"
  }
}
```

**Response 404** — 无匹配身份（恢复码错误或从未注册）

#### `PATCH /devices/me`
更新昵称或头像主题色。

**Request**
```json
{
  "nickname": "焦虑的水獭",
  "avatar_color": "#FFD700"
}
```

---

### 4.2 气味钉

#### `GET /pins?lat=&lng=&type=public|private`
查询 50m 范围内的气味钉。

**Query Parameters**
| 参数 | 类型 | 说明 |
|------|------|------|
| `lat` | float | 当前纬度 |
| `lng` | float | 当前经度 |
| `type` | string | `public`（附近公开钉） / `private`（自己的私密日记） |
| `cursor` | string | 分页游标（`created_at` ISO 字符串） |
| `limit` | int | 默认 50，最大 100 |

**Response 200**
```json
{
  "pins": [
    {
      "id": "uuid",
      "content": "这家拿铁很苦",
      "author": {
        "nickname": "慵懒的水獭",
        "avatar_animal": "otter",
        "avatar_color": "#A8D8A8"
      },
      "location": { "lat": 31.2304, "lng": 121.4737 },
      "view_count": 43,
      "vote_up_count": 8,
      "vote_down_count": 4,
      "my_vote": null,          -- 1 | -1 | null
      "reply_count": 3,
      "expires_at": "2026-03-31T10:00:00Z",  -- 私密钉为 null
      "is_private": false,
      "pin_type": "user",
      "created_at": "2026-03-29T10:00:00Z"
    }
  ],
  "next_cursor": "2026-03-29T09:30:00Z"
}
```

#### `POST /pins`
发布气味钉（留个味儿）。

**Request**
```json
{
  "content": "这里适合发呆",
  "lat": 31.2304,
  "lng": 121.4737,
  "is_private": false
}
```

**Response 201**
```json
{
  "pin": { ...pin_object }
}
```

#### `DELETE /pins/:id`
删除自己发布的气味钉。

**Response 204** No Content

---

### 4.3 闻过（浏览计数）

#### `POST /pins/:id/view`
用户打开气味钉详情时自动调用，服务端幂等处理（同一设备 1h 内重复调用不重复计数）。

**Response 200**
```json
{ "view_count": 44 }
```

---

### 4.4 表态

#### `PUT /pins/:id/vote`
气味相投或臭味相投，可以改票，也可以撤销。

**Request**
```json
{
  "value": 1    -- 1=气味相投, -1=臭味相投, 0=撤销
}
```

**Response 200**
```json
{
  "vote_up_count": 9,
  "vote_down_count": 4,
  "my_vote": 1
}
```

---

### 4.5 回复

#### `GET /pins/:id/replies?cursor=&limit=`
获取留言串。

**Response 200**
```json
{
  "replies": [
    {
      "id": "uuid",
      "content": "我也觉得",
      "author": { "nickname": "...", "avatar_animal": "...", "avatar_color": "..." },
      "parent_id": null,
      "created_at": "2026-03-29T10:05:00Z"
    }
  ],
  "next_cursor": "..."
}
```

#### `POST /pins/:id/replies`
发布回复。

**Request**
```json
{
  "content": "确实，我也踩坑了",
  "parent_id": null    -- 可空，二级嵌套时填父回复 ID
}
```

**Response 201**
```json
{ "reply": { ...reply_object } }
```

---

### 4.6 活动场景

#### `GET /events?lat=&lng=`
查询当前坐标是否在活动场地范围内。

**Response 200**
```json
{
  "event": {
    "id": "uuid",
    "name": "某乐队巡演 · 上海站",
    "status": "active",
    "personal_pin_ttl": 21600,
    "official_pins": [ ...pin_objects ]
  }
}
-- 不在任何活动范围内时：{ "event": null }
```

---

### 4.7 内容安全

#### `POST /reports`
举报气味钉或回复。服务端写入举报记录后立即检查 `pins.report_count`：若达到阈值（默认 3，通过环境变量 `REPORT_HIDE_THRESHOLD` 配置），则将 `is_hidden = true`，并通过 WebSocket 向附近客户端广播 `pin:hidden` 事件。

**Request**
```json
{
  "pin_id": "uuid",       -- 与 reply_id 二选一
  "reply_id": null,
  "reason": "spam"        -- spam | offensive | misleading | other
}
```

**Response 201**
```json
{ "report_id": "uuid" }
```

#### `POST /blocks`
屏蔽某只动物。

**Request**
```json
{ "device_id": "uuid_to_block" }
```

**Response 201** No Content

---

### 4.8 WebSocket 事件（Socket.io）

> Namespace：`/pins`（地图推送，MVP）、`/motion`（行进模式，**Phase 2，不在 MVP 实现**）

#### Namespace `/pins`

| 事件 | 方向 | 说明 |
|------|------|------|
| `join_area` | Client → Server | 订阅当前坐标区域的推送，传入 `{lat, lng}` |
| `leave_area` | Client → Server | 离开当前区域 |
| `pin:new` | Server → Client | 附近新增气味钉 |
| `pin:expired` | Server → Client | 附近气味钉过期消失 |
| `pin:vote_updated` | Server → Client | 某气味钉表态数变化 |
| `pin:hidden` | Server → Client | 某气味钉因举报达到阈值被自动隐藏 |

**`join_area` payload**
```json
{ "lat": 31.2304, "lng": 121.4737 }
```

**`pin:new` payload**
```json
{
  "pin": { ...pin_object }
}
```

#### Namespace `/motion`（**Phase 2，不在 MVP 实现**）

| 事件 | 方向 | 说明 |
|------|------|------|
| `location:update` | Client → Server | 每 10s 上报 GPS 坐标 |
| `companions:found` | Server → Client | 发现同行者，推送可邀请列表 |
| `invite:send` | Client → Server | 向某同行者发送邀请 |
| `invite:received` | Server → Client | 收到邀请通知 |
| `invite:accept` | Client → Server | 接受邀请 |
| `invite:decline` | Client → Server | 拒绝邀请 |
| `room:joined` | Server → Client | 成功加入聊天室 |
| `message:send` | Client → Server | 发送消息 |
| `message:received` | Server → Client | 收到消息 |
| `room:end` | Server → Client | 行进结束，触发结束流程 |

**`location:update` payload**
```json
{ "lat": 31.2304, "lng": 121.4737, "accuracy": 5.0 }
```

**`companions:found` payload**
```json
{
  "companions": [
    {
      "device_id": "uuid",
      "nickname": "急躁的仓鼠",
      "avatar_animal": "hamster",
      "avatar_color": "#FF8C69"
    }
  ]
}
```

---

## 五、关键设计决策

### 5.1 气味钉过期与互动续命

```
pins.expires_at 由 Worker 维护：

新建公开气味钉时：
  expires_at = now() + 72h

收到回复或表态时（BullMQ delayed job）：
  new_expires = max(expires_at, now()) + INTERACTION_BONUS
  UPDATE pins SET expires_at = new_expires WHERE id = pin_id
  -- INTERACTION_BONUS 规则待定，暂定 +1h/次，上限 expires_at < now() + 7days

使用道具时：
  由道具类型决定具体效果，统一走同一 Worker 接口
```

### 5.2 私密气味钉永久保存

```sql
-- 私密钉创建时 expires_at = NULL
-- 查询时过滤逻辑：
WHERE (
  (is_private = false AND expires_at > NOW())
  OR (is_private = true AND owner_device_id = :device_id)
)
-- Worker 过期清理任务只处理 expires_at IS NOT NULL 的行，不会误删私密钉
```

### 5.3 活动场景个人钉内容归档流程

```
BullMQ Delayed Job（pin 创建时，仅对公开气味钉加入队列，延迟 personal_pin_ttl 秒）：

0. 若 pin.is_private = true → 直接跳过，私密气味钉永久遵循私密规则，
   不受活动场景约束，不限时，不并入官方气味钉
1. 查询 pin 所属 event（若已不在活动范围则跳过）
2. 找到该 event 的 official_pin
3. INSERT INTO archived_pin_contents (official_pin_id, content, ...)
4. DELETE FROM pins WHERE id = personal_pin_id
```

### 5.4 设备身份安全 & 恢复码机制

```
【首次注册流程（客户端本地完成）】
1. 生成 recovery_phrase（BIP39 12-word mnemonic）
2. master_key = PBKDF2(recovery_phrase, salt="peemail-identity", iterations=100000)
3. identity_key_hash = SHA-256(master_key)               ← 提交给服务端
4. private_diary_key = HKDF(master_key, info="private-diary")  ← 用于私密钉加密，纯客户端
5. device_hash = SHA-256(platform + model + install_uuid) ← 也提交给服务端

服务端存储：device_hash + identity_key_hash（均为单向哈希，无法反推）
客户端存储：recovery_phrase（Keychain / Keystore），private_diary_key 从 phrase 按需派生

【换机恢复流程】
1. 新设备输入 recovery_phrase
2. 客户端重新派生 master_key → identity_key_hash
3. POST /devices/recover { identity_key_hash, new_device_hash }
4. 服务端查找匹配 identity_key_hash 的 device 记录，更新 device_hash，返回新 JWT
5. 客户端重新派生 private_diary_key，私密钉恢复可访问

【安全注意事项】
· recovery_phrase 不经网络传输，服务端零知识
· 用户丢失 recovery_phrase 即视为身份不可恢复（明确 UI 警告）
· JWT 有效期 30 天，刷新无感续签
· 同一设备可重置昵称/头像，但 device_hash / identity_key_hash 不变（用于举报溯源）
```

### 5.5 举报自动隐藏逻辑

```
POST /reports 处理流程：

1. INSERT INTO reports (reporter_id, pin_id, reason, status='pending')
2. UPDATE pins SET report_count = report_count + 1 WHERE id = pin_id
3. SELECT report_count FROM pins WHERE id = pin_id
4. IF report_count >= REPORT_HIDE_THRESHOLD（默认 3，可通过环境变量调整）:
     UPDATE pins SET is_hidden = true WHERE id = pin_id
     通过 Socket.io 向该 pin 所在区域广播：{ event: "pin:hidden", pin_id }
     客户端收到后立即从地图上移除该气味钉

【查询过滤】
GET /pins 结果自动排除 is_hidden = true 的条目（对所有用户不可见，包括作者）

【人工审核恢复】
管理后台：UPDATE pins SET is_hidden = false, report_count = 0 WHERE id = pin_id
-- 审核通过后重新可见；永久删除则直接 DELETE
```

---

## 六、待解决的技术问题

1. **闻过幂等性**：同一设备反复进入 / 离开 50m 范围，view_count 是否重复增加？建议：同一 `(device_id, pin_id)` 1h 内只计一次，Redis 存临时标记。
2. **互动续命上限**：防止高热气味钉无限续命。需定义 `max_expires = created_at + 30days` 硬上限。
3. **GPS 聚类延迟**：Worker 每次轮询 Redis 做聚类，若用户量大，聚类频率需动态调整（低峰 30s / 高峰 5s）。
4. **Socket.io 横向扩展**：多节点部署时需配置 `@socket.io/redis-adapter`，否则不同节点的用户无法在同一 room 通信。
5. **PostGIS 与 Redis GEO 的取舍**：近实时的 GPS 查询走 Redis `GEOSEARCH`（低延迟），持久化的气味钉查询走 PostGIS `ST_DWithin`（高精度），两者职责分离。

---

*文档维护者：待定 | 下次评审：Phase 0 开始前确认 DB schema*
