import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, parseApiResponse, FetchFn } from "./http";
import { UserInfoResult } from "./models";

export async function fetchUserInfo(
  config: LansengerConfig,
  appToken: string,
  userToken: string,
  opts?: { fetchFn?: FetchFn },
): Promise<UserInfoResult> {
  if (!userToken) return new UserInfoResult({ success: false, error: "user_token is required" });
  if (!appToken) return new UserInfoResult({ success: false, error: "app_token is required" });
  const url = buildApiUrl(config, "users", "fetch", appToken, { userToken });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new UserInfoResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new UserInfoResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new UserInfoResult({
    success: true, staff_id: d.staffId, name: d.name,
    org_id: d.orgId, org_name: d.orgid || d.orgName || d.orgname,
    avatar_id: d.avatarId, avatar_url: d.avatarUrl,
    mobile_phone: d.mobilePhone, email: d.email,
    employee_number: d.employeeNumber, login_name: d.loginName,
    external_id: d.externalId, department: d.department,
    raw_response: data!,
  });
}