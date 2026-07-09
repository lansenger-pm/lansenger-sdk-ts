import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  LeaveConfigResult, LeaveTypeListResult, LeaveGroupListResult,
  LeaveBalanceResult, LeaveTimesResult, LeaveUploadURLResult,
  LeaveSubmitResult, LeaveApplyListResult,
} from "./models";

export async function getLeaveConfig(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveConfigResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "config", appToken, { userToken });
  const body: Record<string, any> = { orgId, staffId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveConfigResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveConfigResult({ success: false, error: apiErr });
  return new LeaveConfigResult({ success: true, raw_response: data! });
}

export async function getLeaveTypes(
  config: LansengerConfig,
  appToken: string,
  cmcId: string,
  orgId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveTypeListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "types", appToken, { userToken });
  const body: Record<string, any> = { cmcId, orgId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveTypeListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveTypeListResult({ success: false, error: apiErr });
  return new LeaveTypeListResult({ success: true, raw_response: data! });
}

export async function getLeaveGroups(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveGroupListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "groups", appToken, { userToken });
  const body: Record<string, any> = { orgId, staffId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveGroupListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveGroupListResult({ success: false, error: apiErr });
  return new LeaveGroupListResult({ success: true, raw_response: data! });
}

export async function getLeaveBalance(
  config: LansengerConfig,
  appToken: string,
  cmcId: string,
  orgId: string,
  staffId: string,
  typeCode: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveBalanceResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "balance", appToken, { userToken });
  const body: Record<string, any> = { cmcId, orgId, staffId, typeCode };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveBalanceResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveBalanceResult({ success: false, error: apiErr });
  return new LeaveBalanceResult({ success: true, raw_response: data! });
}

export async function calculateLeaveTimes(
  config: LansengerConfig,
  appToken: string,
  cmcId: string,
  staffId: string,
  timesVo: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveTimesResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "calc_times", appToken, { userToken });
  const body: Record<string, any> = { cmcId, staffId, timesVO: timesVo };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveTimesResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveTimesResult({ success: false, error: apiErr });
  return new LeaveTimesResult({ success: true, raw_response: data! });
}

export async function getLeaveUploadURL(
  config: LansengerConfig,
  appToken: string,
  fileName: string,
  md5: string,
  orgId: string,
  size: number,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveUploadURLResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "upload", appToken, { userToken });
  const body: Record<string, any> = { fileName, md5, orgId, size };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new LeaveUploadURLResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveUploadURLResult({ success: false, error: apiErr });
  return new LeaveUploadURLResult({ success: true, raw_response: data! });
}

export async function submitLeave(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveSubmitResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "submit", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new LeaveSubmitResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveSubmitResult({ success: false, error: apiErr });
  return new LeaveSubmitResult({ success: true, raw_response: data! });
}

export async function getLeaveMyApplyList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<LeaveApplyListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "leave", "list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new LeaveApplyListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new LeaveApplyListResult({ success: false, error: apiErr });
  return new LeaveApplyListResult({ success: true, raw_response: data! });
}
