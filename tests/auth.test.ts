import { TokenManager } from "../src/auth";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import { LansengerAuthError, LansengerNetworkError } from "../src/exceptions";

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

function mockErrorFetchFn(status: number, body: Record<string, any>): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    return {
      ok: false,
      status,
      statusText: "Error",
      json: async () => body,
    } as any;
  };
}

const config = new LansengerConfig("test_app", "test_secret");

describe("TokenManager", () => {
  test("getToken returns token on success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { appToken: "tok123", expiresIn: 7200 },
    });
    const tm = new TokenManager(config, fetchFn);
    const token = await tm.getToken();
    expect(token).toBe("tok123");
  });

  test("getToken caches token", async () => {
    let callCount = 0;
    const fetchFn: FetchFn = async (url, init?) => {
      callCount++;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ errCode: 0, data: { appToken: "cached_tok", expiresIn: 7200 } }),
      } as any;
    };
    const tm = new TokenManager(config, fetchFn);
    await tm.getToken();
    await tm.getToken();
    expect(callCount).toBe(1);
  });

  test("getToken refreshes after expiry", async () => {
    let callCount = 0;
    const fetchFn: FetchFn = async (url, init?) => {
      callCount++;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ errCode: 0, data: { appToken: `tok_${callCount}`, expiresIn: 7200 } }),
      } as any;
    };
    const tm = new TokenManager(config, fetchFn);
    const t1 = await tm.getToken();
    tm.invalidate();
    const t2 = await tm.getToken();
    expect(t1).toBe("tok_1");
    expect(t2).toBe("tok_2");
    expect(callCount).toBe(2);
  });

  test("getToken throws LansengerAuthError on errCode != 0", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "invalid app_id" });
    const tm = new TokenManager(config, fetchFn);
    await expect(tm.getToken()).rejects.toThrow(LansengerAuthError);
  });

  test("getToken throws LansengerNetworkError on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500, {});
    const tm = new TokenManager(config, fetchFn);
    await expect(tm.getToken()).rejects.toThrow(LansengerNetworkError);
  });

  test("getToken throws LansengerAuthError when appToken missing", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const tm = new TokenManager(config, fetchFn);
    await expect(tm.getToken()).rejects.toThrow(LansengerAuthError);
  });

  test("invalidate clears token", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { appToken: "tok1", expiresIn: 7200 },
    });
    const tm = new TokenManager(config, fetchFn);
    await tm.getToken();
    tm.invalidate();
    let callCount = 0;
    const fetchFn2: FetchFn = async () => {
      callCount++;
      return { ok: true, status: 200, json: async () => ({ errCode: 0, data: { appToken: "tok2", expiresIn: 7200 } }) } as any;
    };
    const tm2 = new TokenManager(config, fetchFn2);
    await tm2.getToken();
    expect(callCount).toBe(1);
  });

  test("constructor with CredentialStore loads cached token", async () => {
    const { CredentialStore } = await import("../src/persistence");
    const tmpPath = `/tmp/lansenger_auth_test_${Date.now()}.json`;
    const store = new CredentialStore(tmpPath);
    store.saveCredentials("test_app", "test_secret");
    store.saveAppToken("cached_token", 7200, 0);
    const fetchFn: FetchFn = async () => {
      return { ok: true, status: 200, json: async () => ({ errCode: 0, data: { appToken: "new_tok", expiresIn: 7200 } }) } as any;
    };
    const tm = new TokenManager(config, fetchFn, store);
    const token = await tm.getToken();
    expect(token).toBe("new_tok");
    const fs = await import("fs");
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  test("getToken throws LansengerNetworkError on fetch exception", async () => {
    const fetchFn: FetchFn = async () => { throw new Error("connection reset"); };
    const tm = new TokenManager(config, fetchFn);
    await expect(tm.getToken()).rejects.toThrow(LansengerNetworkError);
  });
});