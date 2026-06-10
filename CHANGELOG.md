# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- 修复 OAuth `local-callback` 命令：确保服务器成功启动后再输出授权链接

## [1.2.9] - 2026-06-10

### Fixed

- 修复 `MEDIA_TYPE` 常量：移除 `MEDIA_TYPE_FILE`，`MEDIA_TYPE_AUDIO` 改为 3（匹配 API 4.5.1）
- 修复 `guessMediaType` 默认返回值为 `MEDIA_TYPE_IMAGE`

## [1.2.8] - 2026-06-09

### Fixed

- 修复 `GroupInfoResult` 类型定义：`location_share`、`needs_confirm`、`is_public` 字段从 `boolean` 改为 `number`

## [1.2.6] - 2026-06-08

### Fixed

- 修复 `queryGroups` 的 `page_offset` 默认值从 1 改为 0

## [1.2.5] - 2026-06-07

### Changed

- 更新版本号

## [1.2.4] - 2026-06-06

### Fixed

- 修复参数传递一致性，统一使用 `queryParams`
- 移除 `todos.ts` 中重复的常量定义，统一从 `constants.ts` 导入
- 修复 `GroupCreateInfo.org_id` 类型
- 修复 `FormData` 导入问题

## [1.2.2] - 2026-06-05

### Fixed

- 修复 GitHub issues 中的已验证 bug

## [1.2.1] - 2026-06-04

### Added

- `oauth local-callback` 添加 `--redirect-uri` 选项

## [1.2.0] - 2026-06-03

### Fixed

- 修复 token 管理 bug：刷新时保留 `refreshToken`
- 从过期时间中减去余量
- 持久化 `refreshExpiresIn`

### Added

- `UserTokenManager` 自动刷新 + `getUserToken`/`setUserTokens` API

## [1.0.0] - 2026-06-01

### Added

- 初始版本发布
- 支持核心平台 API：认证、消息、群组、部门、员工、日历、待办等
- 支持媒体文件上传下载
- 支持 OAuth2 用户授权流程
- 支持回调事件解析

[1.2.9]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.8...v1.2.9
[1.2.8]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.6...v1.2.8
[1.2.6]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.2...v1.2.4
[1.2.2]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/your-org/lansenger-sdk-ts/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/your-org/lansenger-sdk-ts/releases/tag/v1.0.0
