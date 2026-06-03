import { LansengerConfig } from "./config";
import { API_ENDPOINTS } from "./constants";

export interface BuildApiUrlOptions {
  userToken?: string;
  userId?: string;
  pathVars?: Record<string, string>;
}

export function buildApiUrl(
  config: LansengerConfig,
  category: string,
  endpoint: string,
  appToken: string,
  options?: BuildApiUrlOptions,
): string {
  const opts = options || {} as BuildApiUrlOptions;
  const pathTemplate = API_ENDPOINTS[category][endpoint];
  let apiPath = pathTemplate;

  const pathVars = opts.pathVars || {};
  for (const [varName, varValue] of Object.entries(pathVars)) {
    apiPath = apiPath.replace(`{${varName}}`, encodeURIComponent(varValue));
  }

  let url = `${config.api_gateway_url}${apiPath}?app_token=${encodeURIComponent(appToken)}`;
  if (opts.userToken) {
    url += `&user_token=${encodeURIComponent(opts.userToken)}`;
  }
  if (opts.userId) {
    url += `&user_id=${encodeURIComponent(opts.userId)}`;
  }
  return url;
}