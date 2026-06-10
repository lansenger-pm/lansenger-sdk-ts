[English](README.md) | [简体中文](README.zhHans.md) | [繁体中文](README.zhHant.md) | [繁体中文香港](README.zhHantHK.md) | [Français](README.fr.md)

# lansenger-sdk-ts

蓝信平台的 TypeScript SDK — 支持蓝信应用、组织机器人和个人机器人。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green)](https://nodejs.org/)

> 零框架依赖 — 仅依赖 `node-fetch` (v2，CommonJS 兼容)。适用于任何 Node.js 项目。

## 支持的机器人类型

| 机器人类型 | 认证方式 | WebSocket 入站 | 全部 API |
|-----------|---------|----------------|---------|
| **蓝信应用** | appToken + userToken | ✗ (使用 webhook) | ✓ |
| **组织机器人** | appToken + userToken | ✗ (使用 webhook) | ✓ |
| **个人机器人** | appToken | ✓ (WebSocket) | ✓ (非机器人 API 有限) |

所有三种机器人类型使用相同的认证机制：每次 API 调用都需要 `appToken`；`userToken` 仅用于特定用户级操作（用户信息、员工搜索、日历等）。

## 功能

- **异步客户端** — `LansengerClient` 提供 Promise 化 API
- **凭据与令牌持久化** — `CredentialStore` 将 app_id、app_secret、URL、appToken、userToken 保存到文件（重启后仍有效）
- **OAuth2 用户认证** — 授权 URL、代码兑换、令牌刷新
- **组织与部门** — 组织信息、部门详情/子部门/员工
- **员工与通讯录** — 基础/详细信息、ID 映射、部门祖先链、搜索
- **消息** — 3 种私聊通道（机器人、公众号、用户模拟）+ 群聊，全部消息类型，@提及，人/机器人发送者身份，紧急提醒
- **富卡片** — appCard（支持动态状态更新）、oacard、linkCard、appArticles
- **流式消息** — SSE 实时推送，适用于 AI Agent
- **媒体上传/下载** — 文件、图片、视频，自动类型检测，媒体路径获取
- **消息管理** — 撤回、动态卡片更新
- **群组** — 创建、信息、成员、列表、成员检查、更新设置与成员、解散
- **日历与日程** — 主日历、日程 CRUD + 更新、参会人管理 + 参会人元数据
- **统一待办** — 创建、更新、删除、查询、执行人管理、状态计数
- **回调事件** — 25 种事件类型，结构化解析，AES 解密（4.10.1.4），SHA1 签名验证
- **聊天读取** — 获取聊天列表、获取聊天消息（4.24 MCP）

## 快速安装

```bash
npm install lansenger-sdk-ts
```

开发环境：

```bash
git clone https://github.com/lansenger-pm/lansenger-sdk-ts.git
cd lansenger-sdk-ts
npm install
npm run build
npm test
```

## 1. 认证

### appToken — 所有 API 调用必需

每个 SDK 方法都需要 `appToken`。客户端使用 `app_id` + `app_secret` 自动获取和刷新。`TokenManager` 处理整个生命周期：

1. **首次调用** → `GET /v1/apptoken/create` → 返回 `appToken`（有效期 2 小时）
2. **后续调用** → 复用缓存的 appToken 直到过期
3. **令牌过期** → 自动通过相同端点刷新

```typescript
import { LansengerClient } from "lansenger-sdk-ts";

const client = new LansengerClient("你的-appid", "你的-secret");

// 也可以手动获取/失效令牌
const token = await client.getToken();
client.invalidateToken(); // 强制下次调用刷新
```

### userToken — 仅特定端点需要

`userToken` 代表特定蓝信用户的授权（通过 OAuth2 获得）。仅在以下场景需要：
- 用户级信息（fetchUserInfo、fetchStaffDetail、searchStaff）
- 日历与日程操作（fetchPrimaryCalendar、createSchedule 等）
- 作为人类发送者的群组操作

### 获取凭据

| 机器人类型 | 如何获取 app_id + app_secret |
|-----------|------------------------------|
| **个人机器人** | 蓝信桌面 → 通讯录 → 智能机器人 → 个人机器人 → 点击 ℹ️ 图标（手机客户端不显示凭据） |
| **蓝信应用** | 在蓝信开发者中心创建 — 可能需要组织管理员审批 |
| **组织机器人** | 在蓝信开发者中心创建 — 可能需要组织管理员审批 |

### OAuth2 用户级认证

```typescript
// 构建授权 URL — 将用户重定向到蓝信通行证
const url = client.buildAuthorizeUrl("https://myapp.com/callback");

// 用户授权后，兑换 code 获取 userToken + refreshToken
const tokenResult = await client.exchangeCode("回调中的授权码");

// 刷新过期的 userToken
const newToken = await client.refreshUserToken(tokenResult.refresh_token!);

// 获取用户信息
const userInfo = await client.fetchUserInfo(tokenResult.user_token!);
```

### 工厂方法

```typescript
// 从环境变量（LANSENGER_APP_ID、LANSENGER_APP_SECRET 等）
const client = LansengerClient.fromEnv();

// 从 LansengerConfig 对象
const config = new LansengerConfig("appid", "secret", "https://open.e.lanxin.cn/open/apigw");
const client = LansengerClient.fromConfig(config);

// 从 CredentialStore（读取持久化凭据）
const client = LansengerClient.fromStore();
```

## 2. 组织与部门

```typescript
// 组织信息
const org = await client.fetchOrgInfo("orgId");

// 部门层级
const detail = await client.fetchDepartmentDetail("deptId");
const children = await client.fetchDepartmentChildren("deptId");
const staffs = await client.fetchDepartmentStaffs("deptId");
```

## 3. 员工与通讯录

```typescript
// 基础员工信息
const staff = await client.fetchStaffBasicInfo("staffOpenId");

// 详细资料（建议提供 userToken）
const detail = await client.fetchStaffDetail("staffOpenId", { user_token: "ut" });

// 手机号 → staffId 映射
const mapping = await client.fetchStaffIdMapping("orgId", "mobile", "13800138000");

// 员工的部门祖先链
const ancestors = await client.fetchDepartmentAncestors("staffOpenId");

// 搜索员工（需要 userToken）
const results = await client.searchStaff("张三", { user_token: "ut" });

// 组织扩展字段 ID
const fields = await client.fetchOrgExtraFieldIds("orgId");
```

## 4. 消息与媒体

#### 机器人私聊 — 最常用

```typescript
const result = await client.sendText("staff123", "你好！");
const result = await client.sendMarkdown("staff123", "**加粗**");
const result = await client.sendFile("staff123", "/path/to/report.pdf");
```

#### 公号通道

```typescript
const result = await client.sendAccountMessage(
  "text", { text: { content: "系统通知" } },
  ["staff1", "staff2"], undefined,
  { account_id: "524288-xxxx" },
);
```

#### 用户模拟通道（需要 userToken）

```typescript
const result = await client.sendUserMessage(
  "staff456", "text", { text: { content: "你好" } },
  { user_token: "ut" },
);
```

#### 群聊

```typescript
// 机器人 → 群
const result = await client.sendText("group123", "通知", { is_group: true });

// 人类 → 群（需要 userToken）
const result = await client.sendGroupMessage(
  "group123", "text", { text: { content: "我来处理" } },
  { user_token: "ut" },
);

// 群聊 @提及
const result = await client.sendText("group123", "重要！", { is_group: true, reminder_all: true });
```

#### 富卡片

```typescript
const result = await client.sendAppCard("staff123", "审批", { is_dynamic: true });
const result = await client.sendLinkCard("staff123", "文章", "https://...");
const result = await client.sendAppArticles("staff123", [{ title: "文章1", link: "..." }]);

// 更新动态卡片状态
const result = await client.updateDynamicCard("msg123", { is_last_update: true });
```

#### 流式消息（适用于 AI Agent）

```typescript
const result = await client.createStreamMessage("staff1", "staff", "stream-id-1");
const result = await client.fetchStreamMessage("msg123");
```

#### 媒体

```typescript
// 上传
const upload = await client.uploadMediaFile("/path/to/file.pdf");

// 下载
const download = await client.downloadMediaFile("media123");

// 保存到文件
const filePath = await client.downloadMediaToFile("media123", { target_path: "/tmp/file.pdf" });

// 获取下载 URL 路径 (4.5.3)
const pathResult = await client.fetchMediaPathInfo("media123");

// 撤回消息
const result = await client.revokeMessage(["msg1", "msg2"]);
```

#### 紧急提醒 (4.6.14)

```typescript
import { REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS } from "lansenger-sdk-ts";

const result = await client.sendReminderMsg(
  "msg123",
  [REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS],
  ["staff1", "staff2"],
);
```

## 5. 群组

```typescript
// 创建群组
const group = await client.createGroup("项目讨论", "orgId", { staff_id_list: ["s1", "s2", "s3"] });

// 获取群信息与成员
const info = await client.fetchGroupInfo("groupOpenId");
const members = await client.fetchGroupMembers("groupOpenId");
const groups = await client.fetchGroupList();

// 成员检查
const result = await client.checkIsInGroup("groupOpenId", { staff_id: "staff1" });

// 更新设置
await client.updateGroupInfo("groupId", { name: "新名称", manage_mode: 1 });

// 添加/移除成员
await client.updateGroupMembers("groupId", { add_user_list: ["staff4"], del_user_list: ["staff3"] });

// 解散群组（仅群主，4.28.6）
await client.dismissGroup("groupId");
```

## 6. 日历与日程

```typescript
// 获取主日历（需要 userToken 或 userId）
const cal = await client.fetchPrimaryCalendar({ user_token: "ut" });

// 创建日程
const schedule = await client.createSchedule(
  cal.calendar_id!, "团队会议",
  { date: "2024-01-15", time: "10:00", timeZone: "Asia/Shanghai" },
  { date: "2024-01-15", time: "11:00", timeZone: "Asia/Shanghai" },
  [{ staffId: "staff1", attendeeFlag: "required" }],
  { user_token: "ut" },
);

// 获取/删除日程
const info = await client.fetchSchedule("cal1", "sch1", { user_token: "ut" });
await client.deleteSchedule("cal1", "sch1", { user_token: "ut" });

// 时间范围内的日程列表（最长 42 天）
const schedules = await client.fetchScheduleList("cal1", 1705276800000, 1707940800000, { user_token: "ut" });

// 参会人管理
const attendees = await client.fetchScheduleAttendees("cal1", "sch1", { user_token: "ut" });
await client.addScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });
await client.deleteScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });

// 更新日程 (4.23.12)
await client.updateSchedule("cal1", "sch1", { summary: "更新后的会议", user_token: "ut" });

// 更新参会人元数据 (4.23.17) — RSVP、颜色、忙闲状态、提醒
await client.updateScheduleAttendeeMeta("cal1", "sch1", {
  rsvp_status: "accept", busy_free_state: "busy", remind_times: [5, 15], user_token: "ut",
});
```

## 7. 统一待办

```typescript
import { TODO_TYPE_APPROVAL, TODO_TODO_STATUS_DONE } from "lansenger-sdk-ts";

// 创建待办任务
const todo = await client.createTodoTask(
  "审批请求", "https://app.com/a/1", "https://pc.app.com/a/1",
  ["staff1"], "org1", TODO_TYPE_APPROVAL,
);

// 更新状态（11=待阅, 12=已阅, 21=待办, 22=已办）
await client.updateTodoTaskStatus("taskId", TODO_TODO_STATUS_DONE, "org1");

// 更新内容
await client.updateTodoTask("taskId", "已更新", "l", "p", "org1");

// 删除（仅发送者）
await client.deleteTodoTask("taskId", "org1");

// 查询
const listResult = await client.fetchTodoTaskList("org1");
const task = await client.fetchTodoTaskById("taskId", "org1");
const task = await client.fetchTodoTaskBySourceId("src1", "org1");
const counts = await client.fetchTodoTaskStatusCounts("staff1", "org1");

// 执行人管理
await client.addExecutors(["staff2"], "org1", { todotask_id: "taskId" });
await client.deleteExecutors(["staff2"], "org1", { todotask_id: "taskId" });
const executors = await client.fetchExecutorList("taskId", "org1");
await client.updateExecutorStatus(
  [{ executorId: "staff1", todotaskId: "taskId", status: "22" }],
  "org1",
);
```

## 8. 聊天读取 (4.24 MCP)

```typescript
// 获取聊天列表（私聊 + 聊）
const chatList = await client.fetchChatList({ user_token: "ut" });

// 获取聊天消息
const messages = await client.fetchChatMessages({
  staff_id: "staff1", // 或 group_id: "group1"
  user_token: "ut",
});
```

## 9. 回调事件

SDK 支持纯 JSON 和 AES 加密回调载荷（蓝信 API 规范 4.10.1.4）。

### 配置

设置 `encoding_key` 和 `callback_token`（从蓝信开发者中心回调设置获取）：

```typescript
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, undefined, "BASE64_AES_KEY", "CALLBACK_TOKEN");
```

或通过环境变量：`LANSENGER_ENCODING_KEY`、`LANSENGER_CALLBACK_TOKEN`。

### 解析回调载荷（自动检测加密 vs 纯 JSON）

```typescript
import { parseCallbackPayload } from "lansenger-sdk-ts";

// 纯 JSON webhook
const events = parseCallbackPayload('{"events": [...]}');

// AES 加密载荷（使用 encodingKey 自动解密）
const events = parseCallbackPayload(encryptedData, {
  encoding_key: "BASE64_AES_KEY",
  known_app_id: "your-appid",
});
```

### 验证签名

```typescript
import { verifyCallbackSignature } from "lansenger-sdk-ts";

// sha1(sort(token, timestamp, nonce, dataEncrypt))
const isValid = verifyCallbackSignature(
  timestamp, nonce, signature, encodingKey,
  { data_encrypt: encryptedData, callback_token: "CALLBACK_TOKEN" },
);
```

### 事件类型

```typescript
const types = LansengerClient.getCallbackEventTypes(); // 25 种事件类型，13 个类别
```

## 消息类型能力矩阵

| msgType | Markdown | @提及 | 附件 | 私聊通道 | 群聊 | 备注 |
|---------|----------|-------|------|---------|------|------|
| `text` | ✗ | ✓ (群) | ✓ | 机器人、公号、用户模拟 | ✓ | 最多 6000 字节 |
| `formatText` | ✓ | ✗ | ✗ | 仅用户模拟 | ✓ | formatType=1 支持 Markdown |
| `oacard` | ✗ | ✗ | ✗ | 机器人、公号、用户模拟 | ✓ | 简单卡片带字段 |
| `appCard` | ✓ (div 标签) | ✗ | ✗ | 机器人、公号、用户模拟 | ✓ | 富卡片，支持动态更新 |
| `linkCard` | ✗ | ✗ | ✗ | 机器人、公号 | ✓ | 链接预览卡片 |
| `appArticles` | ✗ | ✗ | ✗ | 仅机器人私聊 | ✓ | 文章列表（1+ 篇） |

**群聊**支持所有消息类型。仅群聊支持 @提及。

## 配置

### 环境变量

| 变量 | 必需 | 描述 | 默认值 |
|------|------|------|--------|
| `LANSENGER_APP_ID` | ✓ | 应用/机器人 ID | — |
| `LANSENGER_APP_SECRET` | ✓ | 应用/机器人密钥 | — |
| `LANSENGER_API_GATEWAY_URL` | ✗ | API 网关 URL | `https://open.e.lanxin.cn/open/apigw` |
| `LANSENGER_PASSPORT_URL` | ✗ | 通行证 URL（OAuth2） | — |
| `LANSENGER_REDIRECT_URI` | ✗ | OAuth2 回调地址 | `http://localhost:8765` |
| `LANSENGER_ENCODING_KEY` | ✗ | 回调 AES 加密密钥 (Base64) | — |
| `LANSENGER_CALLBACK_TOKEN` | ✗ | 回调签名令牌 | — |

### 凭据与令牌持久化

默认情况下，凭据和令牌仅保存在内存中（进程退出后丢失）。启用文件持久化使用 `storePath`：

```typescript
import { LansengerClient, CredentialStore } from "lansenger-sdk-ts";

// 自动持久化到 ~/.lansenger/sdk_state.json
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, "~/.lansenger/sdk_state.json", "BASE64_AES_KEY", "CALLBACK_TOKEN");

// 或从环境变量加持久化
const client = LansengerClient.fromEnv("~/.lansenger/sdk_state.json");

// 手动 Store 操作
const store = new CredentialStore("~/.lansenger/sdk_state.json");
store.saveCredentials("app_id", "app_secret", "https://open.e.lanxin.cn/open/apigw");
store.saveUserToken("user_token", "refresh_token");
const token = store.loadAppToken(); // 过期则为 null
```

## 项目结构

```
lansenger-sdk-ts/
├── src/
│   ├── index.ts              # 所有导出
│   ├── client.ts             # LansengerClient（异步）
│   ├── config.ts             # LansengerConfig
│   ├── auth.ts               # TokenManager — appToken 生命周期
│   ├── oauth.ts              # OAuth2 辅助
│   ├── constants.ts          # API 端点、媒体类型、OAuth scope
│   ├── exceptions.ts         # LansengerError 层级
│   ├── models.ts             # 38+ 结果类类型
│   ├── http.ts               # doGet、doPost、doPostMultipart、parseApiResponse
│   ├── urlHelpers.ts         # buildApiUrl (支持 pathVars)
│   ├── contacts.ts           # 员工与组织信息 API
│   ├── departments.ts        # 部门 API
│   ├── accountMessages.ts    # 公号通道
│   ├── userMessages.ts       # 用户模拟通道
│   ├── groupMessages.ts      # 群聊通道
│   ├── media.ts              # 上传/下载
│   ├── streaming.ts          # SSE 流式
│   ├── persistence.ts        # CredentialStore — 文件持久化
│   ├── callbacks.ts          # 回调事件 — 25 种事件、AES 解密、SHA1 签名验证
│   ├── groups.ts             # 群组 API（含解散 4.28.6）
│   ├── todos.ts              # 统一待办
│   ├── calendars.ts          # 日历与日程
│   ├── reminders.ts          # 紧急提醒 (4.6.14)
│   ├── chats.ts              # 聊天读取 (4.24 MCP)
│   └── users.ts              # 用户信息
├── tests/                    # 单元测试
├── package.json
├── tsconfig.json
├── jest.config.js
├── LICENSE
└── README*.md                # 双语 README
```

## 开发

```bash
npm install
npm run build    # 编译 TypeScript → dist/
npm test         # 运行 Jest 测试
npm run lint     # 仅类型检查 (tsc --noEmit)
```

## 许可证

MIT — 详见 [LICENSE](LICENSE)。