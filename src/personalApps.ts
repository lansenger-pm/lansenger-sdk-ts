import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, parseApiResponse, FetchFn } from "./http";
import { PersonalAppCreateResult, PersonalAppInfoResult, PersonalAppListResult } from "./models";

export async function createPersonalApp(
  config: LansengerConfig,
  appToken: string,
  opts: { user_token: string; name?: string; avatar_id?: string; description?: string; fetchFn?: FetchFn },
): Promise<PersonalAppCreateResult> {
  if (!opts.user_token) return new PersonalAppCreateResult({ success: false, error: "user_token is required" });

  const url = buildApiUrl(config, "personal_apps", "create", appToken, { userToken: opts.user_token });

  const body: Record<string, any> = {};
  if (opts.name) body.name = opts.name;
  if (opts.avatar_id) body.avatarId = opts.avatar_id;
  if (opts.description) body.description = opts.description;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalAppCreateResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new PersonalAppCreateResult({ success: false, error: apiErr });

  const d = data!.data || {};
  return new PersonalAppCreateResult({
    success: true,
    app_id: d.id ?? null,
    secret: d.secret ?? null,
    apigw_addr: d.apigwAddr ?? null,
    passport_addr: d.passportAddr ?? null,
    raw_response: data!,
  });
}

export async function updatePersonalApp(
  config: LansengerConfig,
  appToken: string,
  appId: string,
  opts: { user_token: string; name: string; avatar_id?: string; description?: string; fetchFn?: FetchFn },
): Promise<PersonalAppInfoResult> {
  if (!appId) return new PersonalAppInfoResult({ success: false, error: "app_id is required" });
  if (!opts.user_token) return new PersonalAppInfoResult({ success: false, error: "user_token is required" });
  if (!opts.name) return new PersonalAppInfoResult({ success: false, error: "name is required" });

  const url = buildApiUrl(config, "personal_apps", "update", appToken, {
    userToken: opts.user_token,
    pathVars: { app_id: appId },
  });

  const body: Record<string, any> = { name: opts.name };
  if (opts.avatar_id) body.avatarId = opts.avatar_id;
  if (opts.description) body.description = opts.description;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new PersonalAppInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new PersonalAppInfoResult({ success: false, error: apiErr });
  return new PersonalAppInfoResult({ success: true, app_id: appId, raw_response: data! });
}

export async function fetchPersonalApp(
  config: LansengerConfig,
  appToken: string,
  appId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<PersonalAppInfoResult> {
  if (!appId) return new PersonalAppInfoResult({ success: false, error: "app_id is required" });

  const url = buildApiUrl(config, "personal_apps", "fetch", appToken, {
    userToken: opts?.user_token || "",
    pathVars: { app_id: appId },
  });

  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new PersonalAppInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new PersonalAppInfoResult({ success: false, error: apiErr });

  const d = data!.data || {};
  return new PersonalAppInfoResult({
    success: true, app_id: appId,
    name: d.name ?? null, avatar_id: d.avatarId ?? null,
    description: d.description ?? null, apigw_addr: d.apigwAddr ?? null,
    passport_addr: d.passportAddr ?? null, raw_response: data!,
  });
}

export async function deletePersonalApp(
  config: LansengerConfig,
  appToken: string,
  appId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<PersonalAppInfoResult> {
  if (!appId) return new PersonalAppInfoResult({ success: false, error: "app_id is required" });

  const url = buildApiUrl(config, "personal_apps", "delete", appToken, {
    userToken: opts?.user_token || "",
    pathVars: { app_id: appId },
  });

  const [data, httpErr] = await doPost(url, {}, opts?.fetchFn);
  if (httpErr) return new PersonalAppInfoResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new PersonalAppInfoResult({ success: false, error: apiErr });
  return new PersonalAppInfoResult({ success: true, app_id: appId, raw_response: data! });
}

export async function fetchPersonalAppList(
  config: LansengerConfig,
  appToken: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<PersonalAppListResult> {
  if (!opts?.user_token) return new PersonalAppListResult({ success: false, error: "user_token is required" });

  const url = buildApiUrl(config, "personal_apps", "list_fetch", appToken, { userToken: opts.user_token });

  const [data, httpErr] = await doGet(url, opts.fetchFn);
  if (httpErr) return new PersonalAppListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new PersonalAppListResult({ success: false, error: apiErr });

  const d = data!.data || {};
  return new PersonalAppListResult({
    success: true,
    app_list: d.appList ?? null,
    raw_response: data!,
  });
}
