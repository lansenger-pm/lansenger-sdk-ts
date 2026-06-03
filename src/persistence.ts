import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEFAULT_STATE_DIR = path.join(os.homedir(), ".lansenger");
const DEFAULT_STATE_FILE = "sdk_state.json";
const DEFAULT_PROFILE = "default";

const LEGACY_KEYS = new Set([
  "app_id", "app_secret", "api_gateway_url", "passport_url",
  "encoding_key", "callback_token",
  "app_token", "app_token_expiry", "user_token", "refresh_token",
  "user_token_expiry",
]);

export class CredentialStore {
  private filePath: string;
  private profile: string;

  constructor(filePath?: string, profile: string = DEFAULT_PROFILE) {
    this.filePath = filePath || path.join(DEFAULT_STATE_DIR, DEFAULT_STATE_FILE);
    this.profile = profile;
  }

  get path(): string {
    return this.filePath;
  }

  get currentProfile(): string {
    return this.profile;
  }

  private migrateLegacy(state: Record<string, any>): Record<string, any> {
    if ("profiles" in state) return state;
    const legacyData: Record<string, any> = {};
    for (const [k, v] of Object.entries(state)) {
      if (LEGACY_KEYS.has(k)) legacyData[k] = v;
    }
    if (!legacyData.app_id) return state;
    const newState = {
      profiles: { [DEFAULT_PROFILE]: legacyData },
      active_profile: DEFAULT_PROFILE,
    };
    this.save(newState);
    return newState;
  }

  load(): Record<string, any> {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(raw);
      return this.migrateLegacy(data);
    } catch (e) {
      return {};
    }
  }

  save(state: Record<string, any>): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf-8");
    try {
      fs.chmodSync(this.filePath, 0o600);
    } catch {}
  }

  private getProfileData(state: Record<string, any>): Record<string, any> {
    const profiles = state.profiles || {};
    return profiles[this.profile] || {};
  }

  private setProfileData(state: Record<string, any>, data: Record<string, any>): Record<string, any> {
    if (!state.profiles) state.profiles = {};
    state.profiles[this.profile] = data;
    if (!state.active_profile) state.active_profile = DEFAULT_PROFILE;
    return state;
  }

  loadCredentials(): Record<string, string> {
    const data = this.getProfileData(this.load());
    return {
      app_id: data.app_id || "",
      app_secret: data.app_secret || "",
      api_gateway_url: data.api_gateway_url || "",
      passport_url: data.passport_url || "",
      encoding_key: data.encoding_key || "",
      callback_token: data.callback_token || "",
    };
  }

  saveCredentials(
    appId: string,
    appSecret: string,
    apiGatewayUrl: string = "",
    passportUrl: string = "",
    encodingKey: string = "",
    callbackToken: string = "",
  ): void {
    const state = this.load();
    const data = this.getProfileData(state);
    data.app_id = appId;
    data.app_secret = appSecret;
    if (apiGatewayUrl) data.api_gateway_url = apiGatewayUrl;
    if (passportUrl) data.passport_url = passportUrl;
    data.encoding_key = encodingKey;
    data.callback_token = callbackToken;
    this.save(this.setProfileData(state, data));
  }

  saveCallbackConfig(encodingKey: string, callbackToken: string = ""): void {
    const state = this.load();
    const data = this.getProfileData(state);
    data.encoding_key = encodingKey;
    data.callback_token = callbackToken;
    this.save(this.setProfileData(state, data));
  }

  loadAppToken(): string | null {
    const data = this.getProfileData(this.load());
    const token = data.app_token;
    const expiry = data.app_token_expiry || 0;
    if (token && expiry > Date.now() / 1000) return token;
    return null;
  }

  saveAppToken(token: string, expiresIn: number = 7200, margin: number = 300): void {
    const state = this.load();
    const data = this.getProfileData(state);
    data.app_token = token;
    data.app_token_expiry = Date.now() / 1000 + expiresIn - margin;
    this.save(this.setProfileData(state, data));
  }

  loadUserToken(): Record<string, any> {
    const data = this.getProfileData(this.load());
    return {
      user_token: data.user_token || "",
      refresh_token: data.refresh_token || "",
      user_token_expiry: data.user_token_expiry || 0,
    };
  }

  saveUserToken(userToken: string, refreshToken: string = "", expiresIn: number = 0): void {
    const state = this.load();
    const data = this.getProfileData(state);
    data.user_token = userToken;
    data.refresh_token = refreshToken;
    if (expiresIn) data.user_token_expiry = Date.now() / 1000 + expiresIn;
    this.save(this.setProfileData(state, data));
  }

  clearProfile(): void {
    const state = this.load();
    const profiles = state.profiles || {};
    if (this.profile in profiles) {
      delete profiles[this.profile];
      this.save(state);
    }
  }

  clear(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }

  listProfiles(): string[] {
    const state = this.load();
    return Object.keys(state.profiles || {});
  }

  getActiveProfile(): string {
    const state = this.load();
    return state.active_profile || DEFAULT_PROFILE;
  }

  setActiveProfile(profile: string): void {
    const state = this.load();
    state.active_profile = profile;
    this.save(state);
  }

  hasCredentials(): boolean {
    const creds = this.loadCredentials();
    return !!creds.app_id && !!creds.app_secret;
  }

  hasFullConfig(): boolean {
    const creds = this.loadCredentials();
    return !!creds.app_id && !!creds.app_secret && !!creds.api_gateway_url;
  }
}