import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  OvertimeConfigResult, OvertimeTypeListResult, OvertimeGroupListResult,
  OvertimeDurationResult, OvertimeUploadURLResult, OvertimeSubmitResult,
  OvertimeApplyListResult,
} from "./models";

export async function getOvertimeConfig(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeConfigResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "config", appToken, { userToken });
  const body: Record<string, any> = { orgId, staffId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new OvertimeConfigResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeConfigResult({ success: false, error: apiErr });
  return new OvertimeConfigResult({ success: true, raw_response: data! });
}

export async function getOvertimeTypes(
  config: LansengerConfig,
  appToken: string,
  cmcId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeTypeListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "types", appToken, { userToken });
  const body: Record<string, any> = { cmcId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new OvertimeTypeListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeTypeListResult({ success: false, error: apiErr });
  return new OvertimeTypeListResult({ success: true, raw_response: data! });
}

export async function getOvertimeGroups(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeGroupListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "groups", appToken, { userToken });
  const body: Record<string, any> = { orgId, staffId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new OvertimeGroupListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeGroupListResult({ success: false, error: apiErr });
  return new OvertimeGroupListResult({ success: true, raw_response: data! });
}

export async function calculateOvertimeDuration(
  config: LansengerConfig,
  appToken: string,
  beginTime: string,
  endTime: string,
  opts?: { cmc_id?: string; group_code?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeDurationResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "calc_duration", appToken, { userToken });
  const body: Record<string, any> = { beginTime, endTime };
  if (opts?.cmc_id) body.cmcId = opts.cmc_id;
  if (opts?.group_code) body.groupCode = opts.group_code;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new OvertimeDurationResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeDurationResult({ success: false, error: apiErr });
  return new OvertimeDurationResult({ success: true, raw_response: data! });
}

export async function getOvertimeUploadURL(
  config: LansengerConfig,
  appToken: string,
  fileName: string,
  md5: string,
  orgId: string,
  size: number,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeUploadURLResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "upload", appToken, { userToken });
  const body: Record<string, any> = { fileName, md5, orgId, size };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new OvertimeUploadURLResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeUploadURLResult({ success: false, error: apiErr });
  return new OvertimeUploadURLResult({ success: true, raw_response: data! });
}

export async function submitOvertime(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeSubmitResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "submit", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new OvertimeSubmitResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeSubmitResult({ success: false, error: apiErr });
  return new OvertimeSubmitResult({ success: true, raw_response: data! });
}

export async function getOvertimeMyApplyList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OvertimeApplyListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "overtime", "list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new OvertimeApplyListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OvertimeApplyListResult({ success: false, error: apiErr });
  return new OvertimeApplyListResult({ success: true, raw_response: data! });
}
