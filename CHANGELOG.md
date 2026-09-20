# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.9.0] - 2026-09-20

### Added

- **personal_todos**: 个人待办 `/xtra/tdtask/server/openapi/...` 6 个端点 — 创建、按字段编辑、用户待办分页，以及资源上传、下载 URL、预签名上传 URL。
- **client**: 6 个薄包装方法；`models` 新增 `PersonalTodoSaveResult` / `PersonalTodoListResult` / `PersonalTodoResourceResult` / `PersonalTodoUrlResult`。
- **constants**: 个人待办类型、状态、优先级、平台来源和 9MB 资源限制。

### Notes

- 个人待办与应用身份统一待办完全分离；`orgId` 必须显式传入，编辑接口的 `orgId` 位于请求体顶层。
- 服务端当前不提供个人待办完成/删除能力；成功码兼容 `0` 和旧环境写接口的 `200`。
- 创建接口 `finishTime` 默认发送 `0`，与 stage 实测可调用请求一致，不使用 `null`。

---

## [1.8.0] - 2026-09-18

### Added

- **boardrooms**: 会议室预定 V2 `/xtra/boardroom/server/openapi/v2/` 全部 11 个端点 — 会议室检索（办公区/楼层/设备/时段筛选）、详情、当日预订与停用信息、预订详情、预订与修改（单次/重复）、取消与扫码确认、我的预订分页、分级与办公区列表。
- **notes**: 多数接口需 `gradingId`（缺失报错或静默空结果）；`user_token` 传入时 body 身份字段被服务端忽略；`Fooler` 为 `Floor` 历史拼写。

---

## [1.6.0] - 2026-09-18

### Added

- **questionnaires**: 问卷系统 `/xtra/questionnaire/server/openapi/v1/` 全部 22 个端点 — 问卷管理（创建/更新、批量存题、删题、发布、撤回、结束、删除）、详情查询、官方账号与分页列表、答卷分析（records/detail/lastDetail/data/lastRecord）、预签名上传地址（PUT + Content-MD5 两步上传）。
- **client**: 全部 22 个薄包装方法；`models` 新增 13 个 `Questionnaire*` 结果类（分页五端点共用 `QuestionnairePageResult`）。
- **notes**: 创建/发布/答卷类接口需有效 `accountCode`（缺失报 3104）；题目结构为深嵌套 JSON，透传原始 dict。

---

## [1.5.0] - 2026-09-17

### Added

- **notices**: `sendNotice()` — 通知系统 `/xtra/notice/server/openapi/v1/send`，通过官方账号发送通知。支持文本/链接内容类型、手机号（≤10）/staffId+部门（≤200）两种投放范围、确认/转发/回复标志与提醒策略。服务端要求 `create_mobile` / `create_user_id` 至少填一个；`user_token` 不替代创建人字段。
- **notices**: `fetchNoticeAccounts()` — 查询组织官方账号列表（`code` 字段即发送所需的 accountCode）。
- **client**: `LansengerClient.sendNotice()` / `fetchNoticeAccounts()` 薄包装；`models` 新增 `NoticeSendResult` / `NoticeAccountListResult`。

### Fixed

- **notices**: 实测（stage 2026-09-17）服务端对缺失 `remindStatus`、以及 range 对象内缺失/为 null 的 `ccRangeList` 均无空值保护（报 `errCode=-1 unknown exception`），SDK 自动兜底：`remindStatus=0`、`ccRangeList=[]` 强制下发。
- **version**: 修正版本漂移 — `src/constants.ts` 的 `VERSION` 与 `tests/constants.test.ts` 断言停留在 1.4.3 而 `package.json` 已是 1.4.4（导致 v1.4.4 tag 无法通过 release 门禁）。三者统一到 1.5.0。

---

## [1.4.4] - 2026-08-28

### Added

- **persistence**: `CredentialStore` now supports `identity_type` credential identity persistence — new `loadIdentityType()` / `saveIdentityType()` methods and exported `VALID_IDENTITY_TYPES` constant (`personal-bot` / `org-app` / `org-bot`); empty string clears the field, invalid values throw. `loadCredentials()` now includes `identity_type`.

## [1.4.0] - 2026-07-29

### Added

- **media**: `uploadAppMediaV2()` — 4.5.5 V2 app media upload with required `userToken`, coexists with V1 (`/v2/app/medias/create`).
- **media**: `downloadMediaByShareId()` — 4.5.6 download media by share ID (`/v1/media/share/{shareId}/fetch`).
- **media**: Unit tests for both new APIs (10 tests).

## [1.3.21] - 2026-07-17

### Added

- **auth**: `UserTokenManager` now supports **external mode** — when `config.user_token` is set, `getToken()` returns the provided token directly without expiry checks or auto-refresh.

### Changed

- **client**: `queryGroups()` now delegates to `fetchGroupList()` internally (deprecated).

### Fixed

- **constants**: `VERSION` constant updated from `1.3.17` to `1.3.21` to match `package.json`.
- **docs**: README `api_gateway_url` default removed (now required, no default).

## [1.3.20] - 2026-07-16

### Changed

- **calendars**: `createSchedule` now auto-fills attendees with `[{staffId: userId, attendeeFlag: "required"}]` when attendees is empty and userId is provided.

## [1.3.19] - 2026-07-16

### Added

- **logging**: Shared debug module (`src/debug.ts`) with `setSDKDebug`/`isSDKDebug`. Client and auth debug output gated behind flag.
- **config**: Removed hardcoded `DEFAULT_API_GATEWAY_URL`. `apiGatewayUrl` must be explicitly provided.

## [1.3.18] - 2026-07-09

### Fixed

- **callbacks**: `decryptCallbackPayload` fixed double PKCS7 unpadding — Node.js `createDecipheriv` auto-pads by default, causing `_pkcs7Unpad` to run twice and fail on JSON-format payloads.
- **callbacks**: `decryptCallbackPayload` now supports JSON-format decrypted data (in addition to the documented binary format). Some platforms return `{"random":"...","orgId":"...","appId":"...","events":[...]}` instead of the binary `random(16B)+eventsLen(4B)+orgId+appId+events` structure.

## [1.3.17] - 2026-07-09

### Fixed

- **callbacks**: `bot_group_message` events now correctly extract `isAtMe`, `isAtAll`, `bots`, and `staffs` from the nested `reminder` object (was incorrectly reading from top-level, per OpenAPI 4.10.1.3 update).
- **callbacks**: `bot_group_message` parsing now maps the `magic` field.
- **callbacks**: `BotGroupMessageData` class now includes `bots`, `staffs`, and `magic` properties.
- **callbacks**: `decryptCallbackPayload` AES-CBC decrypt flow rewritten — encrypt entire blob (not partial offset), key validation supports 16/24/32 byte keys, matching Python/Go SDKs.
- **messaging**: `sendFile` cover image now only attaches for video media type (not all types).
- **messaging**: `sendMarkdown` now retries without reminder object on failure (markdown fallback).

## [1.3.14] - 2026-07-01

### Added

- **config**: `LansengerConfig.app_token` and `LansengerConfig.user_token` fields for **external token mode**.
- **auth**: `TokenManager` now supports **external mode** — `getToken()` returns externally-provided token directly.
- **messaging**: `sendApproveCard()` and `updateApproveCard()` for approveCard messages (4.6.4.12/13).
- **models**: `ApproveCardParams` and `ApproveCardUpdateParams` classes.
- **calendars**: `updateScheduleAttendees()` for batch add/delete of schedule attendees (4.23.19).
- **botCommands**: New module with `createBotCommands()`, `fetchBotCommands()`, `deleteBotCommands()` (4.37).
- **personalApps**: New module with CRUD + List methods for personal apps/bots (4.38).
- **models**: `ScheduleAttendeesUpdateResult`, `BotCommandResult`, `BotCommandQueryResult`, `PersonalAppCreateResult`, `PersonalAppInfoResult`, `PersonalAppListResult` classes.
- **cli**: `bot-command` (create/query/delete) and `personal-app` (create/update/info/delete/list) command groups.
- **cli**: `calendar update-attendees` command.
- **cli**: `--app-token` and `--user-token` global flags for external token mode.
- **tests**: Test suites for botCommands, personalApps, and updateScheduleAttendees.

### Changed

- **docs**: READMEs updated to reflect personal bots support group chat.
- **cli**: `--app-token` now triggers external mode.

### Fixed

- **auth**: `TokenManager` external mode prevents accidental auto-refresh of externally-provided tokens.
- **config**: `LansengerConfig.create()` no longer requires `app_id`/`app_secret` when `app_token` is provided.

## [1.3.13] - 2026-06-17

### Added

- **callbacks**: `BotPrivateMessageData` now includes `msg_id` and `reference_msg` fields; `BotGroupMessageData` now includes `reference_msg` field.
- **messaging**: `sendText`, `sendMarkdown`, `sendGroupMessage` now support `reminder_bot_ids` parameter for @mentioning bots.
- **messaging**: `sendText`, `sendMarkdown`, `sendBotMessage`, `sendGroupMessage` now support `ref_msg_id` parameter for replying to messages (prs5.9.0).

## [1.3.12] - 2026-06-16

### Added

- **persistence**: `CredentialStore.listUserTokens()` method to list all staffIds with stored user tokens in the current profile.
- **client**: `getUserToken(staffId="")` now accepts optional `staffId` parameter to retrieve token for a specific user. When `staffId` is provided, loads from CredentialStore and supports auto-refresh. When empty, maintains backward compatibility with single-user mode.
- **client**: `setUserTokens(..., staffId="", refreshExpiresIn=0)` now saves tokens to CredentialStore when `staffId` is provided.
- **tests**: Test suite for `listUserTokens` (empty, single user, multiple users, profile isolation, legacy migration).
- **tests**: Additional boundary tests for multi-user userToken isolation: auto-migration on save triggers flat→nested, no-staffId fallback returns first available nested entry, and non-existent staffId falls back gracefully. Matches Python SDK coverage.

## [1.3.11] - 2026-06-16

### Fixed

- **persistence**: `migrateLegacy` now always merges flat fields into nested entries, even when a nested entry already exists. Fixes stale flat fields left by old SDK after migration.

### Added

- **tests**: Test for stale flat field migration cleanup.

## [1.3.10] - 2026-06-16

### Added

- **tests**: Multi-user userToken isolation test suite covering: two users not overwriting each other, cross-staff independence, legacy flat format auto-migration, raw JSON structure verification, and backward-compatible no-staff_id fallback.

## [1.3.9] - 2026-06-16

### Fixed

- **persistence**: Fix multi-user userToken overwrite bug in `CredentialStore`. Previously `saveUserToken()` wrote tokens as flat fields in the profile, so each new OAuth2 authorization for the same app overwrote the previous user's tokens. Tokens are now stored per-staff_id in `user_tokens[staffId]` so multiple users can coexist in the same profile. Legacy flat-format stores are auto-migrated on load.

## [1.3.8] - 2026-06-15

### Added

- **persistence**: `CredentialStore.deleteProfileByName(name)` method to delete a specific profile by name. Automatically falls back to `"default"` if the deleted profile was the active one. Returns `true` on success, `false` if the profile does not exist.

## [1.3.7] - 2026-06-12

### Fixed

- **auth**: Added 300-second margin to refreshToken expiry check in `UserTokenManager.getToken()`, matching the existing UserToken margin and preventing race conditions at the exact expiry boundary.
- **build**: Rebuilt dist/ to include the auth.ts margin fix (v1.3.6 dist was stale).

## [1.3.6] - 2026-06-12

### Fixed

- **auth**: Added 300-second margin to refreshToken expiry check in `UserTokenManager.getToken()`, matching the existing UserToken margin and preventing race conditions at the exact expiry boundary.

## [1.3.5] - 2026-06-12

### Changed

- **constants**: Merged `groups_v2` endpoint category into `groups`, removing the redundant separate category. All group APIs now use the unified `"groups"` key in `API_ENDPOINTS`.

## [1.3.4] - 2026-06-10

### Fixed

- **sendText / sendFile / sendImageUrl**: Message body `mediaType` now correctly sent as `int` (1/2/3) per OpenAPI spec, while upload still uses `uploadAppMedia` (4.5.4) with string type. Added `APP_TO_MSG_MEDIA_TYPE` mapping.

## [1.3.3] - 2026-06-10

### Changed

- **sendText / sendFile**: File uploads now use app/bot upload endpoint (4.5.4) instead of core service endpoint (4.5.1). The `media_type` option type changed from `number` to `string` (values: `"file"`, `"video"`, `"image"`, `"audio"`).
- **sendImageUrl**: Uses `uploadAppMedia` (4.5.4) with `APP_MEDIA_TYPE_IMAGE` instead of `uploadMedia` (4.5.1).

### Fixed

- **guessMediaType()**: Now returns `undefined` for unknown file extensions instead of `MEDIA_TYPE_IMAGE`, allowing callers to fall back to their own default.

## [1.3.2] - 2026-06-10

### Added
- `config.redirect_uri` field + `LANSENGER_REDIRECT_URI` env var support
- `CredentialStore.saveCredentials` / `loadCredentials` now persist `redirect_uri`
- `buildAuthorizeUrl` uses `config.redirect_uri` as default fallback when `redirectUri` arg is empty
- `saveUserToken` / `loadUserToken` now persist `staff_id` — survives process restarts
- `UserTokenManager` loads/saves `staffId` from credential store

### Fixed
- Republished with rebuilt dist/ (v1.3.1 was pushed without a fresh `tsc` build)

## [1.3.1] — Skipped (missing rebuilt dist)

## [1.3.0] - 2026-06-10

### Fixed

- OAuth `local-callback` command: ensure server is started before printing authorize URL

## [1.2.9] - 2026-06-10

### Fixed

- `MEDIA_TYPE` constants: removed `MEDIA_TYPE_FILE`, changed `MEDIA_TYPE_AUDIO` to 3 (matching API 4.5.1)
- `guessMediaType` default return value fixed to `MEDIA_TYPE_IMAGE`

## [1.2.8] - 2026-06-09

### Fixed

- `GroupInfoResult` type: `location_share`, `needs_confirm`, `is_public` fields changed from `boolean` to `number`

## [1.2.6] - 2026-06-08

### Fixed

- `queryGroups` `page_offset` default changed from 1 to 0

## [1.2.5] - 2026-06-07

### Changed

- Bump version

## [1.2.4] - 2026-06-06

### Fixed

- Parameter consistency: unified `queryParams` usage
- Removed duplicate constants from `todos.ts`, now imports from `constants.ts`
- Fixed `GroupCreateInfo.org_id` type
- Fixed `FormData` import

## [1.2.2] - 2026-06-05

### Fixed

- Verified bugs from GitHub issues

## [1.2.1] - 2026-06-04

### Added

- `oauth local-callback` added `--redirect-uri` option

## [1.2.0] - 2026-06-03

### Fixed

- Token management: preserve `refreshToken` on refresh
- Subtract margin from expiry time
- Persist `refreshExpiresIn`

### Added

- `UserTokenManager` auto-refresh + `getUserToken`/`setUserTokens` API

## [1.0.0] - 2026-06-01

### Added

- Initial release
- Core platform API support: auth, messages, groups, departments, staff, calendars, todos
- Media file upload/download support
- OAuth2 user authorization flow
- Callback event parsing

[1.2.9]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.8...v1.2.9
[1.2.8]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.6...v1.2.8
[1.2.6]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.2...v1.2.4
[1.2.2]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/your-org/lansenger-sdk-ts/releases/tag/v1.0.0
