import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, parseApiResponse, FetchFn } from "./http";
import {
  CalendarPrimaryResult, ScheduleCreateResult, ScheduleInfoResult,
  ScheduleUpdateResult, ScheduleListResult, ScheduleAttendeesResult,
  ScheduleAttendeeMetaResult,
} from "./models";

export async function fetchPrimaryCalendar(
  config: LansengerConfig,
  appToken: string,
  opts?: { user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<CalendarPrimaryResult> {
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "primary", appToken, { userToken, userId });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new CalendarPrimaryResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new CalendarPrimaryResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new CalendarPrimaryResult({
    success: true, calendar_id: d.calendarId, summary: d.summary,
    description: d.description, permissions: d.permissions, color: d.color,
    type: d.type, role: d.role, raw_response: data!,
  });
}

export async function createSchedule(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  summary: string,
  startTime: Record<string, any>,
  endTime: Record<string, any>,
  attendees: Record<string, string>[],
  opts?: {
    description?: string; all_day?: string; repeat_type?: string;
    rule?: string; expire_date_type?: string; reminder_type?: string;
    attendee_permissions?: string; user_token?: string; user_id?: string;
    fetchFn?: FetchFn;
  },
): Promise<ScheduleCreateResult> {
  if (!calendarId) return new ScheduleCreateResult({ success: false, error: "calendar_id is required" });
  if (!summary) return new ScheduleCreateResult({ success: false, error: "summary is required" });
  if (!startTime) return new ScheduleCreateResult({ success: false, error: "start_time is required" });
  if (!endTime) return new ScheduleCreateResult({ success: false, error: "end_time is required" });
  if (!attendees || !attendees.length) return new ScheduleCreateResult({ success: false, error: "attendees is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "schedule_create", appToken, { userToken, userId, pathVars: { calendar_id: calendarId } });
  const body: Record<string, any> = { summary, startTime, endTime, attendees };
  if (opts?.description) body.description = opts.description;
  if (opts?.all_day != null) body.allDay = opts.all_day;
  if (opts?.repeat_type != null) body.repeatType = opts.repeat_type;
  if (opts?.rule) body.rule = opts.rule;
  if (opts?.expire_date_type != null) body.expireDateType = opts.expire_date_type;
  if (opts?.reminder_type != null) body.reminderType = opts.reminder_type;
  if (opts?.attendee_permissions != null) body.attendeePermissions = opts.attendee_permissions;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleCreateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ScheduleCreateResult({ success: true, schedule_id: d.scheduleId, raw_response: data! });
}

export async function fetchSchedule(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  opts?: { user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<ScheduleInfoResult> {
  if (!calendarId) return new ScheduleInfoResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleInfoResult({ success: false, error: "schedule_id is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "schedule_fetch", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new ScheduleInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ScheduleInfoResult({
    success: true, schedule_id: d.scheduleId, summary: d.summary,
    description: d.description, repeat_type: d.repeatType, all_day: d.allDay,
    start_time: d.startTime, end_time: d.endTime, creator: d.creator,
    rsvp_status: d.rsvpStatus, raw_response: data!,
  });
}

export async function deleteSchedule(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  opts?: {
    reminder_type?: string; operation_type?: string; current_time?: number;
    user_token?: string; user_id?: string; fetchFn?: FetchFn;
  },
): Promise<ScheduleCreateResult> {
  if (!calendarId) return new ScheduleCreateResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleCreateResult({ success: false, error: "schedule_id is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const reminderType = opts?.reminder_type || "no";
  const operationType = opts?.operation_type || "delete_all";
  const currentTime = opts?.current_time || 0;
  const url = buildApiUrl(config, "calendars", "schedule_delete", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const body: Record<string, any> = { reminderType };
  if (operationType !== "delete_all") {
    body.operationType = operationType;
    body.currentTime = currentTime;
  }
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleCreateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  const sid = Array.isArray(d.scheduleIds) && d.scheduleIds.length > 0 ? d.scheduleIds[0] : scheduleId;
  return new ScheduleCreateResult({ success: true, schedule_id: sid, raw_response: data! });
}

export async function updateSchedule(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  opts?: {
    summary?: string; description?: string; operation_type?: string;
    current_time?: number; reminder_type?: string; repeat_type?: string;
    rule?: string; expire_date_type?: string; all_day?: string;
    attendee_permissions?: string; start_time?: Record<string, any>;
    end_time?: Record<string, any>; user_token?: string; user_id?: string;
    fetchFn?: FetchFn;
  },
): Promise<ScheduleUpdateResult> {
  if (!calendarId) return new ScheduleUpdateResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleUpdateResult({ success: false, error: "schedule_id is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "schedule_update", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const body: Record<string, any> = {};
  if (opts?.summary != null) body.summary = opts.summary;
  if (opts?.description != null) body.description = opts.description;
  const operationType = opts?.operation_type || "modify_all";
  if (operationType !== "modify_all") {
    body.operationType = operationType;
    if (opts?.current_time != null) body.currentTime = opts.current_time;
  }
  if (opts?.reminder_type != null) body.reminderType = opts.reminder_type;
  if (opts?.repeat_type != null) body.repeatType = opts.repeat_type;
  if (opts?.rule != null) body.rule = opts.rule;
  if (opts?.expire_date_type != null) body.expireDateType = opts.expire_date_type;
  if (opts?.all_day != null) body.allDay = opts.all_day;
  if (opts?.attendee_permissions != null) body.attendeePermissions = opts.attendee_permissions;
  if (opts?.start_time != null) body.startTime = opts.start_time;
  if (opts?.end_time != null) body.endTime = opts.end_time;
  if (!Object.keys(body).length) return new ScheduleUpdateResult({ success: false, error: "at least one field to update is required" });
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleUpdateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleUpdateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ScheduleUpdateResult({ success: true, schedule_ids: d.scheduleIds, raw_response: data! });
}

export async function fetchScheduleList(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  startTime: number,
  endTime: number,
  opts?: { user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<ScheduleListResult> {
  if (!calendarId) return new ScheduleListResult({ success: false, error: "calendar_id is required" });
  if (startTime == null || endTime == null) return new ScheduleListResult({ success: false, error: "start_time and end_time are required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "schedule_list", appToken, { userToken, userId, pathVars: { calendar_id: calendarId } });
  const body = { startTime, endTime };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ScheduleListResult({ success: true, schedule_list: d.scheduleList, raw_response: data! });
}

export async function fetchScheduleAttendees(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  opts?: { page?: number; page_size?: number; user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<ScheduleAttendeesResult> {
  if (!calendarId) return new ScheduleAttendeesResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleAttendeesResult({ success: false, error: "schedule_id is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const page = opts?.page || 1;
  const pageSize = opts?.page_size || 500;
  let url = buildApiUrl(config, "calendars", "attendees_fetch", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  url += `&page=${page}&page_size=${pageSize}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new ScheduleAttendeesResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleAttendeesResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ScheduleAttendeesResult({
    success: true, total: d.total || 0, attendees: d.attendees, raw_response: data!,
  });
}

export async function addScheduleAttendees(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  attendees: string[],
  opts?: { reminder_type?: string; user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<ScheduleCreateResult> {
  if (!calendarId) return new ScheduleCreateResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleCreateResult({ success: false, error: "schedule_id is required" });
  if (!attendees || !attendees.length) return new ScheduleCreateResult({ success: false, error: "attendees is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "attendees_create", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const body: Record<string, any> = { attendees };
  if (opts?.reminder_type != null) body.reminderType = opts.reminder_type;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleCreateResult({ success: false, error: apiErr });
  const d = data!.data || {};
  const sid = Array.isArray(d.scheduleIds) && d.scheduleIds.length > 0 ? d.scheduleIds[0] : scheduleId;
  return new ScheduleCreateResult({ success: true, schedule_id: sid, raw_response: data! });
}

export async function deleteScheduleAttendees(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  attendees: string[],
  opts?: { reminder_type?: string; user_token?: string; user_id?: string; fetchFn?: FetchFn },
): Promise<ScheduleCreateResult> {
  if (!calendarId) return new ScheduleCreateResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleCreateResult({ success: false, error: "schedule_id is required" });
  if (!attendees || !attendees.length) return new ScheduleCreateResult({ success: false, error: "attendees is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "attendees_delete", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const body: Record<string, any> = { attendees };
  if (opts?.reminder_type != null) body.reminderType = opts.reminder_type;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleCreateResult({ success: false, error: apiErr });
  return new ScheduleCreateResult({ success: true, schedule_id: scheduleId, raw_response: data! });
}

export async function updateScheduleAttendeeMeta(
  config: LansengerConfig,
  appToken: string,
  calendarId: string,
  scheduleId: string,
  opts?: {
    rsvp_status?: string; color?: string; permissions?: string;
    busy_free_state?: string; remind_times?: number[];
    user_token?: string; user_id?: string; fetchFn?: FetchFn;
  },
): Promise<ScheduleAttendeeMetaResult> {
  if (!calendarId) return new ScheduleAttendeeMetaResult({ success: false, error: "calendar_id is required" });
  if (!scheduleId) return new ScheduleAttendeeMetaResult({ success: false, error: "schedule_id is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const url = buildApiUrl(config, "calendars", "attendees_meta_update", appToken, { userToken, userId, pathVars: { calendar_id: calendarId, schedule_id: scheduleId } });
  const body: Record<string, any> = {};
  if (opts?.rsvp_status != null) body.rsvpStatus = opts.rsvp_status;
  if (opts?.color != null) body.color = opts.color;
  if (opts?.permissions != null) body.permissions = opts.permissions;
  if (opts?.busy_free_state != null) body.busyFreeState = opts.busy_free_state;
  if (opts?.remind_times != null) body.remindTimes = opts.remind_times;
  if (!Object.keys(body).length) return new ScheduleAttendeeMetaResult({ success: false, error: "at least one field to update is required" });
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new ScheduleAttendeeMetaResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ScheduleAttendeeMetaResult({ success: false, error: apiErr });
  return new ScheduleAttendeeMetaResult({ success: true, raw_response: data! });
}