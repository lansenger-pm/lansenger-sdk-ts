/**
 * 智能录音 / 智能语音（API 规范 4.60 / smart_recording_openapi）。
 *
 * 6 个开放接口：录音列表、录音详情、提交转写任务、提交纪要任务、标签列表、纪要模板列表。
 *
 * 公共口径（契约见项目 .scratch/smart-recording/contract.md）：
 * - 所有接口都要求 `app_token`（应用鉴权）+ `user_token`（员工身份，只能访问本人有权限的录音）；
 * - HTTP 状态恒为 200，成败只看响应体 `errCode === 0`；
 * - 开放 ID 形如 `<oid>-<id>`，原样透传，不解析、不截断（避免 JS number 精度丢失）；
 * - 提交转写/纪要只代表「任务已受理」，返回状态恒为 5（重新生成中），SDK 不做自动轮询；
 *   `createSummaryTask` 需要先满足 `convertState === 4 && hasTranscription === true`，否则服务端 64007；
 * - 转写重复提交会重复扣配额，调用方需自行幂等；
 * - 时间字段：`duration` 毫秒，`createTime`/`modifyTime` 微秒。
 */
import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, parseApiResponse, errCodeOf, FetchFn } from "./http";
import {
  SmartRecording,
  SmartRecordingDetailResult,
  SmartRecordingListResult,
  SmartRecordingSummaryResult,
  SmartRecordingTag,
  SmartRecordingTagListResult,
  SmartRecordingTemplate,
  SmartRecordingTemplateListResult,
  SmartRecordingTranscribeResult,
} from "./models";

type AnyDict = Record<string, any>;

/** 录音列表分页参数：`page` 默认 1；`pageSize` 默认 20，服务端 >100 静默截断为 100。 */
export interface FetchRecordingListOpts {
  page?: number;
  pageSize?: number;
  user_token?: string;
  fetchFn?: FetchFn;
}

export interface FetchRecordingDetailOpts {
  /** 录音 ID（必填），形如 `<oid>-<id>`，原样透传。 */
  recordingId: string;
  user_token?: string;
  fetchFn?: FetchFn;
}

export interface CreateTranscriptionTaskOpts {
  /** 录音 ID（必填）。 */
  recordingId: string;
  user_token?: string;
  fetchFn?: FetchFn;
}

export interface CreateSummaryTaskOpts {
  /** 录音 ID（必填）。 */
  recordingId: string;
  /** 纪要模板 ID（可选，缺省用组织默认模板）。 */
  templateId?: string;
  user_token?: string;
  fetchFn?: FetchFn;
}

export interface FetchRecordingTagsOpts {
  user_token?: string;
  fetchFn?: FetchFn;
}

/** 模板列表分页参数：`page` 默认 1；`page_size` 默认 20，服务端 >100 或非数字返回 45000（不截断）。 */
export interface FetchRecordingTemplatesOpts {
  page?: number;
  pageSize?: number;
  user_token?: string;
  fetchFn?: FetchFn;
}

/** 服务端数字字段归一化：非 number / 非有限值（缺失、字符串、NaN）一律视为 null。 */
function _numOrNull(value: any): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * 4.60.1 获取录音列表（POST `/v1/smart_recording/recordings/fetch`）。
 *
 * 翻页只能依据 `hasMore`：服务端可能返回「本页 0 条 + hasMore=true」，此时应继续翻页。
 * `total` 为可选字段，未返回时为 null。
 */
export async function fetchRecordingList(
  config: LansengerConfig,
  appToken: string,
  opts?: FetchRecordingListOpts,
): Promise<SmartRecordingListResult> {
  const url = buildApiUrl(config, "smart_recording", "recordings_fetch", appToken, {
    userToken: opts?.user_token || "",
  });
  // 显式发送服务端默认值，避免「未传」与「传 0」在服务端口径不一致。
  const body: AnyDict = {
    page: opts?.page ?? 1,
    pageSize: opts?.pageSize ?? 20,
  };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new SmartRecordingListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingListResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  return new SmartRecordingListResult({
    success: true,
    recordings: Array.isArray(d.recordings) ? (d.recordings as SmartRecording[]) : null,
    total: _numOrNull(d.total),
    hasMore: typeof d.hasMore === "boolean" ? d.hasMore : false,
    raw_response: data!,
  });
}

/**
 * 4.60.2 获取录音详情（GET `/v1/smart_recording/recordings/{recording_id}/fetch`）。
 *
 * `errCode=0` 但 `data.recording` 缺失时返回 success=true + recording=null（契约明确，不映射 64000）。
 * 提交转写/纪要后需轮询该接口：`convertState`/`summaryState` 转为 4 且 `hasTranscription`/`hasSummary` 为 true 才算完成。
 */
export async function fetchRecordingDetail(
  config: LansengerConfig,
  appToken: string,
  opts: FetchRecordingDetailOpts,
): Promise<SmartRecordingDetailResult> {
  const recordingId = opts?.recordingId || "";
  if (!recordingId) return new SmartRecordingDetailResult({ success: false, error: "recording_id is required" });

  const url = buildApiUrl(config, "smart_recording", "recording_detail", appToken, {
    userToken: opts.user_token || "",
    pathVars: { recording_id: recordingId },
  });
  const [data, httpErr] = await doGet(url, opts.fetchFn);
  if (httpErr) return new SmartRecordingDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingDetailResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  const recording = d.recording && typeof d.recording === "object" && !Array.isArray(d.recording)
    ? (d.recording as SmartRecording)
    : null;
  return new SmartRecordingDetailResult({ success: true, recording, raw_response: data! });
}

/**
 * 4.60.3 提交转写任务（POST `/v1/smart_recording/recordings/{recording_id}/transcribe/create`，无 body）。
 *
 * 受理成功时 `convertState` 恒为 5（重新生成中），需轮询详情确认完成。
 * 重复提交会重复扣配额，调用方需自行幂等。
 */
export async function createTranscriptionTask(
  config: LansengerConfig,
  appToken: string,
  opts: CreateTranscriptionTaskOpts,
): Promise<SmartRecordingTranscribeResult> {
  const recordingId = opts?.recordingId || "";
  if (!recordingId) return new SmartRecordingTranscribeResult({ success: false, error: "recording_id is required" });

  const url = buildApiUrl(config, "smart_recording", "transcribe_create", appToken, {
    userToken: opts.user_token || "",
    pathVars: { recording_id: recordingId },
  });
  const [data, httpErr] = await doPost(url, {}, opts.fetchFn);
  if (httpErr) return new SmartRecordingTranscribeResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingTranscribeResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  return new SmartRecordingTranscribeResult({
    success: true,
    recordingId: d.recordingId ?? null,
    convertState: _numOrNull(d.convertState),
    raw_response: data!,
  });
}

/**
 * 4.60.4 提交纪要任务（POST `/v1/smart_recording/recordings/{recording_id}/summary/create`）。
 *
 * 前置条件：`convertState === 4 && hasTranscription === true`，否则服务端 64007。
 * 受理成功时 `summaryState` 恒为 5（重新生成中），需轮询详情确认完成。
 */
export async function createSummaryTask(
  config: LansengerConfig,
  appToken: string,
  opts: CreateSummaryTaskOpts,
): Promise<SmartRecordingSummaryResult> {
  const recordingId = opts?.recordingId || "";
  if (!recordingId) return new SmartRecordingSummaryResult({ success: false, error: "recording_id is required" });

  const url = buildApiUrl(config, "smart_recording", "summary_create", appToken, {
    userToken: opts.user_token || "",
    pathVars: { recording_id: recordingId },
  });
  // templateId 为可选：缺省走组织默认模板，不要发送空字符串。
  const body: AnyDict = {};
  if (opts.templateId) body.templateId = opts.templateId;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new SmartRecordingSummaryResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingSummaryResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  return new SmartRecordingSummaryResult({
    success: true,
    recordingId: d.recordingId ?? null,
    summaryState: _numOrNull(d.summaryState),
    raw_response: data!,
  });
}

/**
 * 4.60.5 获取标签列表（GET `/v1/smart_recording/tags/fetch`）。
 *
 * 无分页。标签可能因组织级配置「静默缺条」（只返回部分标签且无错误码），
 * 需要完整标签时应以管理端列表为准或重试。
 */
export async function fetchRecordingTags(
  config: LansengerConfig,
  appToken: string,
  opts?: FetchRecordingTagsOpts,
): Promise<SmartRecordingTagListResult> {
  const url = buildApiUrl(config, "smart_recording", "tags_fetch", appToken, {
    userToken: opts?.user_token || "",
  });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new SmartRecordingTagListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingTagListResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  return new SmartRecordingTagListResult({
    success: true,
    tags: Array.isArray(d.tags) ? (d.tags as SmartRecordingTag[]) : null,
    raw_response: data!,
  });
}

/**
 * 4.60.6 获取纪要模板列表（GET `/v1/smart_recording/templates/fetch?page&page_size`）。
 *
 * 注意与录音列表的分页参数命名差异：这里是 query 的 `page_size`（服务端 >100 或非数字返回 45000，
 * 不做静默截断）；录音列表是 body 的 `pageSize`。翻页依据 `hasMore`。
 */
export async function fetchRecordingTemplates(
  config: LansengerConfig,
  appToken: string,
  opts?: FetchRecordingTemplatesOpts,
): Promise<SmartRecordingTemplateListResult> {
  const url = buildApiUrl(config, "smart_recording", "templates_fetch", appToken, {
    userToken: opts?.user_token || "",
    queryParams: {
      page: opts?.page ?? 1,
      page_size: opts?.pageSize ?? 20,
    },
  });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new SmartRecordingTemplateListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new SmartRecordingTemplateListResult({ success: false, error: apiErr, err_code: errCodeOf(data) });

  const d = (data!.data || {}) as AnyDict;
  return new SmartRecordingTemplateListResult({
    success: true,
    templates: Array.isArray(d.templates) ? (d.templates as SmartRecordingTemplate[]) : null,
    total: _numOrNull(d.total),
    hasMore: typeof d.hasMore === "boolean" ? d.hasMore : false,
    raw_response: data!,
  });
}
