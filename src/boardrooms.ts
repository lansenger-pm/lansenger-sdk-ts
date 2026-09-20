// Lansenger boardroom API — meeting-room lookup and reservation (会议室预定 V2).
//
// Endpoints: all 11 under /xtra/boardroom/server/openapi/v2/ (POST).
// Paths carry a /server segment (production stage; dev/test environments omit it).
// gradingId (分区ID) is required by most endpoints. user_token, when provided,
// overrides body identity fields. Several doc fields use the historical
// spelling "Fooler" (= Floor). Reserve times use yyyy-MM-dd HH:mm:ss.

import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  BoardroomAreaListResult,
  BoardroomDetailResult,
  BoardroomGradingListResult,
  BoardroomListResult,
  BoardroomOpResult,
  BoardroomReserveDetailResult,
  BoardroomReserveResult,
  BoardroomScheduleResult,
} from "./models";

export const BOARDROOM_STATUS_APPROVING = 0;
export const BOARDROOM_STATUS_PENDING_SIGN = 1;
export const BOARDROOM_STATUS_SIGN_TIMEOUT = 2;
export const BOARDROOM_STATUS_REJECTED = 3;
export const BOARDROOM_STATUS_CANCELED = 4;
export const BOARDROOM_STATUS_RESERVED = 5;
export const BOARDROOM_STATUS_FINISHED = 6;

export const BOARDROOM_RESERVE_TYPE_SINGLE = "0";
export const BOARDROOM_RESERVE_TYPE_REPEAT = "1";
export const BOARDROOM_EDIT_TYPE_CURRENT = "1";
export const BOARDROOM_EDIT_TYPE_CURRENT_AND_AFTER = "2";
export const BOARDROOM_CANCEL_TYPE_CURRENT = "1";
export const BOARDROOM_CANCEL_TYPE_CURRENT_AND_AFTER = "2";
export const BOARDROOM_CANCEL_TYPE_ALL_UNFINISHED = "3";

export interface BoardroomReserveOpts {
  reserve_user?: string;
  org_id?: string;
  toastmaster?: string;
  leader?: string;
  leader_attend?: string;
  people_number?: string;
  other_demand?: string;
  is_video?: string;
  video_name?: string;
  user_list?: string[];
  invitation_user_list?: string[];
  table_cards?: string;
  reserve_type?: string;
  repeat_type?: string;
  repeat_days?: number[];
  skip?: string;
  repeat_end_date?: string;
  user_token?: string;
  fetchFn?: FetchFn;
}

function identity(body: Record<string, any>, lxUserId?: string, orgId?: string): void {
  if (lxUserId) body.lxUserId = lxUserId;
  if (orgId) body.orgId = orgId;
}

function parsePageInfo(data: Record<string, any> | null) {
  const d = data || {};
  return { count: d.count ?? 0, items: d.data || [] };
}

function buildReserveBody(
  boardroomId: string, name: string, gradingId: string,
  startStr: string, endStr: string, noticeTime: string,
  opts: BoardroomReserveOpts, reserveId?: string, editType?: string,
): Record<string, any> {
  const body: Record<string, any> = {
    boardRoomId: boardroomId, name, gradingId,
    reserveTimeStartStr: startStr, reserveTimeEndStr: endStr, noticeTime,
  };
  if (opts.reserve_user) body.reserveUser = opts.reserve_user;
  if (opts.org_id) body.orgId = opts.org_id;
  if (opts.toastmaster) body.toastmaster = opts.toastmaster;
  if (opts.leader) body.leader = opts.leader;
  if (opts.leader_attend) body.leaderAttend = opts.leader_attend;
  if (opts.people_number) body.peopleNumber = opts.people_number;
  if (opts.other_demand) body.otherDemand = opts.other_demand;
  if (opts.is_video) body.isVideo = opts.is_video;
  if (opts.video_name) body.videoName = opts.video_name;
  if (opts.user_list) body.userList = opts.user_list;
  if (opts.invitation_user_list) body.invitationUserList = opts.invitation_user_list;
  if (opts.table_cards) body.tableCards = opts.table_cards;
  if (opts.reserve_type) body.reserveType = opts.reserve_type;
  if (opts.repeat_type) body.repeatType = opts.repeat_type;
  if (opts.repeat_days) body.repeatDays = opts.repeat_days;
  if (opts.skip) body.skip = opts.skip;
  if (opts.repeat_end_date) body.repeatEndDateStr = opts.repeat_end_date;
  if (reserveId) body.id = reserveId;
  if (editType) body.editType = editType;
  return body;
}

function parseReserveResult(data: Record<string, any>): Record<string, any> {
  const d = data.data || {};
  return {
    reserve_id: d.id ?? null,
    reserve_code: d.reserveCode ?? null,
    boardroom_name: d.boardRoomName ?? null,
    meeting_name: d.name ?? null,
    status: d.status ?? null,
    reserve_time_start: d.reserveTimeStart ?? null,
    reserve_time_end: d.reserveTimeEnd ?? null,
    reserve_time: d.reserveTime ?? null,
  };
}

export async function fetchBoardroomList(
  config: LansengerConfig, appToken: string,
  opts: {
    grading_id?: string; area_office_id?: string; floor_ids?: string[];
    equipment?: string[]; reserve_time_start?: string; reserve_time_end?: string;
    query_date?: string; page?: number; limit?: number;
    lx_user_id?: string; org_id?: string; user_token?: string; fetchFn?: FetchFn;
  } = {},
): Promise<BoardroomListResult> {
  const url = buildApiUrl(config, "boardrooms", "room_list", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { page: opts.page ?? 1, limit: opts.limit ?? 10 };
  if (opts.grading_id) body.gradingId = opts.grading_id;
  if (opts.area_office_id) body.areaOfficeId = opts.area_office_id;
  if (opts.floor_ids) body.areaOfficeFoolerIds = opts.floor_ids;
  if (opts.equipment) body.equipment = opts.equipment;
  if (opts.reserve_time_start) body.reserveTimeStartStr = opts.reserve_time_start;
  if (opts.reserve_time_end) body.reserveTimeEndStr = opts.reserve_time_end;
  if (opts.query_date) body.queryDate = opts.query_date;
  identity(body, opts.lx_user_id, opts.org_id);

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomListResult({ success: false, error: apiErr });
  return new BoardroomListResult({ success: true, raw_response: data!, ...parsePageInfo(data!.data || {}) });
}

export async function fetchBoardroomDetail(
  config: LansengerConfig, appToken: string, roomId: string,
  opts: { org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomDetailResult> {
  if (!roomId) return new BoardroomDetailResult({ success: false, error: "room_id is required" });
  const url = buildApiUrl(config, "boardrooms", "room_detail", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { id: roomId };
  if (opts.org_id) body.orgId = opts.org_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomDetailResult({
    success: true, room_id: d.id ?? null, name: d.name ?? null, status: d.status ?? null,
    people_num: d.peopleNum ?? null, can_reserve_flag: d.canReserveFlag ?? null,
    address: d.address ?? null, area_name: d.areaName ?? null, grading_id: d.gradingId ?? null,
    raw_response: data!,
  });
}

export async function fetchBoardroomSchedule(
  config: LansengerConfig, appToken: string, roomId: string, queryDate: string, gradingId: string,
  opts: { reserve_user_id?: string; org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomScheduleResult> {
  if (!roomId) return new BoardroomScheduleResult({ success: false, error: "room_id is required" });
  if (!queryDate) return new BoardroomScheduleResult({ success: false, error: "query_date is required" });
  if (!gradingId) return new BoardroomScheduleResult({ success: false, error: "grading_id is required" });
  const url = buildApiUrl(config, "boardrooms", "room_schedule", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { roomId, queryDate, gradingId };
  if (opts.reserve_user_id) body.reserveUserId = opts.reserve_user_id;
  if (opts.org_id) body.orgId = opts.org_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomScheduleResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomScheduleResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomScheduleResult({
    success: true, room_id: d.id ?? null, name: d.name ?? null,
    people_num: d.peopleNum ?? null, can_reserve_flag: d.canReserveFlag ?? null,
    reserves: d.reserveDtoList ?? null, deactivations: d.deactivatedInfoList ?? null,
    raw_response: data!,
  });
}

export async function fetchBoardroomReserveDetail(
  config: LansengerConfig, appToken: string, reserveRoomId: string,
  opts: { grading_id?: string; org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomReserveDetailResult> {
  if (!reserveRoomId) return new BoardroomReserveDetailResult({ success: false, error: "reserve_room_id is required" });
  const url = buildApiUrl(config, "boardrooms", "reserve_detail", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { reserveRoomId };
  if (opts.grading_id) body.gradingId = opts.grading_id;
  if (opts.org_id) body.orgId = opts.org_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomReserveDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new BoardroomReserveDetailResult({
    success: true, reserve_id: d.id ?? null, boardroom_name: d.boardRoomName ?? null,
    meeting_name: d.name ?? null, status: d.status ?? null,
    reserve_time_start: d.reserveTimeStart ?? null, reserve_time_end: d.reserveTimeEnd ?? null,
    reserve_time: d.reserveTime ?? null, reserve_user_name: d.reserveUserName ?? null,
    people_number: d.peopleNumber ?? null, raw_response: data!,
  });
}

export async function reserveBoardroom(
  config: LansengerConfig, appToken: string,
  boardroomId: string, name: string, gradingId: string,
  startStr: string, endStr: string, noticeTime: string,
  opts: BoardroomReserveOpts = {},
): Promise<BoardroomReserveResult> {
  if (!boardroomId) return new BoardroomReserveResult({ success: false, error: "boardroom_id is required" });
  if (!name) return new BoardroomReserveResult({ success: false, error: "name is required" });
  if (!gradingId) return new BoardroomReserveResult({ success: false, error: "grading_id is required" });
  if (!startStr) return new BoardroomReserveResult({ success: false, error: "reserve_time_start is required" });
  if (!endStr) return new BoardroomReserveResult({ success: false, error: "reserve_time_end is required" });
  if (!noticeTime) return new BoardroomReserveResult({ success: false, error: "notice_time is required" });
  const url = buildApiUrl(config, "boardrooms", "reserve_room", appToken, { userToken: opts.user_token });
  const body = buildReserveBody(boardroomId, name, gradingId, startStr, endStr, noticeTime, opts);
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomReserveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveResult({ success: false, error: apiErr });
  return new BoardroomReserveResult({ success: true, raw_response: data!, ...parseReserveResult(data!) });
}

export async function editBoardroomReserve(
  config: LansengerConfig, appToken: string,
  reserveId: string, boardroomId: string, name: string, gradingId: string,
  startStr: string, endStr: string, noticeTime: string,
  opts: BoardroomReserveOpts & { edit_type?: string } = {},
): Promise<BoardroomReserveResult> {
  if (!reserveId) return new BoardroomReserveResult({ success: false, error: "reserve_id is required" });
  if (!boardroomId) return new BoardroomReserveResult({ success: false, error: "boardroom_id is required" });
  if (!name) return new BoardroomReserveResult({ success: false, error: "name is required" });
  if (!gradingId) return new BoardroomReserveResult({ success: false, error: "grading_id is required" });
  if (!startStr) return new BoardroomReserveResult({ success: false, error: "reserve_time_start is required" });
  if (!endStr) return new BoardroomReserveResult({ success: false, error: "reserve_time_end is required" });
  if (!noticeTime) return new BoardroomReserveResult({ success: false, error: "notice_time is required" });
  const url = buildApiUrl(config, "boardrooms", "edit_reserve", appToken, { userToken: opts.user_token });
  const body = buildReserveBody(boardroomId, name, gradingId, startStr, endStr, noticeTime, opts, reserveId, opts.edit_type ?? BOARDROOM_EDIT_TYPE_CURRENT);
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomReserveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomReserveResult({ success: false, error: apiErr });
  return new BoardroomReserveResult({ success: true, raw_response: data!, ...parseReserveResult(data!) });
}

export async function cancelBoardroomReserve(
  config: LansengerConfig, appToken: string, reserveId: string,
  opts: {
    cancel_user_id?: string; org_id?: string; cancel_reason?: string;
    is_send?: boolean; notify_user_list?: string[]; cancel_video?: string;
    cancel_type?: string; user_token?: string; fetchFn?: FetchFn;
  } = {},
): Promise<BoardroomOpResult> {
  if (!reserveId) return new BoardroomOpResult({ success: false, error: "reserve_id is required" });
  const url = buildApiUrl(config, "boardrooms", "reserve_cancel", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { id: reserveId };
  if (opts.cancel_user_id) body.cancelUserId = opts.cancel_user_id;
  if (opts.org_id) body.orgId = opts.org_id;
  if (opts.cancel_reason) body.cancelReason = opts.cancel_reason;
  if (opts.is_send !== undefined) body.isSend = opts.is_send;
  if (opts.notify_user_list) body.userList = opts.notify_user_list;
  if (opts.cancel_video) body.cancelVideo = opts.cancel_video;
  if (opts.cancel_type) body.cancelType = opts.cancel_type;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomOpResult({ success: false, error: apiErr });
  return new BoardroomOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

export async function confirmBoardroomSign(
  config: LansengerConfig, appToken: string, reserveId: string,
  opts: { org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomOpResult> {
  if (!reserveId) return new BoardroomOpResult({ success: false, error: "reserve_id is required" });
  const url = buildApiUrl(config, "boardrooms", "confirm_sign", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { id: reserveId };
  if (opts.org_id) body.orgId = opts.org_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomOpResult({ success: false, error: apiErr });
  return new BoardroomOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

export async function fetchMyBoardroomReserves(
  config: LansengerConfig, appToken: string, gradingId: string,
  opts: {
    keys?: string; start_time?: string; end_time?: string; boardroom_id?: string;
    floor_ids?: string[]; page?: number; limit?: number;
    lx_user_id?: string; org_id?: string; user_token?: string; fetchFn?: FetchFn;
  } = {},
): Promise<BoardroomListResult> {
  if (!gradingId) return new BoardroomListResult({ success: false, error: "grading_id is required" });
  const url = buildApiUrl(config, "boardrooms", "my_reserve_list", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = { gradingId, page: opts.page ?? 1, limit: opts.limit ?? 10 };
  if (opts.keys) body.keys = opts.keys;
  if (opts.start_time) body.startTime = opts.start_time;
  if (opts.end_time) body.endTime = opts.end_time;
  if (opts.boardroom_id) body.boardRoomId = opts.boardroom_id;
  if (opts.floor_ids) body.areaOfficeFoolerIds = opts.floor_ids;
  identity(body, opts.lx_user_id, opts.org_id);
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomListResult({ success: false, error: apiErr });
  return new BoardroomListResult({ success: true, raw_response: data!, ...parsePageInfo(data!.data || {}) });
}

export async function fetchBoardroomGradings(
  config: LansengerConfig, appToken: string,
  opts: { lx_user_id?: string; org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomGradingListResult> {
  const url = buildApiUrl(config, "boardrooms", "grading_list", appToken, { userToken: opts.user_token });
  const body: Record<string, any> = {};
  identity(body, opts.lx_user_id, opts.org_id);
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new BoardroomGradingListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomGradingListResult({ success: false, error: apiErr });
  const gradings = data!.data || [];
  return new BoardroomGradingListResult({ success: true, total: gradings.length, gradings, raw_response: data! });
}

export async function fetchBoardroomAreaOffices(
  config: LansengerConfig, appToken: string, gradingId: string,
  opts: { user_token?: string; fetchFn?: FetchFn } = {},
): Promise<BoardroomAreaListResult> {
  if (!gradingId) return new BoardroomAreaListResult({ success: false, error: "grading_id is required" });
  const url = buildApiUrl(config, "boardrooms", "area_office_list", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, { gradingId }, opts.fetchFn);
  if (httpErr) return new BoardroomAreaListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BoardroomAreaListResult({ success: false, error: apiErr });
  const areas = data!.data || [];
  return new BoardroomAreaListResult({ success: true, total: areas.length, areas, raw_response: data! });
}
