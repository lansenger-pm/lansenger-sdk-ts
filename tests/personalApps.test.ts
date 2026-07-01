import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import { createPersonalApp, updatePersonalApp, fetchPersonalApp, deletePersonalApp, fetchPersonalAppList } from "../src/personalApps";

function makeConfig(): LansengerConfig {
  return new LansengerConfig("test_app", "test_secret");
}

function mockFetchFn(data: Record<string, any>): FetchFn {
  return async () => ({ ok: true, status: 200, statusText: "OK", json: async () => data } as any);
}

describe("createPersonalApp", () => {
  test("returns error on empty user_token", async () => {
    const result = await createPersonalApp(makeConfig(), "tok", { user_token: "" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("user_token");
  });

  test("returns success with app data", async () => {
    const result = await createPersonalApp(makeConfig(), "tok", {
      user_token: "utok", name: "MyApp",
      fetchFn: mockFetchFn({ errCode: 0, data: { id: "app1", secret: "sec1", apigwAddr: "https://gw", passportAddr: "https://pp" } }),
    });
    expect(result.success).toBe(true);
    expect(result.app_id).toBe("app1");
    expect(result.secret).toBe("sec1");
  });
});

describe("updatePersonalApp", () => {
  test("returns error on empty app_id", async () => {
    const result = await updatePersonalApp(makeConfig(), "tok", "", { user_token: "utok", name: "n" });
    expect(result.success).toBe(false);
  });

  test("returns success", async () => {
    const result = await updatePersonalApp(makeConfig(), "tok", "app1", {
      user_token: "utok", name: "NewName",
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "ok" }),
    });
    expect(result.success).toBe(true);
  });
});

describe("fetchPersonalApp", () => {
  test("returns success with app info", async () => {
    const result = await fetchPersonalApp(makeConfig(), "tok", "app1", {
      fetchFn: mockFetchFn({ errCode: 0, data: { name: "MyApp", description: "desc", apigwAddr: "https://gw", passportAddr: "https://pp" } }),
    });
    expect(result.success).toBe(true);
    expect(result.name).toBe("MyApp");
  });
});

describe("deletePersonalApp", () => {
  test("returns error on empty app_id", async () => {
    const result = await deletePersonalApp(makeConfig(), "tok", "");
    expect(result.success).toBe(false);
  });

  test("returns success", async () => {
    const result = await deletePersonalApp(makeConfig(), "tok", "app1", {
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "ok" }),
    });
    expect(result.success).toBe(true);
  });
});

describe("fetchPersonalAppList", () => {
  test("returns error on empty user_token", async () => {
    const result = await fetchPersonalAppList(makeConfig(), "tok", { user_token: "" });
    expect(result.success).toBe(false);
  });

  test("returns success with app list", async () => {
    const result = await fetchPersonalAppList(makeConfig(), "tok", {
      user_token: "utok",
      fetchFn: mockFetchFn({ errCode: 0, data: { appList: [{ appId: "a1", appName: "App1", description: "d1" }] } }),
    });
    expect(result.success).toBe(true);
    expect(result.app_list!.length).toBe(1);
  });
});
