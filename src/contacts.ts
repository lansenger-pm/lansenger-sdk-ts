import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, parseApiResponse, FetchFn } from "./http";
import {
  StaffBasicInfoResult,
  StaffDetailResult,
  DepartmentAncestorsResult,
  StaffIdMappingResult,
  ExtraFieldIdsResult,
  StaffSearchResult,
  OrgInfoResult,
} from "./models";

export async function fetchStaffBasicInfo(
  config: LansengerConfig,
  appToken: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<StaffBasicInfoResult> {
  if (!staffId) return new StaffBasicInfoResult({ success: false, error: "staff_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "staffs", "fetch", appToken, { userToken, pathVars: { staff_id: staffId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new StaffBasicInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StaffBasicInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StaffBasicInfoResult({
    success: true, org_id: d.orgId, org_name: d.orgName, name: d.name,
    gender: d.gender, signature: d.signature, avatar_url: d.avatarUrl,
    avatar_id: d.avatarId, status: d.status, departments: d.departments,
    raw_response: data!,
  });
}

export async function fetchStaffDetail(
  config: LansengerConfig,
  appToken: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<StaffDetailResult> {
  if (!staffId) return new StaffDetailResult({ success: false, error: "staff_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "staffs", "detail_fetch", appToken, { userToken, pathVars: { staff_id: staffId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new StaffDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StaffDetailResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StaffDetailResult({
    success: true, name: d.name, signature: d.signature, avatar_id: d.avatarId,
    avatar_url: d.avatarUrl, status: d.status, departments: d.departments,
    gender: d.gender, org_id: d.orgId, org_name: d.orgName,
    login_name: d.loginName, employee_number: d.employeeNumber, email: d.email,
    external_id: d.externalId, nationality: d.nationality, birthdate: d.birthdate,
    id_number: d.idNumber, native_place: d.nativePlace, duties: d.duties,
    parties: d.parties, address: d.address, mobile_phone: d.mobilePhone,
    extra_phones: d.extraPhones, introduction: d.introduction,
    education: d.education, career: d.career, login_ways: d.loginWays,
    tags: d.tags, extra_field_set: d.extraFieldSet, leaders: d.leaders,
    join_date: d.joinDate, raw_response: data!,
  });
}

export async function fetchDepartmentAncestors(
  config: LansengerConfig,
  appToken: string,
  staffId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<DepartmentAncestorsResult> {
  if (!staffId) return new DepartmentAncestorsResult({ success: false, error: "staff_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "staffs", "department_ancestors", appToken, { userToken, pathVars: { staff_id: staffId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new DepartmentAncestorsResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new DepartmentAncestorsResult({ success: false, error: apiErr });
  const resultData = data!.data || [];
  const ancestorGroups: Record<string, string>[][] = [];
  for (const entry of resultData) {
    ancestorGroups.push(entry.ancestorDepartments || []);
  }
  return new DepartmentAncestorsResult({ success: true, ancestor_groups: ancestorGroups, raw_response: data! });
}

export async function fetchStaffIdMapping(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  idType: string,
  idValue: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<StaffIdMappingResult> {
  if (!orgId) return new StaffIdMappingResult({ success: false, error: "org_id is required" });
  if (!idType) return new StaffIdMappingResult({ success: false, error: "id_type is required" });
  if (!idValue) return new StaffIdMappingResult({ success: false, error: "id_value is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "staffs", "id_mapping", appToken, { userToken })
    + `&org_id=${encodeURIComponent(orgId)}&id_type=${encodeURIComponent(idType)}&id_value=${encodeURIComponent(idValue)}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new StaffIdMappingResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StaffIdMappingResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StaffIdMappingResult({ success: true, staff_id: d.staffId, raw_response: data! });
}

export async function fetchOrgExtraFieldIds(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  opts?: { user_token?: string; page?: number; page_size?: number; fetchFn?: FetchFn },
): Promise<ExtraFieldIdsResult> {
  if (!orgId) return new ExtraFieldIdsResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const page = opts?.page || 1;
  const pageSize = opts?.page_size || 1000;
  const url = buildApiUrl(config, "org", "extra_field_ids", appToken, { userToken, pathVars: { org_id: orgId } })
    + `&page=${page}&page_size=${pageSize}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new ExtraFieldIdsResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new ExtraFieldIdsResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new ExtraFieldIdsResult({
    success: true, has_more: d.hasMore || false, total: d.total || 0,
    extra_field_ids: d.extraFieldIds, raw_response: data!,
  });
}

export async function searchStaff(
  config: LansengerConfig,
  appToken: string,
  keyword: string,
  opts?: { user_token?: string; user_id?: string; recursive?: boolean; sector_ids?: string[]; page?: number; page_size?: number; fetchFn?: FetchFn },
): Promise<StaffSearchResult> {
  if (!keyword) return new StaffSearchResult({ success: false, error: "keyword is required" });
  const userToken = opts?.user_token || "";
  const userId = opts?.user_id || "";
  const recursive = opts?.recursive ?? true;
  const sectorIds = opts?.sector_ids;
  const page = opts?.page;
  const pageSize = opts?.page_size;
  let url = buildApiUrl(config, "staffs", "search", appToken, { userToken, userId });
  if (page != null && pageSize != null) url += `&page=${page}&page_size=${pageSize}`;
  const body: Record<string, any> = { keyword, recursive };
  if (sectorIds) body.searchScope = { sectorIds };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new StaffSearchResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StaffSearchResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StaffSearchResult({
    success: true, has_more: d.hasMore || false, total: d.total || 0,
    staff_info: d.staffInfo, raw_response: data!,
  });
}

export async function fetchOrgInfo(
  config: LansengerConfig,
  appToken: string,
  orgId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<OrgInfoResult> {
  if (!orgId) return new OrgInfoResult({ success: false, error: "org_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "org", "fetch", appToken, { userToken, pathVars: { org_id: orgId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new OrgInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new OrgInfoResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new OrgInfoResult({
    success: true, org_id: d.orgId, org_name: d.orgName, icon_url: d.iconUrl,
    org_max_member_limit: d.orgMaxMemberLimit, org_order_type: d.orgOrderType,
    org_days_limit: d.orgDaysLimit, org_billing_date: d.orgBillingDate,
    raw_response: data!,
  });
}