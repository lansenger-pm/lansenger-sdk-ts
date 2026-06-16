# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
