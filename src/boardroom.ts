import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  BoardroomScheduleResult, BoardroomListResult, BoardroomDetailResult,
  BoardroomReserveResult, BoardroomReserveDetailResult, BoardroomBooleanResult,
  BoardroomGenericResult, BoardroomGradingResult, BoardroomBatchApproveResult,
  BoardroomAreaOfficeResult, BoardroomApproveDetailResult,
} from "./models";

export async function getRoomSchedule(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomScheduleResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "room_schedule", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomScheduleResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomScheduleResult({ success: false, error: apiErr });
  return new BoardroomScheduleResult({ success: true, data: data!.data, raw_response: data! });
}

export async function getRoomList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "room_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomListResult({ success: true, total: d.count, data: d.data, raw_response: data! });
}

export async function getRoomDetail(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomDetailResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "room_detail", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomDetailResult({ success: false, error: apiErr });
  return new BoardroomDetailResult({ success: true, data: data!.data, raw_response: data! });
}

export async function reserveRoom(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomReserveResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "reserve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomReserveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveResult({ success: false, error: apiErr });
  return new BoardroomReserveResult({ success: true, data: data!.data, raw_response: data! });
}

export async function getReserveDetail(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomReserveDetailResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "reserve_detail", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomReserveDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveDetailResult({ success: false, error: apiErr });
  return new BoardroomReserveDetailResult({ success: true, data: data!.data, raw_response: data! });
}

export async function cancelReserve(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBooleanResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "reserve_cancel", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBooleanResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBooleanResult({ success: false, error: apiErr });
  return new BoardroomBooleanResult({ success: true, data: !!data!.data, raw_response: data! });
}

export async function removeBind(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "remove_bind", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGenericResult({ success: false, error: apiErr });
  return new BoardroomGenericResult({ success: true, raw_response: data! });
}

export async function rejectApprove(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBooleanResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "reject_approve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBooleanResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBooleanResult({ success: false, error: apiErr });
  return new BoardroomBooleanResult({ success: true, data: !!data!.data, raw_response: data! });
}

export async function getPendingApproveList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "pending_approve_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomListResult({ success: true, total: d.count, data: d.data, raw_response: data! });
}

export async function getMyReserveList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "my_reserve_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomListResult({ success: true, total: d.count, data: d.data, raw_response: data! });
}

export async function getGradingList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGradingResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "grading_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGradingResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGradingResult({ success: false, error: apiErr });
  return new BoardroomGradingResult({ success: true, data: data!.data || [], raw_response: data! });
}

export async function getMyReserveMoomList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "get_my_reserve_moom_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGenericResult({ success: false, error: apiErr });
  return new BoardroomGenericResult({ success: true, raw_response: data! });
}

export async function getMyReserveMoomListBySourceId(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "get_my_reserve_by_source", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGenericResult({ success: false, error: apiErr });
  return new BoardroomGenericResult({ success: true, raw_response: data! });
}

export async function editReserve(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomReserveResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "edit_reserve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomReserveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveResult({ success: false, error: apiErr });
  return new BoardroomReserveResult({ success: true, data: data!.data, raw_response: data! });
}

export async function confirmSign(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBooleanResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "confirm_sign", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBooleanResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBooleanResult({ success: false, error: apiErr });
  return new BoardroomBooleanResult({ success: true, data: !!data!.data, raw_response: data! });
}

export async function changeApprove(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBooleanResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "change_approve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBooleanResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBooleanResult({ success: false, error: apiErr });
  return new BoardroomBooleanResult({ success: true, data: !!data!.data, raw_response: data! });
}

export async function openapiCancel(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "cancel", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGenericResult({ success: false, error: apiErr });
  return new BoardroomGenericResult({ success: true, raw_response: data! });
}

export async function bindRoom(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomGenericResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "bind", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomGenericResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGenericResult({ success: false, error: apiErr });
  return new BoardroomGenericResult({ success: true, raw_response: data! });
}

export async function batchApprove(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBatchApproveResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "batch_approve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBatchApproveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBatchApproveResult({ success: false, error: apiErr });
  return new BoardroomBatchApproveResult({ success: true, data: data!.data || [], raw_response: data! });
}

export async function getAreaOfficeList(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomAreaOfficeResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "area_office_list", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomAreaOfficeResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomAreaOfficeResult({ success: false, error: apiErr });
  return new BoardroomAreaOfficeResult({ success: true, data: data!.data || [], raw_response: data! });
}

export async function getApproveDetail(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomApproveDetailResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "approve_detail", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomApproveDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomApproveDetailResult({ success: false, error: apiErr });
  return new BoardroomApproveDetailResult({ success: true, data: data!.data, raw_response: data! });
}

export async function agreeApprove(
  config: LansengerConfig,
  appToken: string,
  dto: Record<string, any>,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<BoardroomBooleanResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "boardroom", "agree_approve", appToken, { userToken });
  const [data, httpErr] = await doPost(url, dto, opts?.fetchFn);
  if (httpErr) return new BoardroomBooleanResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomBooleanResult({ success: false, error: apiErr });
  return new BoardroomBooleanResult({ success: true, data: !!data!.data, raw_response: data! });
}
