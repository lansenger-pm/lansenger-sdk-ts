import { LansengerConfig } from "./config";
import { API_ENDPOINTS } from "./constants";
import { FetchFn } from "./http";
import { LansengerAuthError, LansengerNetworkError } from "./exceptions";
import { CredentialStore } from "./persistence";

const TOKEN_REFRESH_MARGIN = 300;

export class TokenManager {
  private config: LansengerConfig;
  private fetchFn: FetchFn;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private store: CredentialStore | null;

  constructor(
    config: LansengerConfig,
    fetchFn: FetchFn,
    store?: CredentialStore | null,
  ) {
    this.config = config;
    this.fetchFn = fetchFn;
    this.store = store || null;

    if (this.store) {
      const cached = this.store.loadAppToken();
      if (cached) {
        this.token = cached;
        const state = this.store.load();
        this.tokenExpiry = state.app_token_expiry || 0;
      }
    }
  }

  async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    const url = `${this.config.api_gateway_url}${API_ENDPOINTS.app_token.create}`;
    const params = new URLSearchParams({
      grant_type: "client_credential",
      appid: this.config.app_id,
      secret: this.config.app_secret,
    });
    const fullUrl = `${url}?${params.toString()}`;

    try {
      const response = await this.fetchFn(fullUrl);
      if (!response.ok) {
        throw new LansengerNetworkError(`Token request failed: HTTP ${response.status}`);
      }
      const data = await response.json() as Record<string, any>;
      const errCode = data.errCode ?? -1;
      if (errCode !== 0) {
        const msg = data.errMsg || "Unknown token error";
        throw new LansengerAuthError(`Token error (errCode=${errCode}): ${msg}`, errCode);
      }

      const tokenData = data.data || {};
      this.token = tokenData.appToken;
      const expiresIn = tokenData.expiresIn || 7200;
      this.tokenExpiry = Math.floor(Date.now() / 1000) + expiresIn - TOKEN_REFRESH_MARGIN;

      if (!this.token) {
        throw new LansengerAuthError("Token response missing appToken field");
      }

      if (this.store) {
        this.store.saveAppToken(this.token, expiresIn, TOKEN_REFRESH_MARGIN);
      }

      return this.token;
    } catch (e) {
      if (e instanceof LansengerAuthError || e instanceof LansengerNetworkError) throw e;
      throw new LansengerNetworkError(`Token request failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  invalidate(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }
}