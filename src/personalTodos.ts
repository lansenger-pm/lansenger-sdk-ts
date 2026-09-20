// Lansenger personal todo API — user-owned tasks and resources (个人待办).
//
// This domain is separate from the application-identity Unified Todo API.
// All endpoints use POST and the /xtra/tdtask/server/openapi path prefix.

import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, FetchFn } from "./http";
import {
  PersonalTodoListResult,
  PersonalTodoResourceResult,
  PersonalTodoSaveResult,
  PersonalTodoUrlResult,
} from "./models";
import {
  PERSONAL_TODO_PRIORITY_LOW,
  PERSONAL_TODO_PRIORITY_NORMAL,
  PERSONAL_TODO_PRIORITY_URGENT,
  PERSONAL_TODO_PRIORITY_VERY_URGENT,
  PERSONAL_TODO_RESOURCE_MAX_SIZE,
  PERSONAL_TODO_TYPE_PERSONAL,
} from "./constants";

type AnyDict = Record<string, any>;

function parsePersonalTodoResponse(data: AnyDict): [boolean, string | null] {
  const errCode = data.errCode ?? -1;
  if (errCode !== 0 && errCode !== 200) {
    return [false, `API error (errCode=${errCode}): ${data.errMsg ?? "Unknown error"}`];
  }
  return [true, null];
}

function parsePage(data: AnyDict | null): {
  page_no: number; page_size: number; pages: number; total: number;
  has_more: boolean; items: AnyDict[];
} {
  const d = data || {};
  return {
    page_no: d.pageNo ?? 0,
    page_size: d.pageSize ?? 0,
    pages: d.pages ?? 0,
    total: d.total ?? 0,
    has_more: Boolean(d.hasNextPage),
    items: d.result || [],
  };
}

export interface PersonalTodoSaveOpts {
  description?: string;
  parent_code?: string;
  group_id?: string;
  group_category_code?: string;
  finish_time?: number | null;
  status_tag_no?: string;
  status_tag_yes?: string;
  app_info_id?: number;
  app_category_id?: number;
  platform?: number;
  subscribe_status?: number;
  user_code?: string;
  executors?: AnyDict[];
  copys?: AnyDict[];
  resources?: AnyDict[];
  reminds?: AnyDict[];
  user_token?: string;
  fetchFn?: FetchFn;
}

export interface PersonalTodoUpdateOpts extends PersonalTodoSaveOpts {
  subject?: string;
  start_time?: number | null;
  due_time?: number | null;
  priority?: number | null;
  create_user_id?: string;
  appid?: string;
}

export async function savePersonalTodo(
  config: LansengerConfig,
  appToken: string,
  subject: string,
  startTime: number,
  dueTime: number,
  priority: number,
  createUserId: string,
  orgId: string,
  appid: string,
  opts: PersonalTodoSaveOpts = {},
): Promise<PersonalTodoSaveResult> {
  if (!subject) return new PersonalTodoSaveResult({ success: false, error: "subject is required" });
  if (startTime === undefined || startTime === null) return new PersonalTodoSaveResult({ success: false, error: "start_time is required" });
  if (dueTime === undefined || dueTime === null) return new PersonalTodoSaveResult({ success: false, error: "due_time is required" });
  if (![PERSONAL_TODO_PRIORITY_LOW, PERSONAL_TODO_PRIORITY_NORMAL, PERSONAL_TODO_PRIORITY_URGENT, PERSONAL_TODO_PRIORITY_VERY_URGENT].includes(priority)) {
    return new PersonalTodoSaveResult({ success: false, error: "priority must be 0, 1, 2, or 3" });
  }
  if (!createUserId) return new PersonalTodoSaveResult({ success: false, error: "create_user_id is required" });
  if (!orgId) return new PersonalTodoSaveResult({ success: false, error: "org_id is required" });
  if (!appid) return new PersonalTodoSaveResult({ success: false, error: "appid is required" });

  const url = buildApiUrl(config, "personal_todos", "save", appToken, { userToken: opts.user_token });
  const body: AnyDict = {
    subject, startTime, dueTime, finishTime: opts.finish_time ?? null,
    priority, type: PERSONAL_TODO_TYPE_PERSONAL, createUserId, orgId, appid,
  };
  for (const [key, value] of Object.entries({
    description: opts.description,
    parentCode: opts.parent_code,
    groupId: opts.group_id,
    groupCategoryCode: opts.group_category_code,
    statusTagNo: opts.status_tag_no,
    statusTagYes: opts.status_tag_yes,
    appInfoId: opts.app_info_id,
    appCategoryId: opts.app_category_id,
    platform: opts.platform,
    subscribeStatus: opts.subscribe_status,
    userCode: opts.user_code,
    executors: opts.executors,
    copys: opts.copys,
    resources: opts.resources,
    reminds: opts.reminds,
  })) {
    if (value !== undefined && value !== null && value !== "") body[key] = value;
  }

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalTodoSaveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoSaveResult({ success: false, error: apiErr });
  return new PersonalTodoSaveResult({
    success: true,
    todo_code: typeof data!.data === "string" ? data!.data : null,
    raw_response: data!,
  });
}

export async function updatePersonalTodo(
  config: LansengerConfig,
  appToken: string,
  todoCode: string,
  orgId: string,
  updateFields: string[],
  opts: PersonalTodoUpdateOpts = {},
): Promise<PersonalTodoSaveResult> {
  if (!todoCode) return new PersonalTodoSaveResult({ success: false, error: "todo_code is required" });
  if (!orgId) return new PersonalTodoSaveResult({ success: false, error: "org_id is required" });
  if (!updateFields || !updateFields.length) return new PersonalTodoSaveResult({ success: false, error: "update_fields is required" });

  const updateContent: AnyDict = { code: todoCode };
  const candidates: Record<string, any> = {
    subject: opts.subject,
    description: opts.description,
    startTime: opts.start_time,
    dueTime: opts.due_time,
    finishTime: opts.finish_time,
    priority: opts.priority,
    statusTagNo: opts.status_tag_no,
    statusTagYes: opts.status_tag_yes,
    subscribeStatus: opts.subscribe_status,
    createUserId: opts.create_user_id,
    groupId: opts.group_id,
    groupCategoryCode: opts.group_category_code,
    appid: opts.appid,
    executors: opts.executors,
    copys: opts.copys,
    resources: opts.resources,
    reminds: opts.reminds,
  };
  for (const [key, value] of Object.entries(candidates)) {
    if (updateFields.includes(key) && value !== undefined && value !== null && value !== "") {
      updateContent[key] = value;
    }
  }

  const url = buildApiUrl(config, "personal_todos", "update", appToken, { userToken: opts.user_token });
  const body = { orgId, updateFields, updateContent };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalTodoSaveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoSaveResult({ success: false, error: apiErr });
  return new PersonalTodoSaveResult({ success: true, todo_code: todoCode, raw_response: data! });
}

export async function fetchPersonalTodoList(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  staffId: string,
  opts: {
    page_no?: number; page_size?: number; status?: number; app_id?: string;
    app_category_name?: string; user_token?: string; fetchFn?: FetchFn;
  } = {},
): Promise<PersonalTodoListResult> {
  if (!orgId) return new PersonalTodoListResult({ success: false, error: "org_id is required" });
  if (!staffId) return new PersonalTodoListResult({ success: false, error: "staff_id is required" });
  if (opts.status !== undefined && opts.status !== null && opts.status !== 0 && opts.status !== 1) {
    return new PersonalTodoListResult({ success: false, error: "status must be 0 or 1" });
  }

  const url = buildApiUrl(config, "personal_todos", "user_list", appToken, { userToken: opts.user_token });
  const body: AnyDict = {
    orgId, staffId, pageNo: opts.page_no ?? 1, pageSize: opts.page_size ?? 10,
  };
  if (opts.status !== undefined && opts.status !== null) body.status = opts.status;
  if (opts.app_id) body.appId = opts.app_id;
  if (opts.app_category_name) body.appCategoryName = opts.app_category_name;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalTodoListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoListResult({ success: false, error: apiErr });
  return new PersonalTodoListResult({ success: true, raw_response: data!, ...parsePage(data!.data) });
}

export async function uploadPersonalTodoResource(
  config: LansengerConfig,
  appToken: string,
  appId: string,
  size: number,
  fileName: string,
  contentType: string,
  fileData: string,
  orgId: string,
  opts: {
    extension_info?: string; thumb?: boolean; user_token?: string; fetchFn?: FetchFn;
  } = {},
): Promise<PersonalTodoResourceResult> {
  if (!appId) return new PersonalTodoResourceResult({ success: false, error: "app_id is required" });
  if (!size || size <= 0) return new PersonalTodoResourceResult({ success: false, error: "size is required" });
  if (size > PERSONAL_TODO_RESOURCE_MAX_SIZE) {
    return new PersonalTodoResourceResult({ success: false, error: `size exceeds the ${PERSONAL_TODO_RESOURCE_MAX_SIZE} byte limit` });
  }
  if (!fileName) return new PersonalTodoResourceResult({ success: false, error: "file_name is required" });
  if (!contentType) return new PersonalTodoResourceResult({ success: false, error: "content_type is required" });
  if (!fileData) return new PersonalTodoResourceResult({ success: false, error: "file_data is required" });
  if (!orgId) return new PersonalTodoResourceResult({ success: false, error: "org_id is required" });

  const url = buildApiUrl(config, "personal_todos", "resource_update", appToken, { userToken: opts.user_token });
  const body: AnyDict = {
    appId, size, fileName, contentType, fileData, orgId, thumb: opts.thumb ?? false,
  };
  if (opts.extension_info) body.extensionInfo = opts.extension_info;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalTodoResourceResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoResourceResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new PersonalTodoResourceResult({
    success: true,
    file_name: d.fileName ?? null,
    mime_type: d.mimeType ?? null,
    suffix: d.suffix ?? null,
    size: d.size ?? null,
    md5: d.md5 ?? null,
    extension_info: d.extensionInfo ?? null,
    resource_id: d.resourceId ?? null,
    download_url: d.downloadUrl ?? null,
    image_thumbnail_list: d.imageThumbnailList ?? null,
    raw_response: data!,
  });
}

export async function fetchPersonalTodoResourceDownloadUrl(
  config: LansengerConfig,
  appToken: string,
  resourceId: string,
  orgId: string,
  opts: { file_name?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<PersonalTodoUrlResult> {
  if (!resourceId) return new PersonalTodoUrlResult({ success: false, error: "resource_id is required" });
  if (!orgId) return new PersonalTodoUrlResult({ success: false, error: "org_id is required" });
  const url = buildApiUrl(config, "personal_todos", "resource_download", appToken, { userToken: opts.user_token });
  const body: AnyDict = { resourceId, orgId };
  if (opts.file_name) body.fileName = opts.file_name;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalTodoUrlResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoUrlResult({ success: false, error: apiErr });
  return new PersonalTodoUrlResult({
    success: true,
    url: typeof data!.data === "string" ? data!.data : null,
    raw_response: data!,
  });
}

export async function fetchPersonalTodoResourceUploadUrl(
  config: LansengerConfig,
  appToken: string,
  fileName: string,
  md5: string,
  size: number,
  orgId: string,
  opts: { user_token?: string; fetchFn?: FetchFn } = {},
): Promise<PersonalTodoUrlResult> {
  if (!fileName) return new PersonalTodoUrlResult({ success: false, error: "file_name is required" });
  if (!md5) return new PersonalTodoUrlResult({ success: false, error: "md5 is required" });
  if (!size || size <= 0) return new PersonalTodoUrlResult({ success: false, error: "size is required" });
  if (!orgId) return new PersonalTodoUrlResult({ success: false, error: "org_id is required" });
  const url = buildApiUrl(config, "personal_todos", "resource_upload_url", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, { fileName, md5, size, orgId }, opts.fetchFn);
  if (httpErr) return new PersonalTodoUrlResult({ success: false, error: httpErr });
  const [ok, apiErr] = parsePersonalTodoResponse(data!);
  if (!ok) return new PersonalTodoUrlResult({ success: false, error: apiErr });
  return new PersonalTodoUrlResult({
    success: true,
    url: typeof data!.data === "string" ? data!.data : null,
    raw_response: data!,
  });
}
