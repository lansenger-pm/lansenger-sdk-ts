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
});