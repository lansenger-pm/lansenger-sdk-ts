# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
