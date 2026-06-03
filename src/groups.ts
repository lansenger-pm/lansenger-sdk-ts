import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, parseApiResponse, FetchFn } from "./http";
import {
  CreateGroupResult, GroupInfoResult, GroupMemberResult,
  GroupListResult, IsInGroupResult, UpdateGroupResult, UpdateGroupMembersResult,
} from "./models";

export async function createGroup(
  config: LansengerConfig,
  appToken: string,
  name: string,
  orgId: string,
  opts?: {
    owner_id?: string; description?: string; avatar_id?: string;
    staff_id_list?: string[]; department_id_list?: string[];
    user_token?: string; apply_request_id?: string; apply_notes?: string;
    apply_global_unique_id?: string; apply_session_unique_id?: string;
    fetchFn?: FetchFn;
  },
): Promise<CreateGroupResult> {
  if (!name) return new CreateGroupResult({ success: false, error: "name is required" });
  if (!orgId) return new CreateGroupResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "groups_v2", "create", appToken, { userToken });
  const body: Record<string, any> = { name, orgId };
  if (opts?.owner_id) body.ownerId = opts.owner_id;
  if (opts?.description) body.description = opts.description;
  if (opts?.avatar_id) body.avatarId = opts.avatar_id;
  if (opts?.staff_id_list) body.staffIdList = opts.staff_id_list;
  if (opts?.department_id_list) body.departmentIdList = opts.department_id_list;
  if (opts?.apply_request_id) body.applyRequestId = opts.apply_request_id;
  if (opts?.apply_notes) body.applyNotes = opts.apply_notes;
  if (opts?.apply_global_unique_id) body.applyGlobalUniqueId = opts.apply_global_unique_id;
  if (opts?.apply_session_unique_id) body.applySessionUniqueId = opts.apply_session_unique_id;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new CreateGroupResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new CreateGroupResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new CreateGroupResult({
    success: true, group_id: d.groupId, total_members: d.totalMembers || 0,
    invalid_staff: d.invalidStaff, invalid_department: d.invalidDepartment,
    raw_response: data!,
  });
}

export async function fetchGroupInfo(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<GroupInfoResult> {
  if (!groupId) return new GroupInfoResult({ success: false, error: "group_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "groups_v2", "info_fetch", appToken, { userToken, pathVars: { group_id: groupId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new GroupInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new GroupInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new GroupInfoResult({
    success: true, name: d.name, description: d.description,
    avatar_id: d.avatarId, avatar_url: d.avatarUrl, owner: d.owner,
    creator: d.creator, state: d.state, manage_mode: d.manageMode,
    location_share: d.locationShare, needs_confirm: d.needsConfirm,
    is_public: d.isPublic, max_members: d.maxMembers,
    max_history_msg_count: d.maxHistoryMsgCount,
    total_members: d.totalMembers, remind_all: d.remindAll,
    send_msg_status: d.sendMsgStatus, raw_response: data!,
  });
}

export async function fetchGroupMembers(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: { user_token?: string; page_offset?: number; page_size?: number; fetchFn?: FetchFn },
): Promise<GroupMemberResult> {
  if (!groupId) return new GroupMemberResult({ success: false, error: "group_id is required" });
  const userToken = opts?.user_token || "";
  const pageOffset = opts?.page_offset || 0;
  const pageSize = opts?.page_size || 100;
  const url = buildApiUrl(config, "groups_v2", "members_fetch", appToken, { userToken, pathVars: { group_id: groupId } })
    + `&page_offset=${pageOffset}&page_size=${pageSize}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new GroupMemberResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new GroupMemberResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new GroupMemberResult({
    success: true, total_members: d.totalMembers || 0,
    members: d.members, raw_response: data!,
  });
}

export async function fetchGroupList(
  config: LansengerConfig,
  appToken: string,
  opts?: { user_token?: string; page_offset?: number; page_size?: number; fetchFn?: FetchFn },
): Promise<GroupListResult> {
  const userToken = opts?.user_token || "";
  const pageOffset = opts?.page_offset || 0;
  const pageSize = opts?.page_size || 100;
  const url = buildApiUrl(config, "groups_v2", "groups_fetch", appToken, { userToken })
    + `&page_offset=${pageOffset}&page_size=${pageSize}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new GroupListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new GroupListResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new GroupListResult({
    success: true, total_group_ids: d.totalGroupIds || 0,
    group_ids: d.groupIds, raw_response: data!,
  });
}

export async function checkIsInGroup(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: { user_token?: string; staff_id?: string; fetchFn?: FetchFn },
): Promise<IsInGroupResult> {
  if (!groupId) return new IsInGroupResult({ success: false, error: "group_id is required" });
  const userToken = opts?.user_token || "";
  let url = buildApiUrl(config, "groups_v2", "is_in_group", appToken, { userToken, pathVars: { group_id: groupId } });
  if (opts?.staff_id) url += `&staff_id=${encodeURIComponent(opts.staff_id)}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new IsInGroupResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new IsInGroupResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new IsInGroupResult({
    success: true, is_in_group: d.isInGroup || false, raw_response: data!,
  });
}

export async function updateGroupInfo(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: {
    name?: string; description?: string; avatar_id?: string; owner_id?: string;
    assistant?: string[]; demote_assistant?: string[]; manage_mode?: number;
    location_share?: boolean; needs_confirm?: boolean; is_public?: boolean;
    max_members?: number; max_history_msg_count?: number;
    remind_all?: boolean; send_msg_status?: boolean;
    user_token?: string; fetchFn?: FetchFn;
  },
): Promise<UpdateGroupResult> {
  if (!groupId) return new UpdateGroupResult({ success: false, error: "group_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "groups_v2", "info_update", appToken, { userToken, pathVars: { group_id: groupId } });
  const body: Record<string, any> = {};
  if (opts?.name) body.name = opts.name;
  if (opts?.description) body.description = opts.description;
  if (opts?.avatar_id) body.avatarId = opts.avatar_id;
  if (opts?.owner_id) body.ownerId = opts.owner_id;
  if (opts?.assistant) body.assistant = opts.assistant;
  if (opts?.demote_assistant) body.demoteAssistant = opts.demote_assistant;
  if (opts?.manage_mode != null) body.manageMode = opts.manage_mode;
  if (opts?.location_share != null) body.locationShare = opts.location_share;
  if (opts?.needs_confirm != null) body.needsConfirm = opts.needs_confirm;
  if (opts?.is_public != null) body.isPublic = opts.is_public;
  if (opts?.max_members != null) body.maxMembers = opts.max_members;
  if (opts?.max_history_msg_count != null) body.maxHistoryMsgCount = opts.max_history_msg_count;
  if (opts?.remind_all != null) body.remindAll = opts.remind_all;
  if (opts?.send_msg_status != null) body.sendMsgStatus = opts.send_msg_status;
  if (!Object.keys(body).length) return new UpdateGroupResult({ success: false, error: "at least one field to update is required" });
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new UpdateGroupResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new UpdateGroupResult({ success: false, error: apiErr });
  return new UpdateGroupResult({ success: true, raw_response: data! });
}

export async function updateGroupMembers(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: {
    add_user_list?: string[]; del_user_list?: string[];
    add_department_id_list?: string[]; user_token?: string; fetchFn?: FetchFn;
  },
): Promise<UpdateGroupMembersResult> {
  if (!groupId) return new UpdateGroupMembersResult({ success: false, error: "group_id is required" });
  if (!opts?.add_user_list && !opts?.del_user_list && !opts?.add_department_id_list)
    return new UpdateGroupMembersResult({ success: false, error: "at least one of add_user_list, del_user_list, or add_department_id_list is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "groups_v2", "members_update", appToken, { userToken, pathVars: { group_id: groupId } });
  const body: Record<string, any> = {};
  if (opts?.add_user_list) body.addUserList = opts.add_user_list;
  if (opts?.del_user_list) body.delUserList = opts.del_user_list;
  if (opts?.add_department_id_list) body.addDepartmentIdList = opts.add_department_id_list;
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new UpdateGroupMembersResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new UpdateGroupMembersResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new UpdateGroupMembersResult({
    success: true, total_members: d.totalMembers || 0,
    added_staff_count: d.addedStaffCount || 0,
    deleted_staff_count: d.deletedStaffCount || 0,
    invalid_staff: d.invalidStaff, invalid_department: d.invalidDepartment,
    raw_response: data!,
  });
}

export async function dismissGroup(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<UpdateGroupResult> {
  if (!groupId) return new UpdateGroupResult({ success: false, error: "group_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "groups_v2", "delete", appToken, { userToken, pathVars: { group_id: groupId } });
  const [data, httpErr] = await doPost(url, {}, opts?.fetchFn);
  if (httpErr) return new UpdateGroupResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new UpdateGroupResult({ success: false, error: apiErr });
  return new UpdateGroupResult({ success: true, raw_response: data! });
}