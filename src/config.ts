import { LansengerConfigError } from "./exceptions";

const DEFAULT_API_GATEWAY_URL = "https://open.e.lanxin.cn/open/apigw";

export class LansengerConfig {
  app_id: string;
  app_secret: string;
  api_gateway_url: string;
  passport_url: string;
  http_timeout: number;
  encoding_key: string;
  callback_token: string;
  redirect_uri: string;
  app_token: string;
  user_token: string;

  constructor(
    app_id: string,
    app_secret: string,
    api_gateway_url: string = DEFAULT_API_GATEWAY_URL,
    passport_url: string = "",
    http_timeout: number = 30.0,
    encoding_key: string = "",
    callback_token: string = "",
    redirect_uri: string = "",
    app_token: string = "",
    user_token: string = "",
  ) {
    this.app_id = app_id;
    this.app_secret = app_secret;
    this.api_gateway_url = api_gateway_url;
    this.passport_url = passport_url;
    this.http_timeout = http_timeout;
    this.encoding_key = encoding_key;
    this.callback_token = callback_token;
    this.redirect_uri = redirect_uri;
    this.app_token = app_token;
    this.user_token = user_token;
  }

  static create(
    app_id?: string,
    app_secret?: string,
    api_gateway_url?: string,
    passport_url?: string,
    http_timeout?: number,
    encoding_key?: string,
    callback_token?: string,
    redirect_uri?: string,
    app_token?: string,
    user_token?: string,
  ): LansengerConfig {
    const resolved_app_id = app_id || (process.env.LANSENGER_APP_ID || "").trim();
    const resolved_app_secret = app_secret || (process.env.LANSENGER_APP_SECRET || "").trim();
    const resolved_gateway = api_gateway_url || (process.env.LANSENGER_API_GATEWAY_URL || DEFAULT_API_GATEWAY_URL).trim();
    const resolved_passport = passport_url || (process.env.LANSENGER_PASSPORT_URL || "").trim();
    const resolved_timeout = http_timeout != null && http_timeout !== undefined ? http_timeout : 30.0;
    const resolved_encoding_key = encoding_key || (process.env.LANSENGER_ENCODING_KEY || "").trim();
    const resolved_callback_token = callback_token || (process.env.LANSENGER_CALLBACK_TOKEN || "").trim();
    const resolved_redirect_uri = redirect_uri || (process.env.LANSENGER_REDIRECT_URI || "").trim();
    const resolved_app_token = app_token || (process.env.LANSENGER_APP_TOKEN || "").trim();
    const resolved_user_token = user_token || (process.env.LANSENGER_USER_TOKEN || "").trim();

    // In external mode (app_token provided), app_id/app_secret are optional
    if (!resolved_app_token && (!resolved_app_id || !resolved_app_secret)) {
      throw new LansengerConfigError(
        "Lansenger credentials not configured. " +
        "Set LANSENGER_APP_ID and LANSENGER_APP_SECRET env vars, " +
        "or pass app_id/app_secret directly, " +
        "or provide LANSENGER_APP_TOKEN for external token mode.",
      );
    }

    return new LansengerConfig(
      resolved_app_id,
      resolved_app_secret,
      resolved_gateway,
      resolved_passport,
      resolved_timeout,
      resolved_encoding_key,
      resolved_callback_token,
      resolved_redirect_uri,
      resolved_app_token,
      resolved_user_token,
    );
  }

  static fromEnv(): LansengerConfig {
    return LansengerConfig.create();
  }

  isConfigured(): boolean {
    return Boolean(this.app_id && this.app_secret);
  }

  isExternalMode(): boolean {
    return Boolean(this.app_token);
  }

  hasPassportUrl(): boolean {
    return Boolean(this.passport_url);
  }
}