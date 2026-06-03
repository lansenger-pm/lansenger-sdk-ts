[English](README.md) | [简体中文](README.zhHans.md) | [繁体中文](README.zhHant.md) | [繁体中文香港](README.zhHantHK.md) | [Français](README.fr.md)

# lansenger-sdk-ts

Framework-independent TypeScript SDK for the Lansenger (蓝信) platform — supports Lansenger apps, organization bots, and personal bots.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green)](https://nodejs.org/)

> Zero framework dependencies — only `node-fetch` (v2, CommonJS compatible). Works with any Node.js project.

## Supported Bot Types

| Bot Type | Auth | WebSocket Inbound | All APIs |
|----------|------|-------------------|----------|
| **Lansenger App** | appToken + userToken | ✗ (uses webhook) | ✓ |
| **Organization Bot** | appToken + userToken | ✗ (uses webhook) | ✓ |
| **Personal Bot** | appToken | ✓ (WebSocket) | ✓ (limited for non-bot APIs) |

All three bot types use the same auth mechanism: `appToken` is required for every API call; `userToken` is only needed for specific user-level operations (user info, staff search, calendar, etc.).

## Features

- **Async client** — `LansengerClient` with Promise-based API
- **Credential & token persistence** — `CredentialStore` saves app_id, app_secret, URLs, appToken, userToken to file (survives restarts)
- **OAuth2 user authentication** — authorize URL, code exchange, token refresh
- **Organization & departments** — org info, department detail/children/staff
- **Staff & contacts** — basic/detailed info, ID mapping, department ancestors, search
- **Messaging** — 3 private chat channels (bot, official account, user impersonate) + group chat, all message types, @mention, human/bot sender identity, urgent reminders
- **Rich cards** — appCard (with dynamic status updates), oacard, linkCard, appArticles
- **Streaming messages** — SSE-based real-time delivery for AI agents
- **Media upload/download** — files, images, videos with auto type detection, media path fetch
- **Message management** — revoke, dynamic card update
- **Groups** — create, info, members, list, membership check, update settings & members, dismiss
- **Calendar & schedule** — primary calendar, schedule CRUD + update, attendee management + attendee metadata
- **Unified todo** — create, update, delete, query, executor management, status counts
- **Callback events** — 25 event types, structured parsing, AES decryption (per 4.10.1.4), SHA1 signature verification
- **Chat reading** — fetch chat list, fetch chat messages (4.24 MCP)

## Quick Install

```bash
npm install lansenger-sdk-ts
```

For development:

```bash
git clone https://github.com/lansenger-pm/lansenger-sdk-ts.git
cd lansenger-sdk-ts
npm install
npm run build
npm test
```

## 1. Authentication

### appToken — Required for all API calls

Every SDK method requires `appToken`. The client automatically obtains and refreshes it using your `app_id` + `app_secret`. You never need to manage appToken manually — the `TokenManager` handles the lifecycle:

1. **First call** → `GET /v1/apptoken/create` with app_id + app_secret → returns `appToken` (valid 2 hours)
2. **Subsequent calls** → reuse cached appToken until expiry
3. **Token expired** → automatically refresh via the same endpoint

```typescript
import { LansengerClient } from "lansenger-sdk-ts";

const client = new LansengerClient("your-appid", "your-secret");

// You can also get/invalidate token manually
const token = await client.getToken();
client.invalidateToken(); // force refresh on next call
```

### userToken — Only needed for specific endpoints

`userToken` represents a specific Lansenger user's authorization (obtained via OAuth2). It's only required for:
- User-level information (fetchUserInfo, fetchStaffDetail, searchStaff)
- Calendar & schedule operations (fetchPrimaryCalendar, createSchedule, etc.)
- Group operations as a human sender

### Getting Credentials

| Bot Type | How to get app_id + app_secret |
|----------|--------------------------------|
| **Personal Bot** | Lansenger desktop → Contacts → Smart Bots → Personal Bots → click ℹ️ icon (mobile client does NOT show credentials) |
| **Lansenger App** | Create at [Lansenger Developer Center](https://dev.lanxin.cn) — may require organization admin approval |
| **Organization Bot** | Create at [Lansenger Developer Center](https://dev.lanxin.cn) — may require organization admin approval |

### OAuth2 user-level auth

```typescript
// Build authorize URL — redirect user to Lansenger passport
const url = client.buildAuthorizeUrl("https://myapp.com/callback");

// After user authorizes, exchange code for userToken + refreshToken
const tokenResult = await client.exchangeCode("auth_code_from_callback");

// Refresh expired userToken
const newToken = await client.refreshUserToken(tokenResult.refresh_token!);

// Fetch user profile
const userInfo = await client.fetchUserInfo(tokenResult.user_token!);
```

### Factory methods

```typescript
// From environment variables (LANSENGER_APP_ID, LANSENGER_APP_SECRET, etc.)
const client = LansengerClient.fromEnv();

// From a LansengerConfig object
const config = new LansengerConfig("appid", "secret", "https://open.e.lanxin.cn/open/apigw");
const client = LansengerClient.fromConfig(config);

// From a CredentialStore (reads persisted credentials)
const client = LansengerClient.fromStore();
```

## 2. Organization & Departments

```typescript
// Organization info
const org = await client.fetchOrgInfo("orgId");

// Department hierarchy
const detail = await client.fetchDepartmentDetail("deptId");
const children = await client.fetchDepartmentChildren("deptId");
const staffs = await client.fetchDepartmentStaffs("deptId");
```

## 3. Staff & Contacts

```typescript
// Basic staff info
const staff = await client.fetchStaffBasicInfo("staffOpenId");

// Detailed profile (userToken recommended)
const detail = await client.fetchStaffDetail("staffOpenId", { user_token: "ut" });

// Map phone → staffId
const mapping = await client.fetchStaffIdMapping("orgId", "mobile", "13800138000");

// Department ancestors for a staff member
const ancestors = await client.fetchDepartmentAncestors("staffOpenId");

// Search staff (requires userToken)
const results = await client.searchStaff("Zhang San", { user_token: "ut" });

// Org extra field IDs
const fields = await client.fetchOrgExtraFieldIds("orgId");
```

## 4. Messaging & Media

#### Bot private chat — most common

```typescript
const result = await client.sendText("staff123", "Hello!");
const result = await client.sendMarkdown("staff123", "**Bold**");
const result = await client.sendFile("staff123", "/path/to/report.pdf");
```

#### Public account channel

```typescript
const result = await client.sendAccountMessage(
  "text", { text: { content: "System notice" } },
  ["staff1", "staff2"], // chat_ids
  undefined,            // department_ids
  { account_id: "524288-xxxx" },
);
```

#### User impersonate channel (requires userToken)

```typescript
const result = await client.sendUserMessage(
  "staff456", "text", { text: { content: "Hello" } },
  { user_token: "ut" }, // required
);
```

#### Group chat

```typescript
// Bot → group
const result = await client.sendText("group123", "Notice", { is_group: true });

// Human → group (with userToken)
const result = await client.sendGroupMessage(
  "group123", "text", { text: { content: "I'll handle it" } },
  { user_token: "ut" },
);

// @mention in group
const result = await client.sendText(
  "group123", "Important!", { is_group: true, reminder_all: true },
);
```

#### Rich cards

```typescript
const result = await client.sendAppCard("staff123", "Approval", { is_dynamic: true });
const result = await client.sendLinkCard("staff123", "Article", "https://...");
const result = await client.sendAppArticles("staff123", [{ title: "Article 1", link: "..." }]);

// Update dynamic card status
const result = await client.updateDynamicCard("msg123", { is_last_update: true });
```

#### Streaming messages (for AI agents)

```typescript
const result = await client.createStreamMessage("staff1", "staff", "stream-id-1");
const result = await client.fetchStreamMessage("msg123");
```

#### Media

```typescript
// Upload
const upload = await client.uploadMediaFile("/path/to/file.pdf");

// Download
const download = await client.downloadMediaFile("media123");

// Save to file
const filePath = await client.downloadMediaToFile("media123", { target_path: "/tmp/file.pdf" });

// Get download URL path (4.5.3)
const pathResult = await client.fetchMediaPathInfo("media123");

// Revoke messages
const result = await client.revokeMessage(["msg1", "msg2"]);
```

#### Urgent reminders (4.6.14)

```typescript
import { REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS } from "lansenger-sdk-ts";

const result = await client.sendReminderMsg(
  "msg123",
  [REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS],
  ["staff1", "staff2"],
);
```

## 5. Groups

```typescript
// Create group
const group = await client.createGroup("Project Chat", "orgId", { staff_id_list: ["s1", "s2", "s3"] });

// Fetch info & members
const info = await client.fetchGroupInfo("groupOpenId");
const members = await client.fetchGroupMembers("groupOpenId");
const groups = await client.fetchGroupList();

// Check membership
const result = await client.checkIsInGroup("groupOpenId", { staff_id: "staff1" });

// Update settings
await client.updateGroupInfo("groupId", { name: "New Name", manage_mode: 1 });

// Add/remove members
await client.updateGroupMembers("groupId", { add_user_list: ["staff4"], del_user_list: ["staff3"] });

// Dismiss/delete group (owner only, 4.28.6)
await client.dismissGroup("groupId");
```

## 6. Calendar & Schedule

```typescript
// Get primary calendar (requires userToken or userId)
const cal = await client.fetchPrimaryCalendar({ user_token: "ut" });

// Create schedule
const schedule = await client.createSchedule(
  cal.calendar_id!, "Team Meeting",
  { date: "2024-01-15", time: "10:00", timeZone: "Asia/Shanghai" },
  { date: "2024-01-15", time: "11:00", timeZone: "Asia/Shanghai" },
  [{ staffId: "staff1", attendeeFlag: "required" }],
  { user_token: "ut" },
);

// Fetch/delete schedule
const info = await client.fetchSchedule("cal1", "sch1", { user_token: "ut" });
await client.deleteSchedule("cal1", "sch1", { user_token: "ut" });

// Schedule list in time range (max 42 days)
const schedules = await client.fetchScheduleList("cal1", 1705276800000, 1707940800000, { user_token: "ut" });

// Attendee management
const attendees = await client.fetchScheduleAttendees("cal1", "sch1", { user_token: "ut" });
await client.addScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });
await client.deleteScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });

// Update schedule (4.23.12)
await client.updateSchedule("cal1", "sch1", { summary: "Updated Meeting", user_token: "ut" });

// Update attendee metadata (4.23.17) — RSVP, color, busy/free, reminders
await client.updateScheduleAttendeeMeta("cal1", "sch1", {
  rsvp_status: "accept", busy_free_state: "busy", remind_times: [5, 15], user_token: "ut",
});
```

## 7. Unified Todo

```typescript
import { TODO_TYPE_APPROVAL, TODO_TODO_STATUS_DONE } from "lansenger-sdk-ts";

// Create todo task
const todo = await client.createTodoTask(
  "Approval Request", "https://app.com/a/1", "https://pc.app.com/a/1",
  ["staff1"], "org1", TODO_TYPE_APPROVAL,
);

// Update status (11=pending-read, 12=read, 21=pending-do, 22=done)
await client.updateTodoTaskStatus("taskId", TODO_TODO_STATUS_DONE, "org1");

// Update content
await client.updateTodoTask("taskId", "Updated", "l", "p", "org1");

// Delete (sender only)
await client.deleteTodoTask("taskId", "org1");

// Query
const listResult = await client.fetchTodoTaskList("org1");
const task = await client.fetchTodoTaskById("taskId", "org1");
const task = await client.fetchTodoTaskBySourceId("src1", "org1");
const counts = await client.fetchTodoTaskStatusCounts("staff1", "org1");

// Executor management
await client.addExecutors(["staff2"], "org1", { todotask_id: "taskId" });
await client.deleteExecutors(["staff2"], "org1", { todotask_id: "taskId" });
const executors = await client.fetchExecutorList("taskId", "org1");
await client.updateExecutorStatus(
  [{ executorId: "staff1", todotaskId: "taskId", status: "22" }],
  "org1",
);
```

## 8. Chat Reading (4.24 MCP)

```typescript
// Fetch chat list (private + group conversations)
const chatList = await client.fetchChatList({ user_token: "ut" });

// Fetch chat messages
const messages = await client.fetchChatMessages({
  staff_id: "staff1", // or group_id: "group1"
  user_token: "ut",
});
```

## 9. Callback Events

The SDK supports both plain JSON and AES-encrypted callback payloads (per Lansenger API spec 4.10.1.4).

### Configuration

Set `encoding_key` and `callback_token` (from Lansenger Developer Center callback settings):

```typescript
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, undefined, "BASE64_AES_KEY", "CALLBACK_TOKEN");
```

Or via environment variables: `LANSENGER_ENCODING_KEY`, `LANSENGER_CALLBACK_TOKEN`.

### Parse callback payload (auto-detects encrypted vs plain JSON)

```typescript
import { parseCallbackPayload } from "lansenger-sdk-ts";

// Plain JSON webhook
const events = parseCallbackPayload('{"events": [...]}');

// AES-encrypted payload (auto-decrypts with encodingKey)
const events = parseCallbackPayload(encryptedData, {
  encoding_key: "BASE64_AES_KEY",
  known_app_id: "your-appid",
});
```

### Verify signature

```typescript
import { verifyCallbackSignature } from "lansenger-sdk-ts";

// sha1(sort(token, timestamp, nonce, dataEncrypt))
const isValid = verifyCallbackSignature(
  timestamp, nonce, signature, encodingKey,
  { data_encrypt: encryptedData, callback_token: "CALLBACK_TOKEN" },
);
```

### Event types

```typescript
const types = LansengerClient.getCallbackEventTypes(); // 25 event types across 13 categories
```

## Message Type Capability Matrix

| msgType | Markdown | @mention | Attachments | Private Channels | Group Chat | Notes |
|---------|----------|----------|-------------|------------------|------------|-------|
| `text` | ✗ | ✓ (group) | ✓ | Bot, Official Account, User Impersonate | ✓ | Up to 6000 bytes |
| `formatText` | ✓ | ✗ | ✗ | User Impersonate only | ✓ | Markdown via formatType=1 |
| `oacard` | ✗ | ✗ | ✗ | Bot, Official Account, User Impersonate | ✓ | Simple card with fields |
| `appCard` | ✓ (div tags) | ✗ | ✗ | Bot, Official Account, User Impersonate | ✓ | Rich card, dynamic updates |
| `linkCard` | ✗ | ✗ | ✗ | Bot, Official Account | ✓ | Link preview card |
| `appArticles` | ✗ | ✗ | ✗ | Bot private only | ✓ | Article list (1+ articles) |

**Group chat** supports all message types. Only group chat supports @mention.

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `LANSENGER_APP_ID` | ✓ | App/Bot ID | — |
| `LANSENGER_APP_SECRET` | ✓ | App/Bot Secret | — |
| `LANSENGER_API_GATEWAY_URL` | ✗ | API Gateway URL | `https://open.e.lanxin.cn/open/apigw` |
| `LANSENGER_PASSPORT_URL` | ✗ | Passport URL (for OAuth2) | — |
| `LANSENGER_ENCODING_KEY` | ✗ | Callback AES encryption key (Base64) | — |
| `LANSENGER_CALLBACK_TOKEN` | ✗ | Callback signature token | — |

### Credential & Token Persistence

By default, credentials and tokens stay in memory only (lost on process exit). Enable file persistence with `storePath`:

```typescript
import { LansengerClient, CredentialStore } from "lansenger-sdk-ts";

// Auto-persist to ~/.lansenger/sdk_state.json
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, "~/.lansenger/sdk_state.json", "BASE64_AES_KEY", "CALLBACK_TOKEN");

// Or from env with persistence
const client = LansengerClient.fromEnv("~/.lansenger/sdk_state.json");

// Manual store operations
const store = new CredentialStore("~/.lansenger/sdk_state.json");
store.saveCredentials("app_id", "app_secret", "https://open.e.lanxin.cn/open/apigw");
store.saveUserToken("user_token", "refresh_token");
const token = store.loadAppToken(); // null if expired
```

## Project Structure

```
lansenger-sdk-ts/
├── src/
│   ├── index.ts              # All exports
│   ├── client.ts             # LansengerClient (async)
│   ├── config.ts             # LansengerConfig
│   ├── auth.ts               # TokenManager — appToken lifecycle
│   ├── oauth.ts              # OAuth2 helpers
│   ├── constants.ts          # API endpoints, media types, OAuth scopes
│   ├── exceptions.ts         # LansengerError hierarchy
│   ├── models.ts             # 38+ result class types
│   ├── http.ts               # doGet, doPost, doPostMultipart, parseApiResponse
│   ├── urlHelpers.ts         # buildApiUrl with pathVars support
│   ├── contacts.ts           # Staff & org info APIs
│   ├── departments.ts        # Department APIs
│   ├── accountMessages.ts    # Public account channel
│   ├── userMessages.ts        # User impersonate channel
│   ├── groupMessages.ts      # Group chat channel
│   ├── media.ts              # Upload/download
│   ├── streaming.ts          # SSE streaming
│   ├── persistence.ts        # CredentialStore — file-based persistence
│   ├── callbacks.ts          # Callback events — 25 event types, AES decryption, SHA1 verification
│   ├── groups.ts             # Group APIs (including dismiss 4.28.6)
│   ├── todos.ts              # Unified Todo
│   ├── calendars.ts          # Calendar & Schedule
│   ├── reminders.ts          # Urgent message reminders (4.6.14)
│   ├── chats.ts              # Chat reading (4.24 MCP)
│   └── users.ts              # User info
├── tests/                    # Unit tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── LICENSE
└── README.md
```

## Development

```bash
npm install
npm run build    # Compile TypeScript → dist/
npm test         # Run Jest tests
npm run lint     # Type-check only (tsc --noEmit)
```

## License

MIT — see [LICENSE](LICENSE).