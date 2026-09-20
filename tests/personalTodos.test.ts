import { LansengerConfig } from "../src/config";
import { API_ENDPOINTS } from "../src/constants";
import {
  savePersonalTodo,
  updatePersonalTodo,
  fetchPersonalTodoList,
  uploadPersonalTodoResource,
  fetchPersonalTodoResourceDownloadUrl,
  fetchPersonalTodoResourceUploadUrl,
} from "../src/personalTodos";
import type { FetchFn } from "../src/http";

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async () => ({
    ok: true, status: 200, statusText: "OK",
    json: async () => responseData,
  } as any);
}

function capturingFetch(capture: { body?: Record<string, any> }, responseData: Record<string, any>): FetchFn {
  return async (_url, init) => {
    capture.body = JSON.parse((init?.body as string) || "{}");
    return {
      ok: true, status: 200, statusText: "OK",
      json: async () => responseData,
    } as any;
  };
}

function httpErrorFetch(): FetchFn {
  return async () => ({
    ok: false, status: 500, statusText: "Internal Server Error",
    json: async () => ({}),
  } as any);
}

describe("savePersonalTodo", () => {
  test("validates required fields", async () => {
    const r = await savePersonalTodo(config, appToken, "", 1, 2, 1, "u1", "org1", "app1");
    expect(r.error).toContain("subject is required");
    const badPriority = await savePersonalTodo(config, appToken, "s", 1, 2, 9, "u1", "org1", "app1");
    expect(badPriority.error).toContain("priority must be");
  });

  test("sends documented body", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await savePersonalTodo(
      config, appToken, "完成方案", 100, 200, 1, "u1", "org1", "app1",
      {
        description: "desc",
        executors: [{ staffId: "u1", opt: 1 }],
        resources: [{ fileName: "a.pdf", resourceId: "r1" }],
        fetchFn: capturingFetch(cap, { errCode: 0, data: "TASK1" }),
      },
    );
    expect(r.success).toBe(true);
    expect(r.todo_code).toBe("TASK1");
    expect(cap.body).toMatchObject({
      subject: "完成方案", startTime: 100, dueTime: 200, finishTime: null,
      priority: 1, type: 1, createUserId: "u1", orgId: "org1", appid: "app1",
    });
  });

  test("returns API error", async () => {
    const r = await savePersonalTodo(config, appToken, "s", 1, 2, 1, "u1", "org1", "app1", {
      fetchFn: mockFetchFn({ errCode: 3124, errMsg: "日期格式错误" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=3124");
  });
});

describe("updatePersonalTodo", () => {
  test("validates update fields", async () => {
    const r = await updatePersonalTodo(config, appToken, "TASK1", "org1", []);
    expect(r.error).toContain("update_fields is required");
  });

  test("places orgId at top level", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await updatePersonalTodo(
      config, appToken, "TASK1", "org1", ["subject"],
      { subject: "新主题", fetchFn: capturingFetch(cap, { errCode: 0, data: "TASK1" }) },
    );
    expect(r.success).toBe(true);
    expect(cap.body!.orgId).toBe("org1");
    expect(cap.body!.updateContent.orgId).toBeUndefined();
    expect(cap.body!.updateContent.subject).toBe("新主题");
  });

  test("returns API error", async () => {
    const r = await updatePersonalTodo(config, appToken, "TASK1", "org1", ["subject"], {
      subject: "s", fetchFn: mockFetchFn({ errCode: 3122, errMsg: "待办组不存在" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=3122");
  });
});

describe("fetchPersonalTodoList", () => {
  test("validates org and staff", async () => {
    expect((await fetchPersonalTodoList(config, appToken, "", "u1")).error).toContain("org_id is required");
    expect((await fetchPersonalTodoList(config, appToken, "org1", "")).error).toContain("staff_id is required");
  });

  test("parses paged results", async () => {
    const r = await fetchPersonalTodoList(config, appToken, "org1", "u1", {
      page_no: 2,
      status: 0,
      fetchFn: mockFetchFn({
        errCode: 0,
        data: {
          pageNo: 2, pageSize: 10, pages: 3, total: 25, hasNextPage: true,
          result: [{ taskCode: "TASK1", summarySubject: "方案", status: 0 }],
        },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.page_no).toBe(2);
    expect(r.total).toBe(25);
    expect(r.items![0].taskCode).toBe("TASK1");
  });

  test("returns API error", async () => {
    const r = await fetchPersonalTodoList(config, appToken, "org1", "u1", {
      fetchFn: mockFetchFn({ errCode: 3123, errMsg: "人员不存在" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=3123");
  });
});

describe("personal todo resources", () => {
  test("upload validates size and maps result", async () => {
    const tooLarge = await uploadPersonalTodoResource(
      config, appToken, "app1", 9 * 1024 * 1024 + 1, "a.pdf", "application/pdf", "x", "org1",
    );
    expect(tooLarge.error).toContain("byte limit");

    const r = await uploadPersonalTodoResource(
      config, appToken, "app1", 10, "a.pdf", "application/pdf", "YWJj", "org1",
      {
        fetchFn: mockFetchFn({
          errCode: 0,
          data: { fileName: "a.pdf", resourceId: "res1", size: 10, mimeType: "application/pdf" },
        }),
      },
    );
    expect(r.success).toBe(true);
    expect(r.resource_id).toBe("res1");
  });

  test("download and upload URLs validate inputs and return URLs", async () => {
    expect((await fetchPersonalTodoResourceDownloadUrl(config, appToken, "", "org1")).error).toContain("resource_id is required");
    expect((await fetchPersonalTodoResourceUploadUrl(config, appToken, "", "md5", 1, "org1")).error).toContain("file_name is required");

    const download = await fetchPersonalTodoResourceDownloadUrl(config, appToken, "res1", "org1", {
      fetchFn: mockFetchFn({ errCode: 0, data: "https://example.com/download" }),
    });
    const upload = await fetchPersonalTodoResourceUploadUrl(config, appToken, "a.pdf", "md5", 10, "org1", {
      fetchFn: mockFetchFn({ errCode: 0, data: "https://example.com/upload" }),
    });
    expect(download.url).toContain("/download");
    expect(upload.url).toContain("/upload");
  });

  test("returns HTTP error", async () => {
    const r = await fetchPersonalTodoResourceDownloadUrl(config, appToken, "res1", "org1", {
      fetchFn: httpErrorFetch(),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("HTTP error");
  });
});

describe("personal todo constants", () => {
  test("endpoint paths", () => {
    expect(API_ENDPOINTS.personal_todos.save).toBe("/xtra/tdtask/server/openapi/v3/taskopt/savePersonalTask");
    expect(API_ENDPOINTS.personal_todos.resource_upload_url).toBe("/xtra/tdtask/server/openapi/resource/getUploadUrl");
  });
});
