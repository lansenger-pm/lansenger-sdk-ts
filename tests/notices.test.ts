import { LansengerConfig } from "../src/config";
import { API_ENDPOINTS, NOTICE_PHONE_RANGE_MAX, NOTICE_OPEN_RANGE_MAX } from "../src/constants";
import {
  sendNotice,
  fetchNoticeAccounts,
} from "../src/notices";
import { NoticeSendResult, NoticeAccountListResult } from "../src/models";
import type { FetchFn } from "../src/http";

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async () => ({ ok: true, status: 200, statusText: "OK", json: async () => responseData } as any);
}

describe("sendNotice", () => {
  test("returns error on empty title", async () => {
    const r = await sendNotice(config, appToken, { title: "", content_type: 1, account_code: "ACC001", user_type: 1, content: "c", release_phones: ["1"], create_mobile: "1" });
    expect(r.success).toBe(false);
    expect(r.error).toContain("title is required");
  });

  test("returns error on invalid content_type", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 3, account_code: "ACC001", user_type: 1, content: "c", release_phones: ["1"], create_mobile: "1" });
    expect(r.error).toContain("content_type must be 1 (text) or 2 (link)");
  });

  test("returns error when text without content", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 1, content: "", release_phones: ["1"], create_mobile: "1" });
    expect(r.error).toContain("content is required");
  });

  test("returns error when link without notice_link", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 2, account_code: "ACC001", user_type: 1, notice_link: "", release_phones: ["1"], create_mobile: "1" });
    expect(r.error).toContain("notice_link is required");
  });

  test("returns error on invalid user_type", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 3, content: "c", release_phones: ["1"], create_mobile: "1" });
    expect(r.error).toContain("user_type must be 1 (phone) or 2 (openid)");
  });

  test("returns error when phone targeting without release_phones", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 1, content: "c", release_phones: [], create_mobile: "1" });
    expect(r.error).toContain("release_phones is required");
  });

  test("returns error when phones exceed limit", async () => {
    const phones = Array.from({ length: NOTICE_PHONE_RANGE_MAX + 1 }, (_, i) => `138${String(i).padStart(8, "0")}`);
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 1, content: "c", release_phones: phones, create_mobile: "1" });
    expect(r.error).toContain("release_phones allows at most 10");
  });

  test("returns error when phone creator identity is missing", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 1, content: "c", release_phones: ["13800138000"], create_mobile: "" });
    expect(r.error).toContain("create_mobile or create_user_id is required");
  });

  test("returns error when openid targeting without release_range", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 2, content: "c", release_range: [], create_user_id: "s1" });
    expect(r.error).toContain("release_range is required");
  });

  test("returns error when openid creator identity is missing", async () => {
    const r = await sendNotice(config, appToken, { title: "t", content_type: 1, account_code: "ACC001", user_type: 2, content: "c", release_range: [{ objId: "s1", objName: "张三", objType: 1 }], create_user_id: "" });
    expect(r.error).toContain("create_mobile or create_user_id is required");
  });

  test("returns success with notice fields (phone targeting)", async () => {
    const r = await sendNotice(config, appToken, {
      title: "系统升级通知", content_type: 1, account_code: "ACC001", user_type: 1,
      content: "系统将于本周六进行升级维护",
      release_phones: ["13800138000", "13800138001"], cc_phones: ["13800138002"],
      create_mobile: "13800138000", confirm_flag: 1, remind_status: 1,
      user_token: "utok",
      fetchFn: mockFetchFn({ errCode: 0, data: { code: "NTC001", id: 1001, noticeStatus: 2, confirmStatus: 0, publishUserName: "张三" } }),
    });
    expect(r.success).toBe(true);
    expect(r.notice_code).toBe("NTC001");
    expect(r.notice_status).toBe(2);
    expect(r.publish_user_name).toBe("张三");
  });

  test("defaults remindStatus to 0 (server NPEs when absent)", async () => {
    let capturedBody: Record<string, any> | null = null;
    const capturingFetch: FetchFn = async (url, init) => {
      capturedBody = JSON.parse((init?.body as string) || "{}");
      return { ok: true, status: 200, statusText: "OK", json: async () => ({ errCode: 0, data: { code: "NTC_D" } }) } as any;
    };
    const r = await sendNotice(config, appToken, {
      title: "t", content_type: 1, account_code: "ACC001", user_type: 1,
      content: "c", release_phones: ["13800138000"], create_mobile: "1",
      fetchFn: capturingFetch,
    });
    expect(r.success).toBe(true);
    expect(capturedBody!.remindStatus).toBe(0);
    // 实测：ccRangeList 缺失同样触发服务端 NPE，必须强制下发
    expect(capturedBody!.phoneUserRange.ccRangeList).toEqual([]);
  });

  test("returns error on API error", async () => {
    const r = await sendNotice(config, appToken, {
      title: "t", content_type: 1, account_code: "ACC001", user_type: 1,
      content: "c", release_phones: ["1"], create_mobile: "1",
      fetchFn: mockFetchFn({ errCode: 3123, errMsg: "人员不存在" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=3123");
  });

  test("returns error on HTTP error", async () => {
    const fetchFn: FetchFn = async () => ({ ok: false, status: 500, statusText: "Internal Server Error", json: async () => ({}) } as any);
    const r = await sendNotice(config, appToken, {
      title: "t", content_type: 1, account_code: "ACC001", user_type: 1,
      content: "c", release_phones: ["1"], create_mobile: "1", fetchFn,
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("HTTP error");
  });
});

describe("fetchNoticeAccounts", () => {
  test("returns success with accounts", async () => {
    const r = await fetchNoticeAccounts(config, appToken, {
      org_id: "org-001",
      fetchFn: mockFetchFn({ errCode: 0, data: [{ roleName: "行政通知", officialNumberId: "1001", code: "ACC001" }] }),
    });
    expect(r.success).toBe(true);
    expect(r.total).toBe(1);
    expect(r.accounts![0].code).toBe("ACC001");
  });

  test("returns error on API error", async () => {
    const r = await fetchNoticeAccounts(config, appToken, { fetchFn: mockFetchFn({ errCode: 40001, errMsg: "Invalid token" }) });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=40001");
  });
});

describe("notice constants", () => {
  test("endpoint paths", () => {
    expect(API_ENDPOINTS.notices.send).toBe("/xtra/notice/server/openapi/v1/send");
    expect(API_ENDPOINTS.notices.accounts_fetch).toBe("/xtra/notice/server/openapi/v1/notice/account");
  });

  test("open range limit", () => {
    expect(NOTICE_OPEN_RANGE_MAX).toBe(200);
  });
});

describe("notice models", () => {
  test("NoticeSendResult toDict omits nulls", () => {
    const r = new NoticeSendResult({ success: true, notice_code: "NTC1" });
    const d = r.toDict();
    expect(d.success).toBe(true);
    expect(d.notice_code).toBe("NTC1");
    expect("title" in d).toBe(false);
    expect("raw_response" in d).toBe(false);
  });

  test("NoticeAccountListResult toDict", () => {
    const r = new NoticeAccountListResult({ success: true, total: 1, accounts: [{ code: "ACC001" }] });
    const d = r.toDict();
    expect(d.total).toBe(1);
    expect(d.accounts).toEqual([{ code: "ACC001" }]);
  });
});
