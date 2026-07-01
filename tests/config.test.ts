import { LansengerConfig } from "../src/config";
import { LansengerConfigError } from "../src/exceptions";

describe("LansengerConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("create with direct params", () => {
    const cfg = LansengerConfig.create("app123", "secret456");
    expect(cfg.app_id).toBe("app123");
    expect(cfg.app_secret).toBe("secret456");
    expect(cfg.api_gateway_url).toBe("https://open.e.lanxin.cn/open/apigw");
    expect(cfg.http_timeout).toBe(30.0);
  });

  test("create with all params", () => {
    const cfg = LansengerConfig.create("app1", "sec1", "https://custom.gateway", "https://passport", 60, "encKey", "cbToken");
    expect(cfg.api_gateway_url).toBe("https://custom.gateway");
    expect(cfg.passport_url).toBe("https://passport");
    expect(cfg.http_timeout).toBe(60);
    expect(cfg.encoding_key).toBe("encKey");
    expect(cfg.callback_token).toBe("cbToken");
  });

  test("create from env vars", () => {
    process.env.LANSENGER_APP_ID = "envApp";
    process.env.LANSENGER_APP_SECRET = "envSecret";
    process.env.LANSENGER_API_GATEWAY_URL = "https://env.gateway";
    process.env.LANSENGER_ENCODING_KEY = "envEncKey";
    const cfg = LansengerConfig.create();
    expect(cfg.app_id).toBe("envApp");
    expect(cfg.app_secret).toBe("envSecret");
    expect(cfg.api_gateway_url).toBe("https://env.gateway");
    expect(cfg.encoding_key).toBe("envEncKey");
  });

  test("create throws when no credentials", () => {
    process.env.LANSENGER_APP_ID = "";
    process.env.LANSENGER_APP_SECRET = "";
    expect(() => LansengerConfig.create()).toThrow(LansengerConfigError);
  });

  test("create throws when missing app_id", () => {
    expect(() => LansengerConfig.create("", "secret")).toThrow(LansengerConfigError);
  });

  test("fromEnv delegates to create", () => {
    process.env.LANSENGER_APP_ID = "envId";
    process.env.LANSENGER_APP_SECRET = "envSec";
    const cfg = LansengerConfig.fromEnv();
    expect(cfg.app_id).toBe("envId");
    expect(cfg.app_secret).toBe("envSec");
  });

  test("isConfigured returns true with both fields", () => {
    const cfg = new LansengerConfig("app1", "sec1");
    expect(cfg.isConfigured()).toBe(true);
  });

  test("isConfigured returns false with empty app_id", () => {
    const cfg = new LansengerConfig("", "sec1");
    expect(cfg.isConfigured()).toBe(false);
  });

  test("isConfigured returns false with empty app_secret", () => {
    const cfg = new LansengerConfig("app1", "");
    expect(cfg.isConfigured()).toBe(false);
  });

  test("hasPassportUrl returns true when set", () => {
    const cfg = new LansengerConfig("app1", "sec1", "", "https://passport");
    expect(cfg.hasPassportUrl()).toBe(true);
  });

  test("hasPassportUrl returns false when empty", () => {
    const cfg = new LansengerConfig("app1", "sec1");
    expect(cfg.hasPassportUrl()).toBe(false);
  });

  test("constructor defaults", () => {
    const cfg = new LansengerConfig("a", "s");
    expect(cfg.api_gateway_url).toBe("https://open.e.lanxin.cn/open/apigw");
    expect(cfg.passport_url).toBe("");
    expect(cfg.http_timeout).toBe(30.0);
    expect(cfg.encoding_key).toBe("");
    expect(cfg.callback_token).toBe("");
  });

  test("external mode: app_token only, no credentials needed", () => {
    const cfg = LansengerConfig.create(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "ext_tok");
    expect(cfg.app_token).toBe("ext_tok");
    expect(cfg.isExternalMode()).toBe(true);
    expect(cfg.isConfigured()).toBe(false);
  });

  test("external mode via LANSENGER_APP_TOKEN env var", () => {
    process.env.LANSENGER_APP_TOKEN = "env_ext_tok";
    const cfg = LansengerConfig.create();
    expect(cfg.app_token).toBe("env_ext_tok");
    expect(cfg.isExternalMode()).toBe(true);
  });

  test("external mode with credentials too", () => {
    const cfg = LansengerConfig.create("app", "sec", undefined, undefined, undefined, undefined, undefined, undefined, "tok");
    expect(cfg.isExternalMode()).toBe(true);
    expect(cfg.isConfigured()).toBe(true);
  });

  test("user_token field", () => {
    const cfg = LansengerConfig.create("a", "s", undefined, undefined, undefined, undefined, undefined, undefined, undefined, "user_tok");
    expect(cfg.user_token).toBe("user_tok");
  });

  test("user_token via LANSENGER_USER_TOKEN env var", () => {
    process.env.LANSENGER_USER_TOKEN = "env_ut";
    const cfg = LansengerConfig.create("a", "s");
    expect(cfg.user_token).toBe("env_ut");
  });

  test("still requires credentials without app_token", () => {
    expect(() => LansengerConfig.create()).toThrow(LansengerConfigError);
  });
});