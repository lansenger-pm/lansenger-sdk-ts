import { LansengerConfig } from "./config";
import { API_ENDPOINTS, OAUTH2_SCOPE_BASIC_USER_INFO } from "./constants";
import { buildApiUrl } from "./urlHelpers";
import { doGet, parseApiResponse, FetchFn } from "./http";
import { UserTokenResult } from "./models";
import { LansengerConfigError } from "./exceptions";
import { randomUUID } from "crypto";

export function buildAuthorizeUrl(
  config: LansengerConfig,
  redirectUri?: string,
  opts?: { scope?: string | string[]; state?: string },
): string {
  if (!config.passport_url) {
    throw new LansengerConfigError(
      "passport_url is required for OAuth2 flows. " +
      "Set LANSENGER_PASSPORT_URL env var or pass passport_url in config."
    );
  }
  const resolvedRedirectUri = redirectUri || config.redirect_uri;
  if (!resolvedRedirectUri) {
    throw new LansengerConfigError(
      "redirect_uri is required for OAuth2 authorize URL. " +
      "Set LANSENGER_REDIRECT_URI env var, pass redirect_uri in config, or pass it directly."
    );
  }
  const state = opts?.state || randomUUID().replace(/-/g, "");
  let scopeStr: string;
  if (opts?.scope == null) scopeStr = OAUTH2_SCOPE_BASIC_USER_INFO;
  else if (Array.isArray(opts.scope)) scopeStr = opts.scope.join(",");
  else scopeStr = opts.scope;
  const params = new URLSearchParams({
    appid: config.app_id, response_type: "code", scope: scopeStr,
    state, redirect_uri: resolvedRedirectUri,
  });
  const baseUrl = config.passport_url.replace(/\/+$/, "") + API_ENDPOINTS.oauth2.authorize;
  return `${baseUrl}?${params.toString()}`;
}

export async function exchangeCodeForUserToken(
  config: LansengerConfig,
  appToken: string,
  code: string,
  opts?: { redirect_uri?: string; fetchFn?: FetchFn },
): Promise<UserTokenResult> {
  if (!code) return new UserTokenResult({ success: false, error: "code is required" });
  if (!appToken) return new UserTokenResult({ success: false, error: "app_token is required" });
  let url = buildApiUrl(config, "oauth2", "user_token_create", appToken)
    + `&grant_type=authorization_code&code=${encodeURIComponent(code)}`;
  if (opts?.redirect_uri) url += `&redirect_uri=${encodeURIComponent(opts.redirect_uri)}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new UserTokenResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new UserTokenResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new UserTokenResult({
    success: true, user_token: d.userToken, expires_in: d.expiresIn || 7200,
    refresh_token: d.refreshToken, refresh_expires_in: d.refreshExpiresIn || 2592000,
    staff_id: d.staffId, scope: d.scope, state: d.state, raw_response: data!,
  });
}

export async function refreshUserToken(
  config: LansengerConfig,
  appToken: string,
  refreshToken: string,
  opts?: { scope?: string; fetchFn?: FetchFn },
): Promise<UserTokenResult> {
  if (!refreshToken) return new UserTokenResult({ success: false, error: "refresh_token is required" });
  if (!appToken) return new UserTokenResult({ success: false, error: "app_token is required" });
  let url = buildApiUrl(config, "oauth2", "refresh_token_create", appToken)
    + `&grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
  if (opts?.scope) url += `&scope=${encodeURIComponent(opts.scope)}`;
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new UserTokenResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new UserTokenResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new UserTokenResult({
    success: true, user_token: d.userToken, expires_in: d.expiresIn || 7200,
    refresh_token: d.refreshToken, refresh_expires_in: d.refreshExpiresIn || 2592000,
    staff_id: d.staffId, scope: d.scope, state: d.state, raw_response: data!,
  });
}

export function parseAuthorizeCallback(queryString: string | Record<string, string>): Record<string, string> {
  let params: Record<string, string>;
  if (typeof queryString === "object") params = queryString;
  else {
    params = {};
    for (const part of queryString.replace(/^\?/, "").split("&")) {
      if (part.includes("=")) {
        const eqIdx = part.indexOf("=");
        const key = part.substring(0, eqIdx);
        const value = part.substring(eqIdx + 1);
        params[key] = value || "";
      }
    }
  }
  const result: Record<string, string> = {
    code: params.code || "", state: params.state || "",
  };
  if (params.error) result.error = params.error;
  if (params.error_description) result.error_description = params.error_description;
  return result;
}

export function validateCallbackState(callbackState: string, expectedState: string): boolean {
  return callbackState === expectedState;
}