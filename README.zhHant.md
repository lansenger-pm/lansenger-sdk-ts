[English](README.md) | [简体中文](README.zhHans.md) | [繁体中文](README.zhHant.md) | [繁体中文香港](README.zhHantHK.md) | [Français](README.fr.md)

# lansenger-sdk-ts

藍信（Lansenger）平臺的 TypeScript SDK — 支援 藍信應用、組織機器人 及 個人機器人。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green)](https://nodejs.org/)

> 零框架依賴——僅依賴 `node-fetch` (v2，CommonJS 相容)。可適配任何 Node.js 專案。

## 支援的機器人類型

| 機器人類型 | 認證 | WebSocket 入站 | 所有 API |
|------------|------|-----------------|----------|
| **藍信應用** | appToken + userToken | ✗（使用 webhook） | ✓ |
| **組織機器人** | appToken + userToken | ✗（使用 webhook） | ✓ |
| **個人機器人** | appToken | ✓（WebSocket） | ✓（非機器人 API 有部分限制） |

三種機器人類型使用相同的認證機制：每次 API 呼叫都需要 `appToken`；`userToken` 僅在特定使用者級操作時需要（使用者資訊、員工搜尋、日曆等）。

## 功能特色

- **異步客戶端** — `LansengerClient` 提供 Promise 化 API
- **憑證與令牌持久化** — `CredentialStore` 將 app_id、app_secret、URL、appToken、userToken 保存至檔案（重啟不丟失）
- **OAuth2 使用者認證** — 構建授權 URL、換取 userToken、刷新令牌
- **組織與部門** — 組織資訊、部門詳情/子部門/員工
- **員工與通訊錄** — 基礎/詳細資訊、ID 映射、部門祖先鏈、搜尋
- **訊息傳遞** — 3 種私聊通道（機器人、公眾號、人→人）+ 群聊，支援所有訊息類型，含 @提及和真人/機器人發送身分，加急提醒
- **富卡片** — appCard（支援動態狀態更新）、oacard、linkCard、appArticles
- **流式訊息** — SSE 即時投遞，專為 AI Agent 設計
- **媒體上傳/下載** — 檔案、圖片、影片，自動偵測類型，媒體路徑取得
- **訊息管理** — 撤回、動態卡片更新
- **群組** — 建立、查詢資訊/成員/列表、檢查成員、更新設定與成員、解散
- **日曆日程** — 主日曆、日程 CRUD + 更新、參會人管理 + 參會人元資料
- **統一待辦** — 建立、更新、刪除、查詢、執行人管理、狀態統計
- **回調事件** — 25 種事件類型、結構化解析、AES 解密（4.10.1.4）、SHA1 簽名驗證
- **聊天讀取** — 取得聊天列表、取得聊天訊息（4.24 MCP）

## 快速安裝

```bash
npm install lansenger-sdk-ts
```

開發模式：

```bash
git clone https://github.com/lansenger-pm/lansenger-sdk-ts.git
cd lansenger-sdk-ts
npm install
npm run build
npm test
```

## 1. 認證

### appToken — 所有 API 呼叫均需

每個 SDK 方法都需要 `appToken`。客戶端使用 `app_id` + `app_secret` 自動取得並刷新 appToken，透過 `GET /v1/apptoken/create` 端點。你無需手動管理 appToken — `TokenManager` 負責整個生命週期：

1. **首次呼叫** → 使用 app_id + app_secret 請求 `GET /v1/apptoken/create` → 回傳 `appToken`（有效期 2 小時）
2. **後續呼叫** → 重用緩衝的 appToken 直到過期
3. **令牌過期** → 自動透過同一端點刷新

```typescript
import { LansengerClient } from "lansenger-sdk-ts";

const client = new LansengerClient("你的-appid", "你的-secret");

// 也可以手動取得/失效令牌
const token = await client.getToken();
client.invalidateToken(); // 強制下次呼叫時刷新
```

### userToken — 僅在特定端點需要

`userToken` 代表特定藍信使用者的授權（透過 OAuth2 取得）。僅在以下場景需要：
- 使用者級資訊（fetchUserInfo、fetchStaffDetail、searchStaff）
- 日曆與日程操作（fetchPrimaryCalendar、createSchedule 等）
- 作為真人發送者的群組操作

### 取得憑證

| 機器人類型 | 如何取得 app_id + app_secret |
|------------|-------------------------------|
| **個人機器人** | 藍信桌面端 → 通訊錄 → 智能機器人 → 個人機器人 → 點擊右側 ℹ️ 圖標（行動端不支援查看憑證） |
| **藍信應用** | 在藍信開發者中心建立，可能需要向組織管理員申請 |
| **組織機器人** | 在藍信開發者中心建立，可能需要向組織管理員申請 |

### OAuth2 使用者級認證

```typescript
// 構建授權 URL——將使用者重定向到藍信通行證頁面
const url = client.buildAuthorizeUrl("https://myapp.com/callback");

// 使用者授權後，用 code 換取 userToken + refreshToken
const tokenResult = await client.exchangeCode("回調中的授權碼");

// 刷新過期的 userToken
const newToken = await client.refreshUserToken(tokenResult.refresh_token!);

// 取得使用者資料
const userInfo = await client.fetchUserInfo(tokenResult.user_token!);
```

### 工廠方法

```typescript
// 從環境變數（LANSENGER_APP_ID、LANSENGER_APP_SECRET 等）
const client = LansengerClient.fromEnv();

// 從 LansengerConfig 物件
const config = new LansengerConfig("appid", "secret", "https://open.e.lanxin.cn/open/apigw");
const client = LansengerClient.fromConfig(config);

// 從 CredentialStore（讀取持久化憑證）
const client = LansengerClient.fromStore();
```

## 2. 組織與部門

```typescript
// 組織資訊
const org = await client.fetchOrgInfo("orgId");

// 部門層級
const detail = await client.fetchDepartmentDetail("deptId");
const children = await client.fetchDepartmentChildren("deptId");
const staffs = await client.fetchDepartmentStaffs("deptId");
```

## 3. 員工與通訊錄

```typescript
// 基本員工資訊
const staff = await client.fetchStaffBasicInfo("staffOpenId");

// 詳細資料（建議使用 userToken）
const detail = await client.fetchStaffDetail("staffOpenId", { user_token: "ut" });

// 手機號 → staffId 映射
const mapping = await client.fetchStaffIdMapping("orgId", "mobile", "13800138000");

// 員工的部門祖先鏈
const ancestors = await client.fetchDepartmentAncestors("staffOpenId");

// 搜尋員工（需要 userToken）
const results = await client.searchStaff("張三", { user_token: "ut" });

// 組織擴展欄位 ID
const fields = await client.fetchOrgExtraFieldIds("orgId");
```

## 4. 訊息與媒體

#### 機器人私聊——最常用

```typescript
const result = await client.sendText("staff123", "你好！");
const result = await client.sendMarkdown("staff123", "**加粗**");
const result = await client.sendFile("staff123", "/path/to/report.pdf");
```

#### 公眾號通道

```typescript
const result = await client.sendAccountMessage(
  "text", { text: { content: "系統通知" } },
  ["staff1", "staff2"], undefined,
  { account_id: "524288-xxxx" },
);
```

#### 人→人代發通道（需要 userToken）

```typescript
const result = await client.sendUserMessage(
  "staff456", "text", { text: { content: "你好" } },
  { user_token: "ut" },
);
```

#### 群聊

```typescript
// 機器人 → 群組
const result = await client.sendText("group123", "通知", { is_group: true });

// 真人 → 群組（需要 userToken）
const result = await client.sendGroupMessage(
  "group123", "text", { text: { content: "我來處理" } },
  { user_token: "ut" },
);

// 群聊 @提及
const result = await client.sendText("group123", "重要！", { is_group: true, reminder_all: true });
```

#### 富卡片

```typescript
const result = await client.sendAppCard("staff123", "審批", { is_dynamic: true });
const result = await client.sendLinkCard("staff123", "文章", "https://...");
const result = await client.sendAppArticles("staff123", [{ title: "文章1", link: "..." }]);

// 更新動態卡片狀態
const result = await client.updateDynamicCard("msg123", { is_last_update: true });
```

#### 流式訊息（用於 AI Agent）

```typescript
const result = await client.createStreamMessage("staff1", "staff", "stream-id-1");
const result = await client.fetchStreamMessage("msg123");
```

#### 媒體

```typescript
// 上傳
const upload = await client.uploadMediaFile("/path/to/file.pdf");

// 下載
const download = await client.downloadMediaFile("media123");

// 保存至檔案
const filePath = await client.downloadMediaToFile("media123", { target_path: "/tmp/file.pdf" });

// 取得下載 URL 路徑 (4.5.3)
const pathResult = await client.fetchMediaPathInfo("media123");

// 撤回訊息
const result = await client.revokeMessage(["msg1", "msg2"]);
```

#### 加急提醒 (4.6.14)

```typescript
import { REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS } from "lansenger-sdk-ts";

const result = await client.sendReminderMsg(
  "msg123",
  [REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS],
  ["staff1", "staff2"],
);
```

## 5. 群組

```typescript
// 建立群組
const group = await client.createGroup("專案討論", "orgId", { staff_id_list: ["s1", "s2", "s3"] });

// 取得資訊與成員
const info = await client.fetchGroupInfo("groupOpenId");
const members = await client.fetchGroupMembers("groupOpenId");
const groups = await client.fetchGroupList();

// 成員檢查
const result = await client.checkIsInGroup("groupOpenId", { staff_id: "staff1" });

// 更新設定
await client.updateGroupInfo("groupId", { name: "新名稱", manage_mode: 1 });

// 新增/移除成員
await client.updateGroupMembers("groupId", { add_user_list: ["staff4"], del_user_list: ["staff3"] });

// 解散群組（僅群主，4.28.6）
await client.dismissGroup("groupId");
```

## 6. 日曆日程

```typescript
// 取得主日曆（需要 userToken 或 userId）
const cal = await client.fetchPrimaryCalendar({ user_token: "ut" });

// 建立日程
const schedule = await client.createSchedule(
  cal.calendar_id!, "團隊會議",
  { date: "2024-01-15", time: "10:00", timeZone: "Asia/Shanghai" },
  { date: "2024-01-15", time: "11:00", timeZone: "Asia/Shanghai" },
  [{ staffId: "staff1", attendeeFlag: "required" }],
  { user_token: "ut" },
);

// 取得/刪除日程
const info = await client.fetchSchedule("cal1", "sch1", { user_token: "ut" });
await client.deleteSchedule("cal1", "sch1", { user_token: "ut" });

// 時間範圍內的日程列表（最多 42 天）
const schedules = await client.fetchScheduleList("cal1", 1705276800000, 1707940800000, { user_token: "ut" });

// 參會人管理
const attendees = await client.fetchScheduleAttendees("cal1", "sch1", { user_token: "ut" });
await client.addScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });
await client.deleteScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });

// 更新日程 (4.23.12)
await client.updateSchedule("cal1", "sch1", { summary: "更新後的會議", user_token: "ut" });

// 更新參會人元資料 (4.23.17) — RSVP、顏色、忙/閒狀態、提醒
await client.updateScheduleAttendeeMeta("cal1", "sch1", {
  rsvp_status: "accept", busy_free_state: "busy", remind_times: [5, 15], user_token: "ut",
});
```

## 7. 統一待辦

```typescript
import { TODO_TYPE_APPROVAL, TODO_TODO_STATUS_DONE } from "lansenger-sdk-ts";

// 建立待辦任務
const todo = await client.createTodoTask(
  "審批請求", "https://app.com/a/1", "https://pc.app.com/a/1",
  ["staff1"], "org1", TODO_TYPE_APPROVAL,
);

// 更新狀態（11=待閱, 12=已閱, 21=待辦, 22=已辦）
await client.updateTodoTaskStatus("taskId", TODO_TODO_STATUS_DONE, "org1");

// 更新內容
await client.updateTodoTask("taskId", "已更新", "l", "p", "org1");

// 刪除（僅限發送者）
await client.deleteTodoTask("taskId", "org1");

// 查詢
const listResult = await client.fetchTodoTaskList("org1");
const task = await client.fetchTodoTaskById("taskId", "org1");
const task = await client.fetchTodoTaskBySourceId("src1", "org1");
const counts = await client.fetchTodoTaskStatusCounts("staff1", "org1");

// 執行人管理
await client.addExecutors(["staff2"], "org1", { todotask_id: "taskId" });
await client.deleteExecutors(["staff2"], "org1", { todotask_id: "taskId" });
const executors = await client.fetchExecutorList("taskId", "org1");
await client.updateExecutorStatus(
  [{ executorId: "staff1", todotaskId: "taskId", status: "22" }],
  "org1",
);
```

## 8. 聊天讀取 (4.24 MCP)

```typescript
// 取得聊天列表（私聊 + 群聊）
const chatList = await client.fetchChatList({ user_token: "ut" });

// 取得聊天訊息
const messages = await client.fetchChatMessages({
  staff_id: "staff1", // 或 group_id: "group1"
  user_token: "ut",
});
```

## 9. 回調事件

SDK 同時支援純 JSON 和 AES 加密回調載荷（藍信 API 規範 4.10.1.4）。

### 配置

設定 `encoding_key` 和 `callback_token`（從藍信開發者中心回調設定取得）：

```typescript
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, undefined, "BASE64_AES_KEY", "CALLBACK_TOKEN");
```

也可透過環境變數：`LANSENGER_ENCODING_KEY`、`LANSENGER_CALLBACK_TOKEN`。

### 解析回調載荷（自動辨識加密/明文）

```typescript
import { parseCallbackPayload } from "lansenger-sdk-ts";

// 純 JSON webhook
const events = parseCallbackPayload('{"events": [...]}');

// AES 加密載荷（使用 encodingKey 自動解密）
const events = parseCallbackPayload(encryptedData, {
  encoding_key: "BASE64_AES_KEY",
  known_app_id: "your-appid",
});
```

### 驗證簽名

```typescript
import { verifyCallbackSignature } from "lansenger-sdk-ts";

// sha1(sort(token, timestamp, nonce, dataEncrypt))
const isValid = verifyCallbackSignature(
  timestamp, nonce, signature, encodingKey,
  { data_encrypt: encryptedData, callback_token: "CALLBACK_TOKEN" },
);
```

### 事件類型

```typescript
const types = LansengerClient.getCallbackEventTypes(); // 25 種事件類型，13 個類別
```

## 訊息類型能力矩陣

| msgType | Markdown | @提及 | 附件 | 私聊通道 | 群聊 | 備註 |
|---------|----------|-------|------|----------|------|------|
| `text` | ✗ | ✓ (群) | ✓ | 機器人、公眾號、人→人 | ✓ | 上限 6000 字節 |
| `formatText` | ✓ | ✗ | ✗ | 僅人→人 | ✓ | formatType=1 支援 Markdown |
| `oacard` | ✗ | ✗ | ✗ | 機器人、公眾號、人→人 | ✓ | 簡單卡片含欄位 |
| `appCard` | ✓ (div 標籤) | ✗ | ✗ | 機器人、公眾號、人→人 | ✓ | 富卡片，支援動態更新 |
| `linkCard` | ✗ | ✗ | ✗ | 機器人、公眾號 | ✓ | 連結預覽卡片 |
| `appArticles` | ✗ | ✗ | ✗ | 僅機器人私聊 | ✓ | 文章列表（1+ 篇） |

**群聊**支援所有訊息類型。只有群聊支援 @提及。

## 配置

### 環境變數

| 變數 | 必填 | 說明 | 預設值 |
|------|------|------|--------|
| `LANSENGER_APP_ID` | ✓ | 應用/機器人 ID | — |
| `LANSENGER_APP_SECRET` | ✓ | 應用/機器人密鑰 | — |
| `LANSENGER_API_GATEWAY_URL` | ✗ | API 网關 URL | `https://open.e.lanxin.cn/open/apigw` |
| `LANSENGER_PASSPORT_URL` | ✗ | 通行證 URL（OAuth2） | — |
| `LANSENGER_REDIRECT_URI` | ✗ | OAuth2 回調地址 | `http://localhost:8765` |
| `LANSENGER_ENCODING_KEY` | ✗ | 回調 AES 加密密鑰 (Base64) | — |
| `LANSENGER_CALLBACK_TOKEN` | ✗ | 回調簽名令牌 | — |

### 憑證與令牌持久化

預設情況下，憑證和令牌僅保留在記憶體中（程式退出即消失）。啟用檔案持久化使用 `storePath`：

```typescript
import { LansengerClient, CredentialStore } from "lansenger-sdk-ts";

// 自動持久化至 ~/.lansenger/sdk_state.json
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, "~/.lansenger/sdk_state.json", "BASE64_AES_KEY", "CALLBACK_TOKEN");

// 或從環境變數加持久化
const client = LansengerClient.fromEnv("~/.lansenger/sdk_state.json");

// 手動 Store 操作
const store = new CredentialStore("~/.lansenger/sdk_state.json");
store.saveCredentials("app_id", "app_secret", "https://open.e.lanxin.cn/open/apigw");
store.saveUserToken("user_token", "refresh_token");
const token = store.loadAppToken(); // 過期則為 null
```

## 專案結構

```
lansenger-sdk-ts/
├── src/
│   ├── index.ts              # 所有导出
│   ├── client.ts             # LansengerClient（異步）
│   ├── config.ts             # LansengerConfig
│   ├── auth.ts               # TokenManager — appToken 生命週期
│   ├── oauth.ts              # OAuth2 輔助
│   ├── constants.ts          # API 端點、媒體類型、OAuth scope
│   ├── exceptions.ts         # LansengerError 層級
│   ├── models.ts             # 38+ 結果類型
│   ├── http.ts               # doGet、doPost、doPostMultipart、parseApiResponse
│   ├── urlHelpers.ts         # buildApiUrl (支援 pathVars)
│   ├── contacts.ts           # 員工與組織資訊 API
│   ├── departments.ts        # 部門 API
│   ├── accountMessages.ts    # 公眾號通道
│   ├── userMessages.ts       # 人→人通道
│   ├── groupMessages.ts      # 群聊通道
│   ├── media.ts              # 上傳/下載
│   ├── streaming.ts          # SSE 流式
│   ├── persistence.ts        # CredentialStore — 檔案持久化
│   ├── callbacks.ts          # 回調事件 — 25 種事件、AES 解密、SHA1 簽名驗證
│   ├── groups.ts             # 群組 API（含解散 4.28.6）
│   ├── todos.ts              # 統一待辦
│   ├── calendars.ts          # 日曆與日程
│   ├── reminders.ts          # 加急提醒 (4.6.14)
│   ├── chats.ts              # 聊天讀取 (4.24 MCP)
│   └── users.ts              # 使用者資訊
├── tests/                    # 單元測試
├── package.json
├── tsconfig.json
├── jest.config.js
├── LICENSE
└── README*.md                # 5 語言 README
```

## 開發

```bash
npm install
npm run build    # 編譯 TypeScript → dist/
npm test         # 執行 Jest 測試
npm run lint     # 僅類型檢查 (tsc --noEmit)
```

## 授權

MIT — 見 [LICENSE](LICENSE)。