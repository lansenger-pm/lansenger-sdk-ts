/**
 * 智能录音 / 智能语音（API 规范 4.60）模块与 client 域方法测试。
 *
 * 全部走 mock http 层：不触网、不使用真实凭证、不打真实 API。
 * 覆盖：6 接口成功解析 / 错误 envelope（err_code 透传）/ 可选字段缺失 /
 *       分页参数（body pageSize vs query page_size）/ 鉴权 query（app_token + user_token）/
 *       本地必填校验 / HTTP 层失败 / client 域方法接线。
 */
import { LansengerClient } from "../src/client";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import {
  createSummaryTask,
  createTranscriptionTask,
  fetchRecordingDetail,
  fetchRecordingList,
  fetchRecordingTags,
  fetchRecordingTemplates,
} from "../src/smartRecordings";
import {
  SmartRecordingDetailResult,
  SmartRecordingListResult,
  SmartRecordingSummaryResult,
  SmartRecordingTagListResult,
  SmartRecordingTemplateListResult,
  SmartRecordingTranscribeResult,
} from "../src/models";

interface Capture {
  url?: string;
  method?: string;
  body?: any;
}

function jsonResponse(data: Record<string, any>): any {
  return { ok: true, status: 200, statusText: "OK", json: async () => data } as any;
}

function mockFetchFn(responseData: Record<string, any>, capture?: Capture): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    if (capture) {
      capture.url = String(url);
      capture.method = init?.method;
      if (init?.body && typeof init.body === "string") capture.body = JSON.parse(init.body);
    }
    return jsonResponse(responseData);
  };
}

function httpErrorFetchFn(status: number = 500): FetchFn {
  return async () => ({
    ok: false,
    status,
    statusText: "Internal Server Error",
    json: async () => ({}),
  } as any);
}

const config = new LansengerConfig("test_app", "test_secret");
const APP_TOKEN = "app_token_123";
const USER_TOKEN = "user_token_456";

function ok(data: Record<string, any>): Record<string, any> {
  return { errCode: 0, errMsg: "ok", data };
}

function err(errCode: number, errMsg: string): Record<string, any> {
  return { errCode, errMsg };
}

/** 录音元素：包含大整数 createTime（微秒）与开放 ID，用于验证「原样透传、不解析不截断」。 */
const RECORDING = {
  recordingId: "1234567890123456789-987654321",
  name: "产品评审会",
  sn: "SN-001",
  deviceName: "智能录音笔",
  duration: 3_600_000,
  state: 4,
  convertState: 4,
  summaryState: 2,
  chapterState: 1,
  shared: 0,
  createTime: 1_730_000_000_000_000,
  modifyTime: 1_730_000_100_000_000,
  tagIds: ["tag-1", "tag-2"],
  templateId: "tpl-1",
  recordingMarker: "W10=",
  audioId: "media-audio-1",
  transcriptionId: "media-trans-1",
  hasAudio: true,
  hasTranscription: true,
  hasSummary: false,
  hasChapters: false,
};

describe("fetchRecordingList (4.60.1)", () => {
  test("解析录音列表并带上 app_token + user_token", async () => {
    const capture: Capture = {};
    const result = await fetchRecordingList(config, APP_TOKEN, {
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({ recordings: [RECORDING], total: 1, hasMore: false }), capture),
    });

    expect(capture.method).toBe("POST");
    expect(capture.url).toContain("/v1/smart_recording/recordings/fetch");
    expect(capture.url).toContain(`app_token=${APP_TOKEN}`);
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
    expect(capture.body).toEqual({ page: 1, pageSize: 20 });
    expect(result.success).toBe(true);
    expect(result.err_code).toBeNull();
    expect(result.recordings).toHaveLength(1);
    expect(result.recordings![0].recordingId).toBe(RECORDING.recordingId);
    expect(result.recordings![0].createTime).toBe(1_730_000_000_000_000);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.raw_response!.errCode).toBe(0);
  });

  test("分页参数透传 page/pageSize", async () => {
    const capture: Capture = {};
    await fetchRecordingList(config, APP_TOKEN, {
      page: 3,
      pageSize: 100,
      fetchFn: mockFetchFn(ok({ recordings: [], hasMore: true }), capture),
    });
    expect(capture.body).toEqual({ page: 3, pageSize: 100 });
  });

  test("空列表 + hasMore=true 是合法翻页信号（只认 hasMore）", async () => {
    const result = await fetchRecordingList(config, APP_TOKEN, {
      fetchFn: mockFetchFn(ok({ recordings: [], hasMore: true })),
    });
    expect(result.success).toBe(true);
    expect(result.recordings).toEqual([]);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBeNull();
  });

  test("错误 envelope 透传 err_code 与 errMsg", async () => {
    const result = await fetchRecordingList(config, APP_TOKEN, {
      fetchFn: mockFetchFn(err(10005, "无权限")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(10005);
    expect(result.error).toContain("API error (errCode=10005)");
    expect(result.error).toContain("无权限");
    expect(result.toDict().success).toBe(false);
    expect(result.toDict().err_code).toBe(10005);
  });

  test("未传 user_token 时不带 user_token query（鉴权失败交由服务端判定）", async () => {
    const capture: Capture = {};
    await fetchRecordingList(config, APP_TOKEN, { fetchFn: mockFetchFn(ok({ recordings: [] }), capture) });
    expect(capture.url).toContain(`app_token=${APP_TOKEN}`);
    expect(capture.url).not.toContain("user_token=");
  });

  test("HTTP 层失败不带 err_code", async () => {
    const result = await fetchRecordingList(config, APP_TOKEN, { fetchFn: httpErrorFetchFn(500) });
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP error: 500");
    expect(result.err_code).toBeNull();
    expect(result.recordings).toBeNull();
  });
});

describe("fetchRecordingDetail (4.60.2)", () => {
  test("解析录音详情，开放 ID 原样进路径（不解析不截断）", async () => {
    const capture: Capture = {};
    const result = await fetchRecordingDetail(config, APP_TOKEN, {
      recordingId: RECORDING.recordingId,
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({ recording: RECORDING }), capture),
    });

    expect(capture.url).toContain(`/v1/smart_recording/recordings/${RECORDING.recordingId}/fetch`);
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
    expect(result.success).toBe(true);
    expect(result.recording).not.toBeNull();
    expect(result.recording!.recordingId).toBe(RECORDING.recordingId);
    expect(result.recording!.duration).toBe(3_600_000);
    expect(result.recording!.convertState).toBe(4);
    expect(result.recording!.templateId).toBe("tpl-1");
    expect(result.recording!.tagIds).toEqual(["tag-1", "tag-2"]);
    expect(result.recording!.transcriptionId).toBe("media-trans-1");
    expect(result.recording!.summaryId).toBeUndefined();
    expect(result.toDict()).toHaveProperty("recording");
  });

  test("errCode=0 但 recording 缺失 → success=true + recording=null（不映射 64000）", async () => {
    const result = await fetchRecordingDetail(config, APP_TOKEN, {
      recordingId: "1001-2002",
      fetchFn: mockFetchFn(ok({})),
    });
    expect(result.success).toBe(true);
    expect(result.recording).toBeNull();
    expect(result.err_code).toBeNull();
    expect(result.toDict()).not.toHaveProperty("recording");
  });

  test("录音不存在返回 64000：success=false + err_code", async () => {
    const result = await fetchRecordingDetail(config, APP_TOKEN, {
      recordingId: "1001-2002",
      fetchFn: mockFetchFn(err(64000, "录音不存在")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(64000);
    expect(result.recording).toBeNull();
  });

  test("缺 recordingId 时本地直接失败且不发请求", async () => {
    const capture: Capture = {};
    const result = await fetchRecordingDetail(config, APP_TOKEN, {
      recordingId: "",
      fetchFn: mockFetchFn(ok({ recording: RECORDING }), capture),
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("recording_id is required");
    expect(capture.url).toBeUndefined();
  });
});

describe("createTranscriptionTask (4.60.3)", () => {
  test("提交转写成功：convertState=5 且无 body 参数", async () => {
    const capture: Capture = {};
    const result = await createTranscriptionTask(config, APP_TOKEN, {
      recordingId: "1001-2002",
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({ recordingId: "1001-2002", convertState: 5 }), capture),
    });

    expect(capture.method).toBe("POST");
    expect(capture.url).toContain("/v1/smart_recording/recordings/1001-2002/transcribe/create");
    expect(capture.body).toEqual({});
    expect(result.success).toBe(true);
    expect(result.recordingId).toBe("1001-2002");
    expect(result.convertState).toBe(5);
    expect(result.toDict()).toMatchObject({ success: true, recordingId: "1001-2002", convertState: 5 });
  });

  test("配额超限 64005 透传 err_code", async () => {
    const result = await createTranscriptionTask(config, APP_TOKEN, {
      recordingId: "1001-2002",
      fetchFn: mockFetchFn(err(64005, "配额超限")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(64005);
    expect(result.convertState).toBeNull();
  });

  test("缺 recordingId 时本地直接失败", async () => {
    const result = await createTranscriptionTask(config, APP_TOKEN, {
      recordingId: "",
      fetchFn: httpErrorFetchFn(500),
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("recording_id is required");
  });
});

describe("createSummaryTask (4.60.4)", () => {
  test("带 templateId 时 body 透传 templateId，summaryState=5", async () => {
    const capture: Capture = {};
    const result = await createSummaryTask(config, APP_TOKEN, {
      recordingId: "1001-2002",
      templateId: "tpl-9",
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({ recordingId: "1001-2002", summaryState: 5 }), capture),
    });

    expect(capture.method).toBe("POST");
    expect(capture.url).toContain("/v1/smart_recording/recordings/1001-2002/summary/create");
    expect(capture.body).toEqual({ templateId: "tpl-9" });
    expect(result.success).toBe(true);
    expect(result.summaryState).toBe(5);
  });

  test("不传 templateId 时 body 为空对象（走组织默认模板，不发空串）", async () => {
    const capture: Capture = {};
    await createSummaryTask(config, APP_TOKEN, {
      recordingId: "1001-2002",
      fetchFn: mockFetchFn(ok({ recordingId: "1001-2002", summaryState: 5 }), capture),
    });
    expect(capture.body).toEqual({});
  });

  test("前置条件不满足 64007 透传 err_code", async () => {
    const result = await createSummaryTask(config, APP_TOKEN, {
      recordingId: "1001-2002",
      fetchFn: mockFetchFn(err(64007, "参数不合法")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(64007);
    expect(result.summaryState).toBeNull();
  });
});

describe("fetchRecordingTags (4.60.5)", () => {
  test("解析标签列表（含浮点 sortWeight 与微秒时间戳）", async () => {
    const capture: Capture = {};
    const result = await fetchRecordingTags(config, APP_TOKEN, {
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({
        tags: [
          { tagId: "tag-1", name: "重要", sortWeight: 1.5, createTime: 1_730_000_000_000_000, modifyTime: 1_730_000_100_000_000 },
          { tagId: "tag-2", name: "待办" },
        ],
      }), capture),
    });

    expect(capture.url).toContain("/v1/smart_recording/tags/fetch");
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
    expect(result.success).toBe(true);
    expect(result.tags).toHaveLength(2);
    expect(result.tags![0].sortWeight).toBe(1.5);
    expect(result.tags![0].createTime).toBe(1_730_000_000_000_000);
  });

  test("data 缺 tags → tags=null（不伪造空数组）", async () => {
    const result = await fetchRecordingTags(config, APP_TOKEN, {
      fetchFn: mockFetchFn(ok({})),
    });
    expect(result.success).toBe(true);
    expect(result.tags).toBeNull();
  });

  test("无权限 10005 透传 err_code", async () => {
    const result = await fetchRecordingTags(config, APP_TOKEN, {
      fetchFn: mockFetchFn(err(10005, "无权限")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(10005);
  });
});

describe("fetchRecordingTemplates (4.60.6)", () => {
  test("解析模板列表，分页走 query 的 page_size（与录音列表的 body pageSize 不同）", async () => {
    const capture: Capture = {};
    const result = await fetchRecordingTemplates(config, APP_TOKEN, {
      page: 2,
      pageSize: 50,
      user_token: USER_TOKEN,
      fetchFn: mockFetchFn(ok({
        templates: [{ templateId: "tpl-1", name: "周会纪要", prompt: "总结要点", state: 1, templateState: 1, orderNumber: 10 }],
        total: 1,
        hasMore: false,
      }), capture),
    });

    expect(capture.url).toContain("/v1/smart_recording/templates/fetch");
    expect(capture.url).toContain("page=2");
    expect(capture.url).toContain("page_size=50");
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
    expect(result.success).toBe(true);
    expect(result.templates).toHaveLength(1);
    expect(result.templates![0].prompt).toBe("总结要点");
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  test("默认分页为 page=1&page_size=20", async () => {
    const capture: Capture = {};
    await fetchRecordingTemplates(config, APP_TOKEN, { fetchFn: mockFetchFn(ok({ templates: [] }), capture) });
    expect(capture.url).toContain("page=1");
    expect(capture.url).toContain("page_size=20");
  });

  test("page_size>100 时服务端 45000（SDK 不截断，透传 err_code）", async () => {
    const result = await fetchRecordingTemplates(config, APP_TOKEN, {
      pageSize: 500,
      fetchFn: mockFetchFn(err(45000, "参数错误")),
    });
    expect(result.success).toBe(false);
    expect(result.err_code).toBe(45000);
  });

  test("HTTP 层失败不带 err_code", async () => {
    const result = await fetchRecordingTemplates(config, APP_TOKEN, { fetchFn: httpErrorFetchFn(502) });
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP error: 502");
    expect(result.err_code).toBeNull();
  });
});

describe("LansengerClient 智能录音域方法", () => {
  function makeClient(responseData: Record<string, any>, capture: Capture): LansengerClient {
    const client = new LansengerClient("test_app", "test_secret");
    const fn: FetchFn = async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("apptoken")) {
        return jsonResponse({ errCode: 0, data: { appToken: "cached_app_token", expiresIn: 7200 } });
      }
      capture.url = u;
      capture.method = init?.method;
      if (init?.body && typeof init.body === "string") capture.body = JSON.parse(init.body);
      return jsonResponse(responseData);
    };
    // 注入 mock 传输层，避免真实网络与 token 轮询。
    (client as any)._fetchFn = fn;
    return client;
  }

  test("fetchSmartRecordingList 透传 user_token 与分页", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ recordings: [RECORDING], total: 1, hasMore: false }), capture);
    const result = await client.fetchSmartRecordingList({ page: 1, pageSize: 10, user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingListResult);
    expect(result.success).toBe(true);
    expect(capture.url).toContain("/v1/smart_recording/recordings/fetch");
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
    expect(capture.body).toEqual({ page: 1, pageSize: 10 });
  });

  test("fetchSmartRecordingDetail 走 GET 详情", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ recording: { ...RECORDING, recordingId: "1001-2002" } }), capture);
    const result = await client.fetchSmartRecordingDetail({ recordingId: "1001-2002", user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingDetailResult);
    expect(result.recording!.recordingId).toBe("1001-2002");
    expect(capture.url).toContain("/recordings/1001-2002/fetch");
  });

  test("createSmartRecordingTranscriptionTask 走提交转写", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ recordingId: "1001-2002", convertState: 5 }), capture);
    const result = await client.createSmartRecordingTranscriptionTask({ recordingId: "1001-2002", user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingTranscribeResult);
    expect(result.convertState).toBe(5);
    expect(capture.method).toBe("POST");
    expect(capture.url).toContain("/transcribe/create");
  });

  test("createSmartRecordingSummaryTask 透传 templateId", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ recordingId: "1001-2002", summaryState: 5 }), capture);
    const result = await client.createSmartRecordingSummaryTask({ recordingId: "1001-2002", templateId: "tpl-9", user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingSummaryResult);
    expect(result.summaryState).toBe(5);
    expect(capture.body).toEqual({ templateId: "tpl-9" });
  });

  test("fetchSmartRecordingTags 支持可选 opts 透传 user_token", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ tags: [{ tagId: "tag-1" }] }), capture);
    const result = await client.fetchSmartRecordingTags({ user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingTagListResult);
    expect(capture.url).toContain("/v1/smart_recording/tags/fetch");
    expect(capture.url).toContain(`user_token=${USER_TOKEN}`);
  });

  test("fetchSmartRecordingTemplates 走 query page_size", async () => {
    const capture: Capture = {};
    const client = makeClient(ok({ templates: [{ templateId: "tpl-1" }], total: 1, hasMore: false }), capture);
    const result = await client.fetchSmartRecordingTemplates({ page: 1, pageSize: 20, user_token: USER_TOKEN });
    expect(result).toBeInstanceOf(SmartRecordingTemplateListResult);
    expect(result.templates![0].templateId).toBe("tpl-1");
    expect(capture.url).toContain("page_size=20");
  });
});
