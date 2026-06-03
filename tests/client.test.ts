import { LansengerClient } from "../src/client";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import { TokenManager } from "../src/auth";
import { LansengerConfigError } from "../src/exceptions";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => responseData,
    } as any;
  };
}

function mockTokenFetchFn(): FetchFn {
  return mockFetchFn({
    errCode: 0,
    data: { appToken: "app_tok_123", expiresIn: 7200 },
  });
}

const originalEnv = process.env;

describe("LansengerClient", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("constructor creates config", () => {
    const client = new LansengerClient("app1", "sec1");
    expect(client.config.app_id).toBe("app1");
    expect(client.config.app_secret).toBe("sec1");
    expect(client.config.api_gateway_url).toBe("https://open.e.lanxin.cn/open/apigw");
  });

  test("constructor with custom gateway", () => {
    const client = new LansengerClient("app1", "sec1", "https://custom.api", "https://pp", 60);
    expect(client.config.api_gateway_url).toBe("https://custom.api");
    expect(client.config.passport_url).toBe("https://pp");
    expect(client.config.http_timeout).toBe(60);
  });

  test("constructor with encodingKey and callbackToken", () => {
    const client = new LansengerClient("app1", "sec1", "", "", 30, undefined, "ek1", "ct1");
    expect(client.config.encoding_key).toBe("ek1");
    expect(client.config.callback_token).toBe("ct1");
  });

  test("fromEnv creates client from env", () => {
    process.env.LANSENGER_APP_ID = "envApp";
    process.env.LANSENGER_APP_SECRET = "envSec";
    const client = LansengerClient.fromEnv();
    expect(client.config.app_id).toBe("envApp");
    expect(client.config.app_secret).toBe("envSec");
  });

  test("fromConfig creates client from config", () => {
    const cfg = new LansengerConfig("c1", "c2", "https://gw");
    const client = LansengerClient.fromConfig(cfg);
    expect(client.config.app_id).toBe("c1");
    expect(client.config.api_gateway_url).toBe("https://gw");
  });

  test("fromStore throws when no credentials", () => {
    const tmpPath = `/tmp/lansenger_client_test_${Date.now()}.json`;
    expect(() => LansengerClient.fromStore("default", tmpPath)).toThrow(LansengerConfigError);
    const fs = require("fs");
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  test("config property", () => {
    const client = new LansengerClient("a", "s");
    expect(client.config).toBeInstanceOf(LansengerConfig);
  });

  test("getToken works with mock fetch", async () => {
    const client = new LansengerClient("app1", "sec1");
    client["_fetchFn"] = mockTokenFetchFn();
    client["_tokenManager"] = new TokenManager(client.config, client["_fetchFn"]!);
    const token = await client.getToken();
    expect(token).toBe("app_tok_123");
  });

  test("invalidateToken resets token", () => {
    const client = new LansengerClient("app1", "sec1");
    client.invalidateToken();
    expect(client["_tokenManager"]).toBeNull();
  });

  test("sendText with mock", async () => {
    const client = new LansengerClient("app1", "sec1");
    const tokenFetch = mockTokenFetchFn();
    const sendFetch = mockFetchFn({ errCode: 0, data: { msgId: "msg1" } });
    let callIdx = 0;
    const combinedFetch: FetchFn = async (url, init?) => {
      callIdx++;
      if (callIdx === 1) return tokenFetch(url, init);
      return sendFetch(url, init);
    };
    client["_fetchFn"] = combinedFetch;
    client["_tokenManager"] = new TokenManager(client.config, combinedFetch);
    const result = await client.sendText("chat1", "hello");
    expect(result.success).toBe(true);
    expect(result.message_id).toBe("msg1");
  });

  test("sendMarkdown with mock", async () => {
    const client = new LansengerClient("app1", "sec1");
    const tokenFetch = mockTokenFetchFn();
    const sendFetch = mockFetchFn({ errCode: 0, data: { msgId: "msg2" } });
    let callIdx = 0;
    const combinedFetch: FetchFn = async (url, init?) => {
      callIdx++;
      if (callIdx === 1) return tokenFetch(url, init);
      return sendFetch(url, init);
    };
    client["_fetchFn"] = combinedFetch;
    client["_tokenManager"] = new TokenManager(client.config, combinedFetch);
    const result = await client.sendMarkdown("chat1", "**bold**");
    expect(result.success).toBe(true);
    expect(result.message_id).toBe("msg2");
  });

  test("sendText with group option", async () => {
    const client = new LansengerClient("app1", "sec1");
    const tokenFetch = mockTokenFetchFn();
    const sendFetch = mockFetchFn({ errCode: 0, data: { msgId: "msg3" } });
    let callIdx = 0;
    const combinedFetch: FetchFn = async (url, init?) => {
      callIdx++;
      if (callIdx === 1) return tokenFetch(url, init);
      return sendFetch(url, init);
    };
    client["_fetchFn"] = combinedFetch;
    client["_tokenManager"] = new TokenManager(client.config, combinedFetch);
    const result = await client.sendText("g1", "hello", { is_group: true });
    expect(result.success).toBe(true);
  });

  test("revokeMessage with mock", async () => {
    const client = new LansengerClient("app1", "sec1");
    const tokenFetch = mockTokenFetchFn();
    const sendFetch = mockFetchFn({ errCode: 0, data: {} });
    let callIdx = 0;
    const combinedFetch: FetchFn = async (url, init?) => {
      callIdx++;
      if (callIdx === 1) return tokenFetch(url, init);
      return sendFetch(url, init);
    };
    client["_fetchFn"] = combinedFetch;
    client["_tokenManager"] = new TokenManager(client.config, combinedFetch);
    const result = await client.revokeMessage(["msg1", "msg2"]);
    expect(result.success).toBe(true);
  });

  test("queryGroups with mock", async () => {
    const client = new LansengerClient("app1", "sec1");
    const tokenFetch = mockTokenFetchFn();
    const queryFetch = mockFetchFn({
      errCode: 0,
      data: { totalGroupIds: 3, groupIds: ["g1", "g2", "g3"] },
    });
    let callIdx = 0;
    const combinedFetch: FetchFn = async (url, init?) => {
      callIdx++;
      if (callIdx === 1) return tokenFetch(url, init);
      return queryFetch(url, init);
    };
    client["_fetchFn"] = combinedFetch;
    client["_tokenManager"] = new TokenManager(client.config, combinedFetch);
    const result = await client.queryGroups();
    expect(result.success).toBe(true);
    expect(result.total_group_ids).toBe(3);
    expect(result.group_ids).toEqual(["g1", "g2", "g3"]);
  });

  test("parseCallbackPayload static method", () => {
    const payload = JSON.stringify({
      events: [{ eventType: "staff_modify", data: { staffId: "s1", timestamp: "100" } }],
    });
    const events = LansengerClient.parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("staff_modify");
  });

  test("verifyCallbackSignature static method", () => {
    const crypto = require("crypto");
    const token = "t";
    const ts = "12345";
    const nonce = "abc";
    const data = "d";
    const params = [token, ts, nonce, data];
    params.sort();
    const sig = crypto.createHash("sha1").update(params.join(""), "utf8").digest("hex");
    const result = LansengerClient.verifyCallbackSignature(ts, nonce, sig, token, { data_encrypt: data });
    expect(result).toBe(true);
  });

  test("getCallbackEventTypes static method", () => {
    const types = LansengerClient.getCallbackEventTypes();
    expect(types).toBeDefined();
    expect(types.bot_private_message).toBe("bot");
  });

  test("validateCallbackState static method", () => {
    expect(LansengerClient.validateCallbackState("state1", "state1")).toBe(true);
    expect(LansengerClient.validateCallbackState("state1", "state2")).toBe(false);
  });

  test("buildAuthorizeUrl", () => {
    const client = new LansengerClient("app1", "sec1", "", "https://pp");
    const url = client.buildAuthorizeUrl("https://redirect");
    expect(url).toContain("https://pp");
    expect(url).toContain("redirect_uri");
    expect(url).toContain("appid=app1");
  });

  test("parseAuthorizeCallback static method", () => {
    const result = LansengerClient.parseAuthorizeCallback({ code: "abc", state: "xyz" });
    expect(result.code).toBe("abc");
    expect(result.state).toBe("xyz");
  });
});