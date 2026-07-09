import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  AttendanceGenericResult, AttendanceAssociateResult,
} from "./models";

export async function getAssociateList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceAssociateResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "associate_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceAssociateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceAssociateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new AttendanceAssociateResult({
    success: true, total: d.total, pageNo: d.pageNo, pageSize: d.pageSize,
    hasNextPage: d.hasNextPage, result: d.result, raw_response: data!,
  });
}

export async function getOutApplyMyList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "out_my_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getUnusedOutClockList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "out_unused", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function submitOutApply(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "out_submit", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getDailyStat(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "daily_stat", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getClockRecords(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "clock_records", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getStaffClockRecords(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "staff_records", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getAttendanceGroupInfo(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "group_info", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getMakeupUsedCount(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "makeup_count", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getAbnormalList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "abnormal_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getMakeupMyList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "makeup_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function submitMakeup(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "makeup_submit", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getResourceDownloadUrl(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "download", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function getUploadUrl(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "upload_url", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}

export async function uploadResource(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<AttendanceGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "attendance", "upload", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new AttendanceGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new AttendanceGenericResult({ success: false, error: apiErr });
  return new AttendanceGenericResult({ success: true, raw_response: data! });
}
