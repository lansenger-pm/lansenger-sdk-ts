# AGENTS.md — lansenger-sdk-ts

TypeScript SDK for the Lansenger Smart Bot API. Published to npm as `lansenger-sdk-ts`.

## How to run

- Install dev: `npm install`
- Tests: `npx jest`
- Build: `npm run build` (tsc → `dist/`)
- Publish: `npm publish --access public`

## Tech stack

TypeScript, ts-jest, tsc build, node-fetch. No bundler — `dist/` ships compiled `.js` + `.d.ts`.

## Layout

- `src/` — SDK source (`client.ts`, `config.ts`, `auth.ts`, `chats.ts`, `models.ts`, `constants.ts`)
- `tests/` — jest suite
- `package.json` — version + packaging
- `dist/` — build output (gitignored, published to npm)

## Release rules — CRITICAL

### Version numbers live in MULTIPLE places — update ALL of them together

Before publishing a release, every one of these must hold the same version:

| File | Symbol |
|--------|--------|
| `package.json` | `"version": "x.y.z"` |
| `src/constants.ts` | `export const VERSION = "x.y.z"` |
| `tests/constants.test.ts` | `expect(VERSION).toBe("x.y.z")` |

Forgetting any one of these causes either a stale runtime version constant or a red
test. npm does not allow re-uploading a version — if a version was already published
with a mistake, bump to the next patch.

### NEVER publish without a full green test run

`npx jest` MUST pass (0 failures) before `npm publish`. No exceptions — not "the
failure is just a version string", not "I'll fix it in the next release". A red test
run means the release is not ready. Build (`npm run build`) is not a substitute for tests.

### Pass-through (external token) mode

`LansengerClient` constructor takes `appId`/`appSecret` as optional (default `""`).
When `appToken` is provided, the client enters pass-through mode without requiring
`appId`/`appSecret`. `LansengerConfig.create()` enforces that at least one of
(appId+appSecret) or appToken is given. Keep the constructor and `LansengerConfig`
in sync — do not re-introduce required positional `appId`/`appSecret`.

## Current status

v1.4.3 released. Pass-through init bug fixed (appId/appSecret now optional).
