import { CredentialStore } from "../src/persistence";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function tempFilePath(): string {
  return path.join(os.tmpdir(), `lansenger_test_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe("CredentialStore", () => {
  let filePath: string;
  let store: CredentialStore;

  beforeEach(() => {
    filePath = tempFilePath();
    store = new CredentialStore(filePath);
  });

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  test("load returns empty when file missing", () => {
    expect(store.load()).toEqual({});
  });

  test("save and load", () => {
    store.save({ profiles: { default: { app_id: "a1" } }, active_profile: "default" });
    const data = store.load();
    expect(data.profiles.default.app_id).toBe("a1");
  });

  test("saveCredentials and loadCredentials", () => {
    store.saveCredentials("app1", "sec1", "https://gw", "https://pp", "ek", "ct");
    const creds = store.loadCredentials();
    expect(creds.app_id).toBe("app1");
    expect(creds.app_secret).toBe("sec1");
    expect(creds.api_gateway_url).toBe("https://gw");
    expect(creds.passport_url).toBe("https://pp");
    expect(creds.encoding_key).toBe("ek");
    expect(creds.callback_token).toBe("ct");
  });

  test("saveCredentials without optional fields", () => {
    store.saveCredentials("app1", "sec1");
    const creds = store.loadCredentials();
    expect(creds.api_gateway_url).toBe("");
    expect(creds.passport_url).toBe("");
  });

  test("hasCredentials returns true", () => {
    store.saveCredentials("app1", "sec1");
    expect(store.hasCredentials()).toBe(true);
  });

  test("hasCredentials returns false", () => {
    expect(store.hasCredentials()).toBe(false);
  });

  test("hasFullConfig returns true", () => {
    store.saveCredentials("app1", "sec1", "https://gw");
    expect(store.hasFullConfig()).toBe(true);
  });

  test("hasFullConfig returns false without gateway", () => {
    store.saveCredentials("app1", "sec1");
    expect(store.hasFullConfig()).toBe(false);
  });

  test("saveAppToken and loadAppToken", () => {
    store.saveCredentials("app1", "sec1");
    store.saveAppToken("token123", 7200, 300);
    const token = store.loadAppToken();
    expect(token).toBe("token123");
  });

  test("loadAppToken returns null when expired", () => {
    store.saveCredentials("app1", "sec1");
    store.saveAppToken("oldToken", -100, 0);
    expect(store.loadAppToken()).toBeNull();
  });

  test("loadAppToken returns null when no token", () => {
    expect(store.loadAppToken()).toBeNull();
  });

  test("saveUserToken and loadUserToken", () => {
    store.saveCredentials("app1", "sec1");
    store.saveUserToken("ut1", "rt1", 3600);
    const ut = store.loadUserToken();
    expect(ut.user_token).toBe("ut1");
    expect(ut.refresh_token).toBe("rt1");
  });

  test("saveCallbackConfig", () => {
    store.saveCredentials("app1", "sec1");
    store.saveCallbackConfig("newEk", "newCt");
    const creds = store.loadCredentials();
    expect(creds.encoding_key).toBe("newEk");
    expect(creds.callback_token).toBe("newCt");
  });

  test("listProfiles", () => {
    store.saveCredentials("app1", "sec1");
    expect(store.listProfiles()).toEqual(["default"]);
  });

  test("getActiveProfile defaults to default", () => {
    expect(store.getActiveProfile()).toBe("default");
  });

  test("setActiveProfile", () => {
    store.saveCredentials("app1", "sec1");
    store.setActiveProfile("default");
    expect(store.getActiveProfile()).toBe("default");
  });

  test("clearProfile removes profile", () => {
    store.saveCredentials("app1", "sec1");
    store.clearProfile();
    expect(store.listProfiles()).toEqual([]);
    expect(store.hasCredentials()).toBe(false);
  });

  test("clear removes file", () => {
    store.saveCredentials("app1", "sec1");
    store.clear();
    expect(fs.existsSync(filePath)).toBe(false);
  });

  test("multi-profile support", () => {
    const store2 = new CredentialStore(filePath, "prod");
    store2.saveCredentials("prodApp", "prodSec");
    const creds = store2.loadCredentials();
    expect(creds.app_id).toBe("prodApp");
    const store3 = new CredentialStore(filePath, "default");
    store3.saveCredentials("defApp", "defSec");
    expect(store3.loadCredentials().app_id).toBe("defApp");
    expect(store2.loadCredentials().app_id).toBe("prodApp");
  });

  test("migrateLegacy converts flat state to profiles", () => {
    const flatState = { app_id: "legacy1", app_secret: "legacy2", app_token: "tok" };
    fs.writeFileSync(filePath, JSON.stringify(flatState));
    const data = store.load();
    expect(data.profiles.default.app_id).toBe("legacy1");
    expect(data.profiles.default.app_secret).toBe("legacy2");
  });

  test("path property", () => {
    expect(store.path).toBe(filePath);
  });

  test("currentProfile property", () => {
    expect(store.currentProfile).toBe("default");
  });

  // ── deleteProfileByName ──────────────────────────────────────

  test("deleteProfileByName removes profile and returns true", () => {
    store.saveCredentials("app1", "sec1");
    expect(store.deleteProfileByName("default")).toBe(true);
    expect(store.listProfiles()).toEqual([]);
    expect(store.hasCredentials()).toBe(false);
  });

  test("deleteProfileByName returns false for nonexistent profile", () => {
    store.saveCredentials("app1", "sec1");
    expect(store.deleteProfileByName("ghost")).toBe(false);
    expect(store.listProfiles()).toEqual(["default"]);
  });

  test("deleteProfileByName preserves other profiles", () => {
    const storeB = new CredentialStore(filePath, "beta");
    store.saveCredentials("appA", "secA");
    storeB.saveCredentials("appB", "secB");
    expect(store.listProfiles().sort()).toEqual(["beta", "default"]);
    expect(store.deleteProfileByName("default")).toBe(true);
    expect(storeB.listProfiles()).toEqual(["beta"]);
  });

  test("deleteProfileByName falls back active_profile to default", () => {
    store.setActiveProfile("staging");
    const stagingStore = new CredentialStore(filePath, "staging");
    stagingStore.saveCredentials("appX", "secX");
    expect(store.getActiveProfile()).toBe("staging");
    expect(store.deleteProfileByName("staging")).toBe(true);
    expect(store.getActiveProfile()).toBe("default");
  });
});

// ── Multi-user userToken isolation ──────────────────────────────────────

describe("CredentialStore userToken isolation", () => {
  let filePath: string;

  beforeEach(() => {
    filePath = tempFilePath();
  });

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  test("two users in the same profile do not overwrite each other", () => {
    const store = new CredentialStore(filePath);
    store.saveUserToken("token-a", "rt-a", 7200, 300, 2592000, "staff-a");
    store.saveUserToken("token-b", "rt-b", 7200, 300, 2592000, "staff-b");

    const a = store.loadUserToken("staff-a");
    const b = store.loadUserToken("staff-b");
    expect(a.user_token).toBe("token-a");
    expect(a.staff_id).toBe("staff-a");
    expect(b.user_token).toBe("token-b");
    expect(b.staff_id).toBe("staff-b");
  });

  test("saving staff-b does not wipe staff-a's tokens", () => {
    const store = new CredentialStore(filePath);
    store.saveUserToken("token-a", "rt-a", 7200, 300, 0, "staff-a");
    store.saveUserToken("token-b", "rt-b", 7200, 300, 0, "staff-b");

    const a = store.loadUserToken("staff-a");
    expect(a.user_token).toBe("token-a");
  });

  test("updating staff-a does not affect staff-b", () => {
    const store = new CredentialStore(filePath);
    store.saveUserToken("token-a-v1", "rt-a", 7200, 300, 0, "staff-a");
    store.saveUserToken("token-b", "rt-b", 7200, 300, 0, "staff-b");

    store.saveUserToken("token-a-v2", "rt-a-v2", 7200, 300, 0, "staff-a");

    expect(store.loadUserToken("staff-a").user_token).toBe("token-a-v2");
    expect(store.loadUserToken("staff-b").user_token).toBe("token-b");
  });

  test("legacy flat format is auto-migrated on first access", () => {
    // Write legacy flat format manually before creating the store
    fs.writeFileSync(filePath, JSON.stringify({
      profiles: {
        default: {
          app_id: "app1",
          app_secret: "secret1",
          user_token: "legacy-ut",
          refresh_token: "legacy-rt",
          staff_id: "legacy-staff",
          user_token_expiry: Math.floor(Date.now() / 1000) + 7200,
          refresh_token_expiry: Math.floor(Date.now() / 1000) + 2592000,
        },
      },
      active_profile: "default",
    }, null, 2));

    const store = new CredentialStore(filePath);

    // Migration should run and return legacy token via fallback
    const got = store.loadUserToken("");
    expect(got.user_token).toBe("legacy-ut");

    // After migration, load by exact staff_id should work
    const nested = store.loadUserToken("legacy-staff");
    expect(nested.user_token).toBe("legacy-ut");
  });

  test("raw JSON structure has user_tokens nested per staff_id", () => {
    const store = new CredentialStore(filePath);
    store.saveUserToken("t-a", "r-a", 7200, 300, 0, "staff-a");
    store.saveUserToken("t-b", "r-b", 7200, 300, 0, "staff-b");

    const raw = store.load();
    const data = store["getProfileData"](raw);
    expect(typeof data.user_tokens).toBe("object");
    expect(data.user_tokens["staff-a"].user_token).toBe("t-a");
    expect(data.user_tokens["staff-b"].user_token).toBe("t-b");
  });

  test("save without staff_id writes flat fields for backward compat", () => {
    const store = new CredentialStore(filePath);
    store.saveUserToken("flat-ut", "flat-rt", 7200);
    const got = store.loadUserToken("");
    expect(got.user_token).toBe("flat-ut");
  });

  test("migration cleans stale flat fields when nested already exists (Issue #2)", () => {
    // Write a file with BOTH nested user_tokens AND flat user_token/staff_id
    const now = Math.floor(Date.now() / 1000);
    fs.writeFileSync(filePath, JSON.stringify({
      profiles: {
        default: {
          app_id: "app1",
          app_secret: "secret1",
          // Nested (old data from previous migration)
          user_tokens: {
            "staff-1": {
              user_token: "nested-old",
              refresh_token: "nested-rt",
              user_token_expiry: now + 3600,
              refresh_token_expiry: now + 86400,
            },
          },
          // Flat (written by old SDK) — has NEWER token
          user_token: "flat-new",
          refresh_token: "flat-rt-new",
          staff_id: "staff-1",
          user_token_expiry: now + 7200,
          refresh_token_expiry: now + 172800,
        },
      },
      active_profile: "default",
    }, null, 2));

    const store = new CredentialStore(filePath);
    const got = store.loadUserToken("staff-1");
    expect(got.user_token).toBe("flat-new");

    // Verify file has no flat fields after migration
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const profile = raw.profiles.default;
    expect(profile.user_token).toBeUndefined();
    expect(profile.staff_id).toBeUndefined();
  });
});