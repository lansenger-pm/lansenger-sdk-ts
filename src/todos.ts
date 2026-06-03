import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  TodoTaskCreateResult, TodoTaskInfoResult, TodoTaskListResult,
  TodoTaskStatusCountResult, TodoTaskExecutorListResult,
} from "./models";

export const TODO_TODO_STATUS_PENDING_READ = "11";
export const TODO_TODO_STATUS_READ = "12";
export const TODO_TODO_STATUS_PENDING_DO = "21";
export const TODO_TODO_STATUS_DONE = "22";
export const TODO_TYPE_NOTIFICATION = 1;
export const TODO_TYPE_APPROVAL = 2;

export async function createTodoTask(
  config: LansengerConfig,
  appToken: string,
  title: string,
  link: string,
  pcLink: string,
  executorIds: string[],
  orgId: string,
  type: number = 1,
  opts?: { source_id?: string; desc?: string; sender_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!title) return new TodoTaskCreateResult({ success: false, error: "title is required" });
  if (!link) return new TodoTaskCreateResult({ success: false, error: "link is required" });
  if (!pcLink) return new TodoTaskCreateResult({ success: false, error: "pc_link is required" });
  if (!executorIds || !executorIds.length) return new TodoTaskCreateResult({ success: false, error: "executor_ids is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "create", appToken, { userToken });
  const body: Record<string, any> = { title, type, link, pcLink: pcLink, executorIds, orgId };
  if (opts?.source_id) body.sourceId = opts.source_id;
  if (opts?.desc) body.desc = opts.desc;
  if (opts?.sender_id) body.senderId = opts.sender_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new TodoTaskCreateResult({ success: true, todotask_id: d.todotaskId, raw_response: data! });
}

export async function updateTodoTask(
  config: LansengerConfig,
  appToken: string,
  todotaskId: string,
  title: string,
  link: string,
  pcLink: string,
  orgId: string,
  opts?: { desc?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!todotaskId) return new TodoTaskCreateResult({ success: false, error: "todotask_id is required" });
  if (!title) return new TodoTaskCreateResult({ success: false, error: "title is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "info_update", appToken, { userToken });
  const body: Record<string, any> = { todotaskId, title, link, pcLink: pcLink, orgId };
  if (opts?.desc) body.desc = opts.desc;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: todotaskId, raw_response: data! });
}

export async function updateTodoTaskStatus(
  config: LansengerConfig,
  appToken: string,
  todotaskId: string,
  status: string,
  orgId: string,
  opts?: { staff_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  const valid = ["11", "12", "21", "22"];
  if (!valid.includes(status)) return new TodoTaskCreateResult({ success: false, error: `status must be one of: ${valid.join(", ")}` });
  if (!todotaskId) return new TodoTaskCreateResult({ success: false, error: "todotask_id is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "status_update", appToken, { userToken });
  const body: Record<string, any> = { todotaskId, status, orgId };
  if (opts?.staff_id) body.staffId = opts.staff_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: todotaskId, raw_response: data! });
}

export async function deleteTodoTask(
  config: LansengerConfig,
  appToken: string,
  todotaskId: string,
  orgId: string,
  opts?: { staff_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!todotaskId) return new TodoTaskCreateResult({ success: false, error: "todotask_id is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "sender_delete", appToken, { userToken });
  const body: Record<string, any> = { todotaskId, orgId };
  if (opts?.staff_id) body.staffId = opts.staff_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: todotaskId, raw_response: data! });
}

export async function fetchTodoTaskList(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  opts?: { app_ids?: string[]; staff_id?: string; status_list?: string[]; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskListResult> {
  if (!orgId) return new TodoTaskListResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "list_fetch", appToken, { userToken });
  const body: Record<string, any> = { orgId };
  if (opts?.app_ids) body.appIds = opts.app_ids;
  if (opts?.staff_id) body.staffId = opts.staff_id;
  if (opts?.status_list) body.statusList = opts.status_list;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new TodoTaskListResult({ success: true, total: d.total || 0, todotask_list: d.todotaskList, raw_response: data! });
}

export async function fetchTodoTaskBySourceId(
  config: LansengerConfig,
  appToken: string,
  sourceId: string,
  orgId: string,
  opts?: { staff_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskInfoResult> {
  if (!sourceId) return new TodoTaskInfoResult({ success: false, error: "source_id is required" });
  if (!orgId) return new TodoTaskInfoResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "info_fetch_by_source_id", appToken, { userToken });
  const body: Record<string, any> = { sourceId, orgId };
  if (opts?.staff_id) body.staffId = opts.staff_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new TodoTaskInfoResult({
    success: true, todotask_id: d.todotaskId, source_id: d.sourceId,
    title: d.title, desc: d.desc, status: d.status, type: d.type,
    link: d.link, pc_link: d.pcLink, sender_id: d.senderId,
    executor_ids: d.executorIds, create_time: d.createTime, app_id: d.appId,
    raw_response: data!,
  });
}

export async function fetchTodoTaskById(
  config: LansengerConfig,
  appToken: string,
  todotaskId: string,
  orgId: string,
  opts?: { staff_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskInfoResult> {
  if (!todotaskId) return new TodoTaskInfoResult({ success: false, error: "todotask_id is required" });
  if (!orgId) return new TodoTaskInfoResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "info_fetch", appToken, { userToken });
  const body: Record<string, any> = { todotaskId, orgId };
  if (opts?.staff_id) body.staffId = opts.staff_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new TodoTaskInfoResult({
    success: true, todotask_id: d.todotaskId, source_id: d.sourceId,
    title: d.title, desc: d.desc, status: d.status, type: d.type,
    link: d.link, pc_link: d.pcLink, sender_id: d.senderId,
    executor_ids: d.executorIds, create_time: d.createTime, app_id: d.appId,
    raw_response: data!,
  });
}

export async function fetchTodoTaskStatusCounts(
  config: LansengerConfig,
  appToken: string,
  staffId: string,
  orgId: string,
  opts?: { app_id?: string; status_list?: string[]; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskStatusCountResult> {
  if (!staffId) return new TodoTaskStatusCountResult({ success: false, error: "staff_id is required" });
  if (!orgId) return new TodoTaskStatusCountResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "status_count_list_fetch", appToken, { userToken });
  const body: Record<string, any> = { staffId, orgId };
  if (opts?.app_id) body.appId = opts.app_id;
  if (opts?.status_list) body.status = opts.status_list;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskStatusCountResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskStatusCountResult({ success: false, error: apiErr });
  const d = data!.data || [];
  return new TodoTaskStatusCountResult({ success: true, status_counts: Array.isArray(d) ? d : [], raw_response: data! });
}

export async function updateExecutorStatus(
  config: LansengerConfig,
  appToken: string,
  executorStatusList: Record<string, string>[],
  orgId: string,
  opts?: { todotask_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!executorStatusList || !executorStatusList.length) return new TodoTaskCreateResult({ success: false, error: "executor_status_list is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "executor_status_update", appToken, { userToken });
  const body: Record<string, any> = { executorStatusList, orgId };
  if (opts?.todotask_id) body.todotaskId = opts.todotask_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: opts?.todotask_id || "", raw_response: data! });
}

export async function addExecutors(
  config: LansengerConfig,
  appToken: string,
  executorIds: string[],
  orgId: string,
  opts?: { todotask_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!executorIds || !executorIds.length) return new TodoTaskCreateResult({ success: false, error: "executor_ids is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "executor_create", appToken, { userToken });
  const body: Record<string, any> = { executorIds, orgId };
  if (opts?.todotask_id) body.todotaskId = opts.todotask_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: opts?.todotask_id || "", raw_response: data! });
}

export async function deleteExecutors(
  config: LansengerConfig,
  appToken: string,
  executorIds: string[],
  orgId: string,
  opts?: { todotask_id?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskCreateResult> {
  if (!executorIds || !executorIds.length) return new TodoTaskCreateResult({ success: false, error: "executor_ids is required" });
  if (!orgId) return new TodoTaskCreateResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "executor_delete", appToken, { userToken });
  const body: Record<string, any> = { executorIds, orgId };
  if (opts?.todotask_id) body.todotaskId = opts.todotask_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskCreateResult({ success: false, error: apiErr });
  return new TodoTaskCreateResult({ success: true, todotask_id: opts?.todotask_id || "", raw_response: data! });
}

export async function fetchExecutorList(
  config: LansengerConfig,
  appToken: string,
  todotaskId: string,
  orgId: string,
  opts?: { staff_id?: string; status_list?: string[]; user_token?: string; fetchFn?: FetchFn },
): Promise<TodoTaskExecutorListResult> {
  if (!todotaskId) return new TodoTaskExecutorListResult({ success: false, error: "todotask_id is required" });
  if (!orgId) return new TodoTaskExecutorListResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "todo", "executor_list_fetch", appToken, { userToken });
  const body: Record<string, any> = { todotaskId, orgId };
  if (opts?.staff_id) body.staffId = opts.staff_id;
  if (opts?.status_list) body.statusList = opts.status_list;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new TodoTaskExecutorListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new TodoTaskExecutorListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new TodoTaskExecutorListResult({
    success: true, total: d.total || 0, executor_list: d.executorList, raw_response: data!,
  });
}