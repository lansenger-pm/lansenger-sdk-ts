import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, parseApiResponse, FetchFn } from "./http";
import {
  DepartmentDetailResult,
  DepartmentChildrenResult,
  DepartmentStaffsResult,
} from "./models";

export async function fetchDepartmentDetail(
  config: LansengerConfig,
  appToken: string,
  departmentId: string,
  opts?: { user_token?: string; tag_id?: string; fetchFn?: FetchFn },
): Promise<DepartmentDetailResult> {
  if (!departmentId) return new DepartmentDetailResult({ success: false, error: "department_id is required" });
  const userToken = opts?.user_token || "";
  const tagId = opts?.tag_id || "";
  let url = buildApiUrl(config, "departments", "fetch", appToken, { userToken, pathVars: { department_id: departmentId } });
  if (tagId) url += `&tag_id=${encodeURIComponent(tagId)}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new DepartmentDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new DepartmentDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new DepartmentDetailResult({
    success: true, id: d.id, name: d.name, external_id: d.externalId,
    parent_id: d.parentId, order: d.order, has_children: d.hasChildren,
    normal_members: d.normalMembers, inactive_members: d.inactiveMembers,
    frozen_members: d.frozenMembers, deleted_members: d.deletedMembers,
    tags: d.tags, ancestor_departments: d.ancestorDepartments,
    leaders: d.leaders, emails: d.emails, phones: d.phones,
    addresses: d.addresses, introductions: d.introductions,
    dept_type: d.deptType, raw_response: data!,
  });
}

export async function fetchDepartmentChildren(
  config: LansengerConfig,
  appToken: string,
  departmentId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<DepartmentChildrenResult> {
  if (!departmentId) return new DepartmentChildrenResult({ success: false, error: "department_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "departments", "children_fetch", appToken, { userToken, pathVars: { department_id: departmentId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new DepartmentChildrenResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new DepartmentChildrenResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new DepartmentChildrenResult({ success: true, departments: d.departments, raw_response: data! });
}

export async function fetchDepartmentStaffs(
  config: LansengerConfig,
  appToken: string,
  departmentId: string,
  opts?: { user_token?: string; page?: number; page_size?: number; fetchFn?: FetchFn },
): Promise<DepartmentStaffsResult> {
  if (!departmentId) return new DepartmentStaffsResult({ success: false, error: "department_id is required" });
  const userToken = opts?.user_token || "";
  const page = opts?.page || 1;
  const pageSize = opts?.page_size || 100;
  const url = buildApiUrl(config, "departments", "staffs_fetch", appToken, { userToken, pathVars: { department_id: departmentId } })
    + `&page=${page}&page_size=${pageSize}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new DepartmentStaffsResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new DepartmentStaffsResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new DepartmentStaffsResult({
    success: true, has_more: d.hasMore || false, total: d.total || 0,
    staffs: d.staffs, raw_response: data!,
  });
}