/**
 * Error-code contract tests (LXBUGS-128629 / LXBUGS-128628).
 *
 * Every *Result must expose the server errCode as a structured `err_code`
 * field instead of forcing callers to regex the human-readable `error` string,
 * and the revoke API's per-message `subStatus` must not be reported as success.
 */
import { LansengerClient } from "../src/client";
import { LansengerConfig } from "../src/config";
import { FetchFn, errCodeOf } from "../src/http";
import { sendGroupMessage } from "../src/groupMessages";
import { sendUserMessage } from "../src/userMessages";
import { sendAccountMessage } from "../src/accountMessages";
import { sendReminder } from "../src/reminders";
import { SendMessageResult } from "../src/models";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async (url: string | URL) => {
    // appToken 请求单独返回，其余请求返回被测数据
    if (String(url).includes("apptoken")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ errCode: 0, data: { appToken: "cached_token", expiresIn: 7200 } }),
      } as any;
    }
    return { ok: true, status: 200, statusText: "OK", json: async () => responseData } as any;
  };
}

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

describe("errCodeOf normalisation", () => {
  test("keeps numeric codes", () => {
    expect(errCodeOf({ errCode: 59003 })).toBe(59003);
  });

  test("parses numeric strings", () => {
    expect(errCodeOf({ errCode: "59003" })).toBe(59003);
  });

  test("keeps zero", () => {
    expect(errCodeOf({ errCode: 0 })).toBe(0);
  });

  test("collapses the -1 sentinel and absent fields to null", () => {
    expect(errCodeOf({ errCode: -1 })).toBeNull();
    expect(errCodeOf({})).toBeNull();
    expect(errCodeOf({ errCode: null })).toBeNull();
    expect(errCodeOf({ errCode: "not-a-number" })).toBeNull();
    expect(errCodeOf(undefined)).toBeNull();
  });
});

describe("failure paths carry the structured code", () => {
  test("group message error", async () => {
    const result = await sendGroupMessage(config, appToken, "grp1", "text", { text: { content: "hi" } }, {
      fetchFn: mockFetchFn({ errCode: 10005, errMsg: "无权限" }),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(10005);
    expect(result.error).toContain("API error (errCode=10005)");
    expect(result.toDict().err_code).toBe(10005);
  });

  test("user message error", async () => {
    const result = await sendUserMessage(config, appToken, "utoken", "u1", "text", { text: { content: "hi" } }, {
      fetchFn: mockFetchFn({ errCode: 40060, errMsg: "格式错误" }),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(40060);
  });

  test("account message error", async () => {
    const result = await sendAccountMessage(config, appToken, "text", { text: { content: "hi" } }, {
      chat_ids: ["c1"],
      fetchFn: mockFetchFn({ errCode: 50081, errMsg: "缺少 senderId" }),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(50081);
  });

  test("reminder error", async () => {
    const result = await sendReminder(config, appToken, "m1", [1], ["u1"], {
      fetchFn: mockFetchFn({ errCode: 40060, errMsg: "消息或格式错误" }),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(40060);
  });

  test("successful result has no err_code", () => {
    const result = new SendMessageResult({ success: true, message_id: "m1" });
    expect(result.err_code).toBeNull();
    expect(result.toDict().err_code).toBeUndefined();
  });

  test("local validation error does not invent a server code", () => {
    const result = new SendMessageResult({ success: false, error: "message_ids is required" });
    expect(result.err_code).toBeNull();
  });
});

describe("revoke_message (4.6.7)", () => {
  function clientWith(payload: Record<string, any>): LansengerClient {
    const client = new LansengerClient("app1", "sec1");
    (client as any)._fetchFn = mockFetchFn(payload);
    return client;
  }

  test("group revoke without sender_id explains the bot limitation", async () => {
    const client = new LansengerClient("app1", "sec1");
    const result = await client.revokeMessage(["m1"], { chat_type: "group" });
    expect(result.success).toBe(false);
    expect(result.err_code).toBeNull();
    expect(result.error).toContain("staffId");
    expect(result.error).toContain("user_token/sender_id");
  });

  test("unknown chat_type is rejected locally", async () => {
    const client = new LansengerClient("app1", "sec1");
    const result = await client.revokeMessage(["m1"], { chat_type: "channel" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("unsupported chat_type");
  });

  test("empty message_ids is rejected", async () => {
    const client = new LansengerClient("app1", "sec1");
    const result = await client.revokeMessage([]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("message_ids is required");
  });

  test("top-level error carries err_code (59003 path)", async () => {
    const result = await clientWith({ errCode: 59003, errMsg: "当前组织禁用机器人" })
      .revokeMessage(["m1"], { chat_type: "bot" });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(59003);
    expect(result.error).toContain("当前组织禁用机器人");
  });

  test("partial subStatus failure is reported", async () => {
    const result = await clientWith({
      errCode: 0,
      data: { subStatus: [{ errCode: 0, errMsg: "ok" }, { errCode: 40060, errMsg: "消息或格式错误" }] },
    }).revokeMessage(["m1", "m2"], { chat_type: "bot" });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(40060);
    expect(result.error).toContain("1/2");
    expect(result.sub_status).toHaveLength(2);
  });

  test("all subStatus ok is success", async () => {
    const result = await clientWith({
      errCode: 0,
      data: { subStatus: [{ errCode: 0, errMsg: "ok" }] },
    }).revokeMessage(["m1"], { chat_type: "bot" });
    expect(result.success).toBe(true);
    expect(result.sub_status).toHaveLength(1);
    expect(result.toDict().sub_status[0].errCode).toBe(0);
  });
});
