import { LansengerConfig } from "./config";
import { API_ENDPOINTS } from "./constants";
import { FetchFn } from "./http";
import { LansengerAuthError, LansengerNetworkError } from "./exceptions";
import { CredentialStore } from "./persistence";
import { buildApiUrl } from "./urlHelpers";

const TOKEN_REFRESH_MARGIN = 300;
const USER_TOKEN_REFRESH_MARGIN = 300;

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

export class UserTokenManager {
  private config: LansengerConfig;
  private fetchFn: FetchFn;
  private appTokenManager: TokenManager;
  private store: CredentialStore | null;
  private userToken: string | null = null;
  private refreshToken: string | null = null;
  private userTokenExpiry: number = 0;
  private staffId: string | null = null;

  constructor(
    config: LansengerConfig,
    fetchFn: FetchFn,
    appTokenManager: TokenManager,
    store?: CredentialStore | null,
  ) {
    this.config = config;
    this.fetchFn = fetchFn;
    this.appTokenManager = appTokenManager;
    this.store = store || null;

    if (this.store) {
      const cached = this.store.loadUserToken();
      const ut = cached.user_token || "";
      const rt = cached.refresh_token || "";
      const expiry = cached.user_token_expiry || 0;
      if (ut && expiry > Date.now() / 1000) {
        this.userToken = ut;
        this.refreshToken = rt;
        this.userTokenExpiry = expiry;
      }
    }
  }

  async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.userToken && now < this.userTokenExpiry) {
      return this.userToken;
    }

    if (!this.refreshToken) {
      throw new LansengerAuthError(
        "No userToken available and no refreshToken for auto-refresh. " +
        "Run OAuth2 authorize flow: build_authorize_url → exchange_code."
      );
    }

    const appToken = await this.appTokenManager.getToken();
    let url = buildApiUrl(this.config, "oauth2", "refresh_token_create", appToken)
      + `&grant_type=refresh_token&refresh_token=${encodeURIComponent(this.refreshToken)}`;

    try {
      const response = await this.fetchFn(url);
      if (!response.ok) {
        throw new LansengerNetworkError(`userToken refresh failed: HTTP ${response.status}`);
      }
      const data = await response.json() as Record<string, any>;
      const errCode = data.errCode ?? -1;
      if (errCode !== 0) {
        const msg = data.errMsg || "Unknown refresh error";
        throw new LansengerAuthError(`userToken refresh error (errCode=${errCode}): ${msg}`, errCode);
      }

      const tokenData = data.data || {};
      this.userToken = tokenData.userToken;
      const expiresIn = tokenData.expiresIn || 7200;
      this.refreshToken = tokenData.refreshToken;
      this.staffId = tokenData.staffId;
      this.userTokenExpiry = Math.floor(Date.now() / 1000) + expiresIn - USER_TOKEN_REFRESH_MARGIN;

      if (!this.userToken) {
        throw new LansengerAuthError("Refresh response missing userToken field");
      }

      if (this.store) {
        this.store.saveUserToken(this.userToken, this.refreshToken || "", expiresIn);
      }

      return this.userToken;
    } catch (e) {
      if (e instanceof LansengerAuthError || e instanceof LansengerNetworkError) throw e;
      throw new LansengerNetworkError(`userToken refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  setTokens(userToken: string, refreshToken: string, expiresIn: number = 7200, staffId: string = ""): void {
    this.userToken = userToken;
    this.refreshToken = refreshToken;
    this.userTokenExpiry = Math.floor(Date.now() / 1000) + expiresIn - USER_TOKEN_REFRESH_MARGIN;
    if (staffId) this.staffId = staffId;

    if (this.store) {
      this.store.saveUserToken(userToken, refreshToken, expiresIn);
    }
  }

  get staff_id(): string | null {
    return this.staffId;
  }

  get refresh_token(): string | null {
    return this.refreshToken;
  }

  invalidate(): void {
    this.userToken = null;
    this.userTokenExpiry = 0;
  }
}