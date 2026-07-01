import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import { createBotCommands, fetchBotCommands, deleteBotCommands } from "../src/botCommands";

function makeConfig(): LansengerConfig {
  return new LansengerConfig("test_app", "test_secret");
}

function mockFetchFn(data: Record<string, any>): FetchFn {
  return async () => ({ ok: true, status: 200, statusText: "OK", json: async () => data } as any);
}

describe("createBotCommands", () => {
  test("returns error on invalid scope_type", async () => {
    const result = await createBotCommands(makeConfig(), "tok", 0, [{ command: "/test" }]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("scope_type");
  });

  test("returns error on empty commands", async () => {
    const result = await createBotCommands(makeConfig(), "tok", 7, []);
    expect(result.success).toBe(false);
    expect(result.error).toContain("commands");
  });

  test("returns success", async () => {
    const result = await createBotCommands(makeConfig(), "tok", 7, [{ command: "/add" }], {
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "ok" }),
    });
    expect(result.success).toBe(true);
  });

  test("returns success with chat params", async () => {
    const result = await createBotCommands(makeConfig(), "tok", 1, [{ command: "/add" }], {
      chat_id: "524288-xxx", chat_type: "group", staff_id: "524288-yyy",
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "ok" }),
    });
    expect(result.success).toBe(true);
  });

  test("returns error on API error", async () => {
    const result = await createBotCommands(makeConfig(), "tok", 7, [{ command: "/test" }], {
      fetchFn: mockFetchFn({ errCode: 10000, errMsg: "error" }),
    });
    expect(result.success).toBe(false);
  });
});

describe("fetchBotCommands", () => {
  test("returns error on invalid scope_type", async () => {
    const result = await fetchBotCommands(makeConfig(), "tok", 8);
    expect(result.success).toBe(false);
  });

  test("returns success with commands", async () => {
    const result = await fetchBotCommands(makeConfig(), "tok", 7, {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: { scopeType: 7, commands: [{ command: "/add", description: "desc" }] },
      }),
    });
    expect(result.success).toBe(true);
    expect(result.scope_type).toBe(7);
    expect(result.commands!.length).toBe(1);
  });
});

describe("deleteBotCommands", () => {
  test("returns error on invalid scope_type", async () => {
    const result = await deleteBotCommands(makeConfig(), "tok", 8);
    expect(result.success).toBe(false);
  });

  test("returns success", async () => {
    const result = await deleteBotCommands(makeConfig(), "tok", 7, {
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "ok" }),
    });
    expect(result.success).toBe(true);
  });
});
