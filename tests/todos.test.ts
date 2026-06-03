import {
  createTodoTask, updateTodoTask, updateTodoTaskStatus, deleteTodoTask,
  fetchTodoTaskList, fetchTodoTaskBySourceId, fetchTodoTaskById,
  fetchTodoTaskStatusCounts, updateExecutorStatus, addExecutors,
  deleteExecutors, fetchExecutorList,
} from "../src/todos";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";

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

function mockErrorFetchFn(status: number): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    return {
      ok: false,
      status,
      statusText: "Error",
      json: async () => ({ errCode: -1, errMsg: "HTTP error" }),
    } as any;
  };
}

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

describe("createTodoTask", () => {
  test("returns success with todotask_id", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { todotaskId: "tid1" },
    });
    const result = await createTodoTask(config, appToken, "Task Title", "https://link", "https://pc", ["s1"], "org1", 1, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.todotask_id).toBe("tid1");
  });

  test("returns error on empty title", async () => {
    const result = await createTodoTask(config, appToken, "", "link", "pc", ["s1"], "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty link", async () => {
    const result = await createTodoTask(config, appToken, "Title", "", "pc", ["s1"], "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty pcLink", async () => {
    const result = await createTodoTask(config, appToken, "Title", "link", "", ["s1"], "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty executorIds", async () => {
    const result = await createTodoTask(config, appToken, "Title", "link", "pc", [], "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await createTodoTask(config, appToken, "Title", "link", "pc", ["s1"], "");
    expect(result.success).toBe(false);
  });

  test("returns error on API error", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "bad" });
    const result = await createTodoTask(config, appToken, "T", "link", "pc", ["s1"], "org1", 1, { fetchFn });
    expect(result.success).toBe(false);
    expect(result.error).toContain("API error");
  });
});

describe("updateTodoTask", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await updateTodoTask(config, appToken, "tid1", "New Title", "link", "pc", "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.todotask_id).toBe("tid1");
  });

  test("returns error on empty todotask_id", async () => {
    const result = await updateTodoTask(config, appToken, "", "T", "l", "pc", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty title", async () => {
    const result = await updateTodoTask(config, appToken, "tid1", "", "l", "pc", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await updateTodoTask(config, appToken, "tid1", "T", "l", "pc", "");
    expect(result.success).toBe(false);
  });
});

describe("updateTodoTaskStatus", () => {
  test("returns success with valid status", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await updateTodoTaskStatus(config, appToken, "tid1", "21", "org1", { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on invalid status", async () => {
    const result = await updateTodoTaskStatus(config, appToken, "tid1", "99", "org1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("status must be one of");
  });

  test("returns error on empty todotask_id", async () => {
    const result = await updateTodoTaskStatus(config, appToken, "", "11", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await updateTodoTaskStatus(config, appToken, "tid1", "11", "");
    expect(result.success).toBe(false);
  });
});

describe("deleteTodoTask", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await deleteTodoTask(config, appToken, "tid1", "org1", { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty todotask_id", async () => {
    const result = await deleteTodoTask(config, appToken, "", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await deleteTodoTask(config, appToken, "tid1", "");
    expect(result.success).toBe(false);
  });
});

describe("fetchTodoTaskList", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { total: 3, todotaskList: [{ todotaskId: "t1" }] },
    });
    const result = await fetchTodoTaskList(config, appToken, "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total).toBe(3);
  });

  test("returns error on empty orgId", async () => {
    const result = await fetchTodoTaskList(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchTodoTaskBySourceId", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { todotaskId: "tid1", sourceId: "src1", title: "Task", status: "21" },
    });
    const result = await fetchTodoTaskBySourceId(config, appToken, "src1", "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.todotask_id).toBe("tid1");
  });

  test("returns error on empty sourceId", async () => {
    const result = await fetchTodoTaskBySourceId(config, appToken, "", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await fetchTodoTaskBySourceId(config, appToken, "src1", "");
    expect(result.success).toBe(false);
  });
});

describe("fetchTodoTaskById", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { todotaskId: "tid1", title: "Task" },
    });
    const result = await fetchTodoTaskById(config, appToken, "tid1", "org1", { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty todotask_id", async () => {
    const result = await fetchTodoTaskById(config, appToken, "", "org1");
    expect(result.success).toBe(false);
  });
});

describe("fetchTodoTaskStatusCounts", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: [{ status: "11", count: 5 }, { status: "22", count: 3 }],
    });
    const result = await fetchTodoTaskStatusCounts(config, appToken, "s1", "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.status_counts).toHaveLength(2);
  });

  test("returns error on empty staffId", async () => {
    const result = await fetchTodoTaskStatusCounts(config, appToken, "", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await fetchTodoTaskStatusCounts(config, appToken, "s1", "");
    expect(result.success).toBe(false);
  });
});

describe("updateExecutorStatus", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await updateExecutorStatus(config, appToken, [{ executorId: "s1", status: "22" }], "org1", { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty list", async () => {
    const result = await updateExecutorStatus(config, appToken, [], "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await updateExecutorStatus(config, appToken, [{ executorId: "s1", status: "22" }], "");
    expect(result.success).toBe(false);
  });
});

describe("addExecutors", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await addExecutors(config, appToken, ["s2"], "org1", { todotask_id: "tid1", fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty executorIds", async () => {
    const result = await addExecutors(config, appToken, [], "org1");
    expect(result.success).toBe(false);
  });
});

describe("deleteExecutors", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await deleteExecutors(config, appToken, ["s1"], "org1", { todotask_id: "tid1", fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty executorIds", async () => {
    const result = await deleteExecutors(config, appToken, [], "org1");
    expect(result.success).toBe(false);
  });
});

describe("fetchExecutorList", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { total: 2, executorList: [{ executorId: "s1" }] },
    });
    const result = await fetchExecutorList(config, appToken, "tid1", "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
  });

  test("returns error on empty todotask_id", async () => {
    const result = await fetchExecutorList(config, appToken, "", "org1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty orgId", async () => {
    const result = await fetchExecutorList(config, appToken, "tid1", "");
    expect(result.success).toBe(false);
  });
});