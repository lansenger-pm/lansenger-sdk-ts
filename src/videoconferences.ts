import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  VideoconferenceDetailResult, VideoconferenceOpResult,
  VideoconferenceListResult, VideoconferenceStatusListResult,
  VideoconferenceParamResult, VideoconferenceVodListResult,
  VideoconferenceVodUrlResult, VideoconferenceConfResult,
} from "./models";
import {
  VC_MEMBER_ROLE_HOST, VC_OPS,
  VC_FETCH_RANGE_PERSON,
  VC_CREATE_SOURCE_CLIENT,
} from "./constants";

type AnyDict = Record<string, any>;

function _orgId(orgId: string | number): string | number {
  return /^\d+$/.test(String(orgId)) ? parseInt(String(orgId), 10) : orgId;
}

/** Server requires exactly one member with the host role on create. */
function _hostRequired(members?: AnyDict[] | null): string | null {
  if (!members || !members.length) return "member is required (with exactly one host)";
  const hosts = members.filter(m => String(m.role || "") === VC_MEMBER_ROLE_HOST);
  if (hosts.length !== 1) return "exactly one member must have role='admin'";
  return null;
}

function _pageData(data: AnyDict | null): { offset: number; total: number; items: AnyDict[] | null } {
  const d = data || {};
  return { offset: d.offset ?? 0, total: d.total ?? 0, items: d.items ?? d.mids ?? null };
}

function _op(data: AnyDict | null): { done: boolean; message: string | null } {
  const d = (data || {}).data || {};
  return { done: d.code === 0, message: d.message ?? null };
}

export async function createMeeting(
  config: LansengerConfig,
  appToken: string,
  opts: {
    subject: string; start_time: number;
    members: AnyDict[]; org_id: string | number;
    auto_record?: number; type?: number; group_new?: number;
    conf_password?: string; control_password?: string;
    mask_type?: number; ext_attr?: string;
    join_mute?: number; open_mute?: number; enable_pre_join?: number;
    user_stop_time?: number; invite_admin?: number;
    user_token?: string; fetchFn?: FetchFn;
  },
): Promise<VideoconferenceDetailResult> {
  if (!opts.subject) return new VideoconferenceDetailResult({ success: false, error: "subject is required" });
  const hostErr = _hostRequired(opts.members);
  if (hostErr) return new VideoconferenceDetailResult({ success: false, error: hostErr });
  if (!opts.start_time) return new VideoconferenceDetailResult({ success: false, error: "start_time is required" });

  const url = buildApiUrl(config, "videoconference", "meeting_create", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    subject: opts.subject, startTime: opts.start_time,
    autoRecord: opts.auto_record ?? 0, type: opts.type ?? 1, groupNew: opts.group_new ?? 0,
    confPassword: opts.conf_password ?? "", controlPassword: opts.control_password ?? "",
    member: opts.members, extAttr: opts.ext_attr ?? "",
    maskType: opts.mask_type ?? 0, orgId: _orgId(opts.org_id),
  };
  for (const [key, val] of Object.entries({ joinMute: opts.join_mute, openMute: opts.open_mute, enablePreJoin: opts.enable_pre_join, userStopTime: opts.user_stop_time, inviteAdmin: opts.invite_admin })) {
    if (val !== undefined) body[key] = val;
  }
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new VideoconferenceDetailResult({
    success: true, mid: d.id ?? d.mid, subject: d.subject,
    meeting_number: d.meetingNumber, start_time: d.startTime,
    type: d.type, status: d.status, raw_response: data!,
  });
}

export async function modifyMeeting(
  config: LansengerConfig,
  appToken: string,
  opts: {
    mid: string | number; subject: string; start_time: number;
    members: AnyDict[]; org_id: string | number; operator: string;
    auto_record?: number; type?: number; group_new?: number;
    conf_password?: string; control_password?: string;
    user_token?: string; fetchFn?: FetchFn;
  },
): Promise<VideoconferenceOpResult> {
  const hostErr = _hostRequired(opts.members);
  if (hostErr) return new VideoconferenceOpResult({ success: false, error: hostErr });
  const url = buildApiUrl(config, "videoconference", "meeting_modify", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), operator: opts.operator,
    mid: parseInt(String(opts.mid), 10), subject: opts.subject,
    startTime: opts.start_time, autoRecord: opts.auto_record ?? 0,
    type: opts.type ?? 1, groupNew: opts.group_new ?? 0,
    confPassword: opts.conf_password ?? "", controlPassword: opts.control_password ?? "",
    member: opts.members,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function cancelMeeting(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceOpResult> {
  const url = buildApiUrl(config, "videoconference", "meeting_cancel", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, mid: parseInt(String(opts.mid), 10) };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function stopMeeting(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceOpResult> {
  const url = buildApiUrl(config, "videoconference", "meeting_stop", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, mid: parseInt(String(opts.mid), 10) };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function fetchMeetingDetail(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceDetailResult> {
  const url = buildApiUrl(config, "videoconference", "meeting_detail", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, mid: parseInt(String(opts.mid), 10) };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new VideoconferenceDetailResult({
    success: true, mid: d.id, subject: d.subject,
    meeting_number: d.meetingNumber, start_time: d.startTime,
    stop_time: d.stopTime, type: d.type, status: d.status,
    admin: d.admin, raw_response: data!,
  });
}

export async function fetchMeetingList(
  config: LansengerConfig,
  appToken: string,
  opts: {
    org_id: string | number; start_time: number; end_time: number;
    fetch_range?: string; staff_id?: string; limit?: number; offset?: number;
    user_token?: string; fetchFn?: FetchFn;
  },
): Promise<VideoconferenceListResult> {
  const fetchRange = opts.fetch_range || "all";
  if (fetchRange === VC_FETCH_RANGE_PERSON && !opts.staff_id) {
    return new VideoconferenceListResult({ success: false, error: "staff_id is required when fetch_range='person'" });
  }
  const url = buildApiUrl(config, "videoconference", "meeting_list", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), limit: opts.limit ?? 10, offset: opts.offset ?? 0,
    startTime: opts.start_time, endTime: opts.end_time,
    fetchRange, staffId: opts.staff_id || "",
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchMeetingRecordList(
  config: LansengerConfig,
  appToken: string,
  opts: {
    org_id: string | number; start_time: number; end_time: number;
    admin?: string; create_source?: number; limit?: number; offset?: number;
    user_token?: string; fetchFn?: FetchFn;
  },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "meeting_record_list", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), limit: opts.limit ?? 10, offset: opts.offset ?? 0,
    startTime: opts.start_time, endTime: opts.end_time,
    admin: opts.admin || "", createSource: opts.create_source ?? VC_CREATE_SOURCE_CLIENT,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchMemberSimplerecord(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "member_simplerecord", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), mid: parseInt(String(opts.mid), 10),
    operator: opts.operator, limit: opts.limit ?? 10, offset: opts.offset ?? 0,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchFixroomList(
  config: LansengerConfig,
  appToken: string,
  opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "fixroom_list", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), operator: opts.operator,
    limit: opts.limit ?? 10, offset: opts.offset ?? 0,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchMeetingStatus(
  config: LansengerConfig,
  appToken: string,
  opts: { mids: (string | number)[]; org_id: string | number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceStatusListResult> {
  if (!opts.mids || !opts.mids.length) {
    return new VideoconferenceStatusListResult({ success: false, error: "mids is required" });
  }
  const url = buildApiUrl(config, "videoconference", "status_fetchmore", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), mids: opts.mids.map(m => parseInt(String(m), 10)) };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceStatusListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceStatusListResult({ success: false, error: apiErr });
  const statuses = (data!.data || {}).mids || [];
  return new VideoconferenceStatusListResult({ success: true, statuses, raw_response: data! });
}

export async function subscribeMeetingEvents(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; events: AnyDict[]; call_back_info?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceOpResult> {
  const url = buildApiUrl(config, "videoconference", "events_subscribe", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), mid: parseInt(String(opts.mid), 10), events: opts.events };
  if (opts.call_back_info) body.callBackInfo = opts.call_back_info;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function fetchMeetingParams(
  config: LansengerConfig,
  appToken: string,
  opts: { meeting_number: string; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceParamResult> {
  if (!opts.meeting_number) return new VideoconferenceParamResult({ success: false, error: "meeting_number is required" });
  const url = buildApiUrl(config, "videoconference", "param_fetch", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), meetingNumber: opts.meeting_number, operator: opts.operator };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceParamResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceParamResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new VideoconferenceParamResult({ success: true, data: d.meetingInfo, raw_response: data! });
}

export async function fetchHistoryMeetings(
  config: LansengerConfig,
  appToken: string,
  opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "history_fetch", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, limit: opts.limit ?? 10, offset: opts.offset ?? 0 };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchActiveMeetings(
  config: LansengerConfig,
  appToken: string,
  opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "active_fetch", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, limit: opts.limit ?? 10, offset: opts.offset ?? 0 };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function controlMeetingMember(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; staff_id: string; op_code: string; operator: string; org_id: string | number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceOpResult> {
  if (!VC_OPS.includes(opts.op_code)) {
    return new VideoconferenceOpResult({ success: false, error: `op_code must be one of ${VC_OPS.join(", ")}` });
  }
  const url = buildApiUrl(config, "videoconference", "member_control", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), staffId: opts.staff_id,
    mid: parseInt(String(opts.mid), 10), opCode: opts.op_code, operator: opts.operator,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function inviteMeetingMembers(
  config: LansengerConfig,
  appToken: string,
  opts: { meeting_number: string; members: AnyDict[]; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceOpResult> {
  if (!opts.members || !opts.members.length) {
    return new VideoconferenceOpResult({ success: false, error: "member is required" });
  }
  const url = buildApiUrl(config, "videoconference", "member_invite", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), operator: opts.operator,
    meetingNumber: opts.meeting_number, member: opts.members,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceOpResult({ success: false, error: apiErr });
  return new VideoconferenceOpResult({ success: true, raw_response: data!, ..._op(data!) });
}

export async function fetchMeetingMemberList(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceListResult> {
  const url = buildApiUrl(config, "videoconference", "member_list", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = {
    orgId: _orgId(opts.org_id), mid: parseInt(String(opts.mid), 10),
    operator: opts.operator, limit: opts.limit ?? 10, offset: opts.offset ?? 0,
  };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceListResult({ success: false, error: apiErr });
  return new VideoconferenceListResult({ success: true, raw_response: data!, ..._pageData(data!.data) });
}

export async function fetchVodList(
  config: LansengerConfig,
  appToken: string,
  opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceVodListResult> {
  const url = buildApiUrl(config, "videoconference", "vod_list", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), mid: parseInt(String(opts.mid), 10), operator: opts.operator };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceVodListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceVodListResult({ success: false, error: apiErr });
  const items = (data!.data || {}).items || [];
  return new VideoconferenceVodListResult({ success: true, items, raw_response: data! });
}

export async function fetchVodDownloadUrls(
  config: LansengerConfig,
  appToken: string,
  opts: { vods: AnyDict[]; org_id: string | number; operator: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceVodUrlResult> {
  if (!opts.vods || !opts.vods.length || opts.vods.length > 3) {
    return new VideoconferenceVodUrlResult({ success: false, error: "vods must contain 1..3 entries" });
  }
  const url = buildApiUrl(config, "videoconference", "vod_download_url", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id), operator: opts.operator, vods: opts.vods };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceVodUrlResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceVodUrlResult({ success: false, error: apiErr });
  return new VideoconferenceVodUrlResult({ success: true, data: data!.data || {}, raw_response: data! });
}

export async function fetchOrgVideoconfConf(
  config: LansengerConfig,
  appToken: string,
  opts: { org_id: string | number; meeting_number?: string; operator?: string; user_token?: string; fetchFn?: FetchFn },
): Promise<VideoconferenceConfResult> {
  const url = buildApiUrl(config, "videoconference", "conf_fetch", appToken, { userToken: opts.user_token || "" });
  const body: AnyDict = { orgId: _orgId(opts.org_id) };
  if (opts.meeting_number) body.meetingNumber = opts.meeting_number;
  if (opts.operator) body.operator = opts.operator;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new VideoconferenceConfResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new VideoconferenceConfResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new VideoconferenceConfResult({
    success: true, max_person: d.maxPerson, default_max_person: d.defaultMaxPerson,
    allowed_record_flag: d.allowedRecordFlag, force_passwd_flag: d.forcePasswdFlag,
    space_size: d.spaceSize, raw_response: data!,
  });
}
