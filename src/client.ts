import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  sendAccountMessage,
} from "./accountMessages";
import {
  TokenManager,
  UserTokenManager,
} from "./auth";
import {
  createBotCommands,
  deleteBotCommands,
  fetchBotCommands,
} from "./botCommands";
import {
  addScheduleAttendees,
  createSchedule,
  deleteSchedule,
  deleteScheduleAttendees,
  fetchPrimaryCalendar,
  fetchSchedule,
  fetchScheduleAttendees,
  fetchScheduleList,
  updateSchedule,
  updateScheduleAttendeeMeta,
  updateScheduleAttendees,
} from "./calendars";
import {
  CallbackEvent,
  getCallbackEventTypes,
  parseCallbackPayload,
  verifyCallbackSignature,
} from "./callbacks";
import {
  fetchChatList,
  fetchChatMessages,
} from "./chats";
import {
  LansengerConfig,
} from "./config";
import {
  APP_MEDIA_TYPE_FILE,
  APP_MEDIA_TYPE_IMAGE,
  APP_MEDIA_TYPE_VIDEO,
  APP_TO_MSG_MEDIA_TYPE,
  MEDIA_TYPE_AUDIO,
  guessAppMediaType,
  guessMediaType,
} from "./constants";
import {
  fetchDepartmentAncestors,
  fetchOrgExtraFieldIds,
  fetchOrgInfo,
  fetchStaffBasicInfo,
  fetchStaffDetail,
  fetchStaffIdMapping,
  searchStaff,
} from "./contacts";
import {
  isSDKDebug,
} from "./debug";
import {
  fetchDepartmentChildren,
  fetchDepartmentDetail,
  fetchDepartmentStaffs,
} from "./departments";
import {
  LansengerAPIError,
  LansengerAuthError,
  LansengerConfigError,
  LansengerFileError,
  LansengerNetworkError,
} from "./exceptions";
import {
  sendGroupMessage,
} from "./groupMessages";
import {
  checkIsInGroup,
  createGroup,
  dismissGroup,
  fetchGroupInfo,
  fetchGroupList,
  fetchGroupMembers,
  updateGroupInfo,
  updateGroupMembers,
} from "./groups";
import { errCodeOf, FetchFn, doGet, doPost } from "./http";
import {
  downloadMedia,
  downloadMediaByShareId,
  downloadMediaToFile,
  downloadMediaToFileResult,
  fetchMediaPath,
  uploadAppMedia,
  uploadAppMediaV2,
  uploadMedia,
} from "./media";
import {
  AccountMessageResult,
  AppCardParams,
  ApproveCardParams,
  ApproveCardUpdateParams,
  BotCommandQueryResult,
  BotCommandResult,
  BotMessageResult,
  CalendarPrimaryResult,
  ChatListResult,
  ChatMessagesResult,
  CreateGroupResult,
  DepartmentAncestorsResult,
  DepartmentChildrenResult,
  DepartmentDetailResult,
  DepartmentStaffsResult,
  DownloadMediaResult,
  DownloadFileResult,
  DynamicCardUpdateParams,
  ExtraFieldIdsResult,
  GroupInfoResult,
  GroupListResult,
  GroupMemberResult,
  IsInGroupResult,
  LinkCardParams,
  MediaPathResult,
  OaCardParams,
  OrgInfoResult,
  PersonalAppCreateResult,
  PersonalAppInfoResult,
  PersonalAppListResult,
  QueryGroupsResult,
  ScheduleAttendeeMetaResult,
  ScheduleAttendeesResult,
  ScheduleAttendeesUpdateResult,
  ScheduleCreateResult,
  ScheduleInfoResult,
  ScheduleListResult,
  ScheduleUpdateResult,
  SendMessageResult,
  StaffBasicInfoResult,
  StaffDetailResult,
  StaffIdMappingResult,
  StaffSearchResult,
  StreamMessageResult,
  UpdateGroupMembersResult,
  UpdateGroupResult,
  UploadMediaResult,
  UserInfoResult,
  UserMessageResult,
  UserTokenResult,
  VideoconferenceConfResult,
  VideoconferenceDetailResult,
  VideoconferenceListResult,
  VideoconferenceOpResult,
  VideoconferenceParamResult,
  VideoconferenceStatusListResult,
  VideoconferenceVodListResult,
  VideoconferenceVodUrlResult,
} from "./models";
import {
  buildAuthorizeUrl,
  exchangeCodeForUserToken,
  parseAuthorizeCallback,
  refreshUserToken,
  validateCallbackState,
} from "./oauth";
import {
  CredentialStore,
} from "./persistence";
import {
  createPersonalApp,
  deletePersonalApp,
  fetchPersonalApp,
  fetchPersonalAppList,
  updatePersonalApp,
} from "./personalApps";
import {
  sendReminder,
} from "./reminders";
import {
  createStreamMessage,
  fetchStreamMessage,
} from "./streaming";
import {
  buildApiUrl,
} from "./urlHelpers";
import {
  sendUserMessage,
} from "./userMessages";
import {
  fetchUserInfo,
} from "./users";
type AnyDict = Record<string, any>;
import {
  cancelMeeting,
  controlMeetingMember,
  createMeeting,
  fetchActiveMeetings,
  fetchFixroomList,
  fetchHistoryMeetings,
  fetchMeetingDetail,
  fetchMeetingList,
  fetchMeetingMemberList,
  fetchMeetingParams,
  fetchMeetingRecordList,
  fetchMeetingStatus,
  fetchMemberSimplerecord,
  fetchOrgVideoconfConf,
  fetchVodDownloadUrls,
  fetchVodList,
  inviteMeetingMembers,
  modifyMeeting,
  stopMeeting,
  subscribeMeetingEvents,
} from "./videoconferences";

const _logger = {
  debug: (...args: any[]) => { if (isSDKDebug()) console.error(`[${new Date().toISOString().slice(11,19)}] [DEBUG]`, ...args); },
};

function _parseSendResponse(data: AnyDict, msgType: string = "", operation: string = ""): SendMessageResult {
  const errCode = data.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data.errMsg || "Unknown error";
    return new SendMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}`, msg_type: msgType, operation, retryable: true , err_code: errCodeOf(data) });
  }
  const d = data.data || {};
  return new SendMessageResult({ success: true, message_id: d.msgId, msg_type: msgType, operation, raw_response: data });
}

/**
 * Parse the revoke response (4.6.7), including per-message `subStatus`.
 *
 * The revoke API answers 200/errCode=0 even when individual messages fail;
 * the per-message outcome lives in `data.subStatus`. Treating that as plain
 * success silently reports partial failures as revoked.
 */
function _parseRevokeResponse(data: AnyDict): SendMessageResult {
  const rawCode = data.errCode ?? -1;
  if (rawCode !== 0) {
    const msg = data.errMsg || "Unknown error";
    return new SendMessageResult({
      success: false,
      error: `API error (errCode=${rawCode}): ${msg}`,
      operation: "revoke",
      retryable: true,
      err_code: errCodeOf(data),
    });
  }
  const body = data.data;
  const subStatus: AnyDict[] | null =
    body && typeof body === "object" && Array.isArray(body.subStatus) ? body.subStatus : null;
  if (subStatus) {
    const failed = subStatus.filter(
      (item) => item && typeof item === "object" && (item.errCode ?? 0) !== 0,
    );
    if (failed.length > 0) {
      const details = failed
        .map((item) => `errCode=${item.errCode}: ${item.errMsg || ""}`.trim())
        .join("; ");
      return new SendMessageResult({
        success: false,
        error: `revoke failed for ${failed.length}/${subStatus.length} message(s): ${details}`,
        operation: "revoke",
        err_code: errCodeOf(failed[0]),
        sub_status: subStatus,
        raw_response: data,
      });
    }
  }
  return new SendMessageResult({
    success: true,
    operation: "revoke",
    sub_status: subStatus,
    raw_response: data,
  });
}

export class LansengerClient {
  private _config: LansengerConfig;
  private _fetchFn: FetchFn | undefined = undefined;
  private _tokenManager: TokenManager | null = null;
  private _userTokenManager: UserTokenManager | null = null;
  private _store: CredentialStore | null = null;

  constructor(
    appId: string = "",
    appSecret: string = "",
    apiGatewayUrl: string = "",
    passportUrl: string = "",
    httpTimeout: number = 30,
    storePath?: string,
    encodingKey: string = "",
    callbackToken: string = "",
    redirectUri: string = "",
    appToken: string = "",
    userToken: string = "",
  ) {
    this._config = new LansengerConfig(appId, appSecret, apiGatewayUrl, passportUrl, httpTimeout, encodingKey, callbackToken, redirectUri, appToken, userToken);
    if (storePath) {
      this._store = new CredentialStore(storePath);
    }
  }

  static fromEnv(storePath?: string): LansengerClient {
    const config = LansengerConfig.fromEnv();
    return new LansengerClient(config.app_id, config.app_secret, config.api_gateway_url, config.passport_url, config.http_timeout, storePath, config.encoding_key, config.callback_token, config.redirect_uri, config.app_token, config.user_token);
  }

  static fromConfig(config: LansengerConfig, storePath?: string): LansengerClient {
    return new LansengerClient(config.app_id, config.app_secret, config.api_gateway_url, config.passport_url, config.http_timeout, storePath, config.encoding_key, config.callback_token, config.redirect_uri, config.app_token, config.user_token);
  }

  static fromStore(profile: string = "default", filePath?: string): LansengerClient {
    const store = new CredentialStore(filePath, profile);
    const creds = store.loadCredentials();
    if (!creds.app_id || !creds.app_secret || !creds.api_gateway_url) throw new LansengerConfigError("No complete credentials found in store profile (need app_id, app_secret, api_gateway_url)");
    return new LansengerClient(creds.app_id, creds.app_secret, creds.api_gateway_url, creds.passport_url, 30, filePath, creds.encoding_key, creds.callback_token, creds.redirect_uri);
  }

  get config(): LansengerConfig { return this._config; }

  private async _ensureInit(): Promise<void> {
    if (!this._fetchFn) {
      const nodeFetch = await import("node-fetch");
      this._fetchFn = (nodeFetch.default as any) as FetchFn;
    }
    if (!this._tokenManager) {
      this._tokenManager = new TokenManager(this._config, this._fetchFn, this._store);
    }
    if (!this._userTokenManager) {
      this._userTokenManager = new UserTokenManager(this._config, this._fetchFn, this._tokenManager, this._store);
    }
  }

  async getToken(): Promise<string> {
    await this._ensureInit();
    return this._tokenManager!.getToken();
  }

  invalidateToken(): void {
    if (this._tokenManager) this._tokenManager.invalidate();
  }

  async getUserToken(staffId: string = ""): Promise<string> {
    if (!staffId) {
      await this._ensureInit();
      return this._userTokenManager!.getToken();
    }

    if (!this._store) {
      throw new LansengerAuthError(
        "CredentialStore is required for multi-user token management. " +
        "Provide storePath when creating the client."
      );
    }

    await this._ensureInit();
    const cached = this._store.loadUserToken(staffId);
    const userToken = cached.user_token || "";
    const refreshToken = cached.refresh_token || "";
    const expiry = cached.user_token_expiry || 0;

    if (userToken && expiry > Math.floor(Date.now() / 1000)) {
      return userToken;
    }

    if (!refreshToken) {
      throw new LansengerAuthError(
        `No userToken available for staff_id=${staffId} and no refreshToken for auto-refresh. ` +
        "Run OAuth2 authorize flow: build_authorize_url → exchange_code."
      );
    }

    const token = await this._tokenManager!.getToken();
    const urlObj = new URL(buildApiUrl(this._config, "oauth2", "refresh_token_create", token));
    urlObj.searchParams.set("grant_type", "refresh_token");
    urlObj.searchParams.set("refresh_token", refreshToken);
    const url = urlObj.toString();

    try {
      const response = await this._fetchFn!(url);
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
      const newUserToken = tokenData.userToken;
      const expiresIn = tokenData.expiresIn || 7200;
      const newRefreshToken = tokenData.refreshToken;
      const refreshExpiresIn = tokenData.refreshExpiresIn || 0;
      const newStaffId = tokenData.staffId || staffId;

      if (!newUserToken) {
        throw new LansengerAuthError("Refresh response missing userToken field");
      }

      this._store.saveUserToken(newUserToken, newRefreshToken || "", expiresIn, 300, refreshExpiresIn, newStaffId);

      return newUserToken;
    } catch (e) {
      if (e instanceof LansengerAuthError || e instanceof LansengerNetworkError) throw e;
      throw new LansengerNetworkError(`userToken refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async setUserTokens(userToken: string, refreshToken: string, expiresIn: number = 7200, staffId: string = "", refreshExpiresIn: number = 0): Promise<void> {
    await this._ensureInit();
    if (this._store && staffId) {
      this._store.saveUserToken(userToken, refreshToken, expiresIn, 300, refreshExpiresIn, staffId);
    }
    this._userTokenManager!.setTokens(userToken, refreshToken, expiresIn, staffId, refreshExpiresIn);
  }

  /**
   * Verify credentials work by attempting to get a token.
   *
   * Returns true if a token was obtained successfully, false otherwise
   * (unlike most SDK methods, this returns a plain boolean instead of
   * throwing or returning a *Result object).
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch { return false; }
  }

  private _privateMsgUrl(token: string): string {
    return buildApiUrl(this._config, "smart_bot", "private_message", token);
  }

  private _groupMsgUrl(token: string): string {
    return buildApiUrl(this._config, "smart_bot", "group_message", token);
  }

  private async _sendPrivate(chatId: string, msgType: string, msgData: AnyDict, opts?: { refMsgId?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = this._privateMsgUrl(token);
    const payload: AnyDict = { userIdList: [chatId], msgType, msgData };
    if (opts?.refMsgId) payload.refMsgId = opts.refMsgId;
    _logger.debug("Sending", msgType, "to", chatId);
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) {
      _logger.debug("Send", msgType, "to", chatId, "FAILED:", httpErr);
      return new SendMessageResult({ success: false, error: httpErr, msg_type: msgType, operation: "private_message" });
    }
    const result = _parseSendResponse(data!, msgType, "private_message");
    _logger.debug("Send", msgType, "to", chatId, result.success ? "OK" : "FAILED");
    return result;
  }

  private async _sendGroup(groupId: string, msgType: string, msgData: AnyDict, opts?: { userToken?: string; senderId?: string; refMsgId?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = this._groupMsgUrl(token);
    const payload: AnyDict = { groupId, msgType, msgData };
    if (opts?.userToken) payload.userToken = opts.userToken;
    if (opts?.senderId) payload.senderId = opts.senderId;
    if (opts?.refMsgId) payload.refMsgId = opts.refMsgId;
    _logger.debug("Sending", msgType, "to group", groupId);
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) {
      _logger.debug("Send", msgType, "to group", groupId, "FAILED:", httpErr);
      return new SendMessageResult({ success: false, error: httpErr, msg_type: msgType, operation: "group_message", retryable: true });
    }
    const result = _parseSendResponse(data!, msgType, "group_message");
    _logger.debug("Send", msgType, "to group", groupId, result.success ? "OK" : "FAILED");
    return result;
  }

  async sendText(chatId: string, content: string, opts?: { file_path?: string; media_type?: string; cover_image_path?: string; reminder_all?: boolean; reminder_user_ids?: string[]; reminder_bot_ids?: string[]; is_group?: boolean; user_token?: string; sender_id?: string; ref_msg_id?: string }): Promise<SendMessageResult> {
    const textObj: AnyDict = { content };
    if (opts?.reminder_all || (opts?.reminder_user_ids && opts.reminder_user_ids.length > 0) || (opts?.reminder_bot_ids && opts.reminder_bot_ids.length > 0)) {
      const reminder: AnyDict = {};
      if (opts?.reminder_all) reminder.all = true;
      if (opts?.reminder_user_ids) reminder.userIds = opts.reminder_user_ids;
      if (opts?.reminder_bot_ids) reminder.botIds = opts.reminder_bot_ids;
      textObj.reminder = reminder;
    }
    if (opts?.file_path) {
      await this._ensureInit();
      const mt = opts.media_type || guessAppMediaType(opts.file_path) || APP_MEDIA_TYPE_FILE;
      const userToken = opts.user_token || "";
      // assistant 身份（带 user_token）走 v1 上传通道会被 10005 invalid
      // appCategory 拒绝——统一收敛到 v2 通道（4.5.5，user_token 鉴权）；
      // bot 身份仍走 v1（LXBUGS-128492 测试轮）。
      const mediaResult = userToken
        ? await uploadAppMediaV2(this._config, this._tokenManager!, this._fetchFn!, opts.file_path, userToken, mt)
        : await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, opts.file_path, mt);
      if (!mediaResult.success) return new SendMessageResult({ success: false, error: mediaResult.error });
      textObj.mediaType = APP_TO_MSG_MEDIA_TYPE[mt] || MEDIA_TYPE_AUDIO;
      textObj.mediaIds = [mediaResult.media_id];
      if (opts.cover_image_path && mt === APP_MEDIA_TYPE_VIDEO) {
        const coverResult = userToken
          ? await uploadAppMediaV2(this._config, this._tokenManager!, this._fetchFn!, opts.cover_image_path, userToken, APP_MEDIA_TYPE_IMAGE)
          : await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, opts.cover_image_path, APP_MEDIA_TYPE_IMAGE);
        if (!coverResult.success) return new SendMessageResult({ success: false, error: coverResult.error });
        textObj.coverMediaIds = [coverResult.media_id];
      }
    }
    const msgData: AnyDict = { text: textObj };
    const isGroup = opts?.is_group || false;
    if (isGroup) return this._sendGroup(chatId, "text", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "", refMsgId: opts?.ref_msg_id || "" });
    return this._sendPrivate(chatId, "text", msgData, { refMsgId: opts?.ref_msg_id || "" });
  }

  async sendMarkdown(chatId: string, content: string, opts?: { reminder_all?: boolean; reminder_user_ids?: string[]; reminder_bot_ids?: string[]; is_group?: boolean; user_token?: string; sender_id?: string; ref_msg_id?: string }): Promise<SendMessageResult> {
    const formatTextObj: AnyDict = { formatType: 1, text: content };
    const hasReminder = opts?.reminder_all || (opts?.reminder_user_ids && opts.reminder_user_ids.length > 0) || (opts?.reminder_bot_ids && opts.reminder_bot_ids.length > 0);
    if (hasReminder) {
      const reminder: AnyDict = {};
      if (opts?.reminder_all) reminder.all = true;
      if (opts?.reminder_user_ids) reminder.userIds = opts.reminder_user_ids;
      if (opts?.reminder_bot_ids) reminder.botIds = opts.reminder_bot_ids;
      formatTextObj.reminder = reminder;
    }
    const msgData: AnyDict = { formatText: formatTextObj };
    const isGroup = opts?.is_group || false;
    if (isGroup) {
      const result = await this._sendGroup(chatId, "formatText", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "", refMsgId: opts?.ref_msg_id || "" });
      if (!result.success && hasReminder) {
        const cleanMsgData: AnyDict = { formatText: { formatType: 1, text: content } };
        return this._sendGroup(chatId, "formatText", cleanMsgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "", refMsgId: opts?.ref_msg_id || "" });
      }
      return result;
    }
    const result = await this._sendPrivate(chatId, "formatText", msgData, { refMsgId: opts?.ref_msg_id || "" });
    if (!result.success && hasReminder) {
      const cleanMsgData: AnyDict = { formatText: { formatType: 1, text: content } };
      return this._sendPrivate(chatId, "formatText", cleanMsgData, { refMsgId: opts?.ref_msg_id || "" });
    }
    return result;
  }

  async sendFile(chatId: string, filePath: string, opts?: { caption?: string; media_type?: string; cover_image_path?: string; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const mediaType = opts?.media_type || guessAppMediaType(filePath) || APP_MEDIA_TYPE_FILE;
    const uploadResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, filePath, mediaType);
    if (!uploadResult.success) return new SendMessageResult({ success: false, error: uploadResult.error });
    const textObj: AnyDict = { content: opts?.caption || "", mediaType: APP_TO_MSG_MEDIA_TYPE[mediaType] || MEDIA_TYPE_AUDIO, mediaIds: [uploadResult.media_id] };
    if (opts?.cover_image_path) {
      const coverResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, opts.cover_image_path, APP_MEDIA_TYPE_IMAGE);
      if (!coverResult.success) return new SendMessageResult({ success: false, error: coverResult.error });
      textObj.coverMediaIds = [coverResult.media_id];
    }
    const msgData: AnyDict = { text: textObj };
    const isGroup = opts?.is_group || false;
    if (isGroup) return this._sendGroup(chatId, "text", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "" });
    return this._sendPrivate(chatId, "text", msgData);
  }

  async sendImageUrl(chatId: string, imageUrl: string, opts?: { caption?: string; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const response = await this._fetchFn!(imageUrl, { method: "GET" });
    if (!response.ok) return new SendMessageResult({ success: false, error: `Failed to download image from URL: ${response.status}` });
    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, `lansenger_img_${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, buffer);
    try {
      const uploadResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, tmpPath, APP_MEDIA_TYPE_IMAGE);
      if (!uploadResult.success) return new SendMessageResult({ success: false, error: uploadResult.error });
      const textObj: AnyDict = { content: opts?.caption || "", mediaType: APP_TO_MSG_MEDIA_TYPE[APP_MEDIA_TYPE_IMAGE], mediaIds: [uploadResult.media_id] };
      const msgData: AnyDict = { text: textObj };
      const isGroup = opts?.is_group || false;
      if (isGroup) return this._sendGroup(chatId, "text", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "" });
      return this._sendPrivate(chatId, "text", msgData);
    } finally {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }

  async sendLinkCard(chatId: string, title: string, link: string, opts?: { description?: string; icon_link?: string; pc_link?: string; pad_link?: string; from_name?: string; from_icon_link?: string; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const params = new LinkCardParams({ chat_id: chatId, title, link, description: opts?.description || "", icon_link: opts?.icon_link || "", pc_link: opts?.pc_link || "", pad_link: opts?.pad_link || "", from_name: opts?.from_name || "", from_icon_link: opts?.from_icon_link || "", is_group: opts?.is_group || false, user_token: opts?.user_token || "", sender_id: opts?.sender_id || "" });
    return this.sendLinkCardWithParams(params);
  }

  async sendLinkCardWithParams(params: LinkCardParams): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = params.is_group ? this._groupMsgUrl(token) : this._privateMsgUrl(token);
    const payload: AnyDict = { msgType: "linkCard", msgData: params };
    if (params.is_group) { payload.groupId = params.chat_id; } else { payload.chatId = params.chat_id; }
    if (params.user_token) payload.userToken = params.user_token;
    if (params.sender_id) payload.senderId = params.sender_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: "linkCard" });
    return _parseSendResponse(data!, "linkCard");
  }

  async sendAppArticles(chatId: string, articles: AnyDict[], opts?: { is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const msgData: AnyDict = { appArticles: articles };
    const isGroup = opts?.is_group || false;
    if (isGroup) return this._sendGroup(chatId, "appArticles", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "" });
    return this._sendPrivate(chatId, "appArticles", msgData);
  }

  async sendAppCard(chatId: string, bodyTitle: string, opts?: { head_title?: string; body_sub_title?: string; body_content?: string; signature?: string; fields?: AnyDict[]; links?: AnyDict[]; card_link?: string; pc_card_link?: string; pad_card_link?: string; is_dynamic?: boolean; head_status_info?: AnyDict; staff_id?: string; head_icon_url?: string; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const params = new AppCardParams({
      body_title: bodyTitle, chat_id: chatId,
      head_title: opts?.head_title || "", body_sub_title: opts?.body_sub_title || "",
      body_content: opts?.body_content || "", signature: opts?.signature || "",
      fields: opts?.fields, links: opts?.links, card_link: opts?.card_link || "",
      pc_card_link: opts?.pc_card_link || "", pad_card_link: opts?.pad_card_link || "",
      is_dynamic: opts?.is_dynamic || false, head_status_info: opts?.head_status_info,
      staff_id: opts?.staff_id || "", head_icon_url: opts?.head_icon_url || "",
      is_group: opts?.is_group || false, user_token: opts?.user_token || "",
      sender_id: opts?.sender_id || "",
    });
    return this.sendAppCardWithParams(params);
  }

  async sendAppCardWithParams(params: AppCardParams): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = params.is_group ? this._groupMsgUrl(token) : this._privateMsgUrl(token);
    const payload: AnyDict = { msgType: "appCard", msgData: params };
    if (params.is_group) { payload.groupId = params.chat_id; } else { payload.chatId = params.chat_id; }
    if (params.user_token) payload.userToken = params.user_token;
    if (params.sender_id) payload.senderId = params.sender_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: "appCard" });
    return _parseSendResponse(data!, "appCard");
  }

  async sendOacard(chatId: string, title: string, opts?: { head?: string; sub_title?: string; staff_id?: string; fields?: AnyDict[]; link?: string; pc_link?: string; pad_link?: string; card_action?: AnyDict; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const params = new OaCardParams({
      chat_id: chatId, title, head: opts?.head || "", sub_title: opts?.sub_title || "",
      staff_id: opts?.staff_id || "", fields: opts?.fields, link: opts?.link || "",
      pc_link: opts?.pc_link || "", pad_link: opts?.pad_link || "",
      card_action: opts?.card_action, is_group: opts?.is_group || false,
      user_token: opts?.user_token || "", sender_id: opts?.sender_id || "",
    });
    return this.sendOacardWithParams(params);
  }

  async sendOacardWithParams(params: OaCardParams): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = params.is_group ? this._groupMsgUrl(token) : this._privateMsgUrl(token);
    const payload: AnyDict = { msgType: "oacard", msgData: params };
    if (params.is_group) { payload.groupId = params.chat_id; } else { payload.chatId = params.chat_id; }
    if (params.user_token) payload.userToken = params.user_token;
    if (params.sender_id) payload.senderId = params.sender_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: "oacard" });
    return _parseSendResponse(data!, "oacard");
  }

  private _buildApproveCardData(params: ApproveCardParams): AnyDict {
    const card: AnyDict = {};

    // head
    const head: AnyDict = {};
    if (params.head_title) head.title = params.head_title;
    if (params.head_icon_link) head.iconLink = params.head_icon_link;
    if (params.head_icon_id) head.iconId = params.head_icon_id;
    if (params.head_status_describe || params.head_status_icon ||
        params.head_status_icon_link || params.head_status_colour) {
      const headStatus: AnyDict = {};
      if (params.head_status_describe) headStatus.describe = params.head_status_describe;
      if (params.head_status_icon) headStatus.statusIcon = params.head_status_icon;
      if (params.head_status_icon_link) headStatus.iconLink = params.head_status_icon_link;
      if (params.head_status_colour) headStatus.colour = params.head_status_colour;
      head.headStatus = headStatus;
    }
    if (Object.keys(head).length > 0) card.head = head;

    // body
    const body: AnyDict = {};
    if (params.body_title) body.title = params.body_title;
    if (params.body_content) {
      body.content = { formatType: params.body_format_type, text: params.body_content };
    }
    if (params.fields) body.fields = params.fields;
    if (Object.keys(body).length > 0) card.body = body;

    // reminder
    const reminder: AnyDict = {};
    if (params.reminder_all) reminder.all = true;
    if (params.reminder_user_ids) reminder.userIds = params.reminder_user_ids;
    if (params.reminder_bot_ids) reminder.botIds = params.reminder_bot_ids;
    if (Object.keys(reminder).length > 0) card.reminder = reminder;

    // cardLink
    if (params.card_link) {
      const cardLink: AnyDict = { cardLink: params.card_link };
      if (params.card_link_for_pc) cardLink.cardLinkForPc = params.card_link_for_pc;
      if (params.card_link_for_pad) cardLink.cardLinkForPad = params.card_link_for_pad;
      card.cardLink = cardLink;
    }

    // buttons
    if (params.buttons) card.buttons = params.buttons;

    // expireTime
    if (params.expire_time) card.expireTime = params.expire_time;

    return { approveCard: card };
  }

  async sendApproveCardWithParams(params: ApproveCardParams): Promise<SendMessageResult> {
    if (!params.chat_id) return new SendMessageResult({ success: false, error: "chat_id is required", msg_type: "approveCard" });
    if (!params.body_title) return new SendMessageResult({ success: false, error: "body_title is required for approveCard", msg_type: "approveCard" });
    if (!params.body_content) return new SendMessageResult({ success: false, error: "body_content is required for approveCard", msg_type: "approveCard" });

    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const msgData = this._buildApproveCardData(params);

    if (params.is_group) {
      return this._sendGroup(params.chat_id, "approveCard", msgData,
        { userToken: params.user_token, senderId: params.sender_id });
    }
    return this._sendPrivate(params.chat_id, "approveCard", msgData);
  }

  async sendApproveCard(
    bodyTitle: string,
    bodyContent: string,
    opts?: {
      chat_id?: string;
      head_title?: string;
      head_icon_link?: string;
      head_icon_id?: string;
      head_status_describe?: string;
      head_status_icon?: number;
      head_status_icon_link?: string;
      head_status_colour?: string;
      body_format_type?: number;
      fields?: Record<string, string>[];
      reminder_all?: boolean;
      reminder_user_ids?: string[];
      reminder_bot_ids?: string[];
      card_link?: string;
      card_link_for_pc?: string;
      card_link_for_pad?: string;
      buttons?: Record<string, any>[];
      expire_time?: number;
      is_group?: boolean;
      user_token?: string;
      sender_id?: string;
    }
  ): Promise<SendMessageResult> {
    const params = new ApproveCardParams({
      chat_id: opts?.chat_id || "",
      body_title: bodyTitle,
      body_content: bodyContent,
      head_title: opts?.head_title || "",
      head_icon_link: opts?.head_icon_link || "",
      head_icon_id: opts?.head_icon_id || "",
      head_status_describe: opts?.head_status_describe || "",
      head_status_icon: opts?.head_status_icon || 0,
      head_status_icon_link: opts?.head_status_icon_link || "",
      head_status_colour: opts?.head_status_colour || "",
      body_format_type: opts?.body_format_type ?? 1,
      fields: opts?.fields,
      reminder_all: opts?.reminder_all || false,
      reminder_user_ids: opts?.reminder_user_ids,
      reminder_bot_ids: opts?.reminder_bot_ids,
      card_link: opts?.card_link || "",
      card_link_for_pc: opts?.card_link_for_pc || "",
      card_link_for_pad: opts?.card_link_for_pad || "",
      buttons: opts?.buttons,
      expire_time: opts?.expire_time || 0,
      is_group: opts?.is_group || false,
      user_token: opts?.user_token || "",
      sender_id: opts?.sender_id || "",
    });
    return this.sendApproveCardWithParams(params);
  }

  async updateApproveCard(
    msgId: string,
    opts?: {
      head_status_describe?: string;
      head_status_icon?: number;
      head_status_icon_link?: string;
      head_status_colour?: string;
      buttons?: Record<string, any>[];
    }
  ): Promise<SendMessageResult> {
    await this._ensureInit();

    if (!msgId) return new SendMessageResult({ success: false, error: "msg_id is required" });

    const token = await this._tokenManager!.getToken();
    const url = buildApiUrl(this._config, "message", "dynamic_update", token);

    const updateData: AnyDict = {};
    if (opts?.head_status_describe || opts?.head_status_icon ||
        opts?.head_status_icon_link || opts?.head_status_colour) {
      const headStatus: AnyDict = {};
      if (opts?.head_status_describe) headStatus.describe = opts.head_status_describe;
      if (opts?.head_status_icon) headStatus.statusIcon = opts.head_status_icon;
      if (opts?.head_status_icon_link) headStatus.iconLink = opts.head_status_icon_link;
      if (opts?.head_status_colour) headStatus.colour = opts.head_status_colour;
      updateData.headStatus = headStatus;
    }
    if (opts?.buttons) updateData.buttons = opts.buttons;

    const payload: AnyDict = {
      msgId: msgId,
      msgType: "approveCard",
      msgData: { approveCardUpdateMsg: updateData },
    };

    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, operation: "approve_card_update" });
    return _parseSendResponse(data!, "approveCard", "approve_card_update");
  }

  async updateDynamicCard(msgId: string, opts?: { head_status_info?: AnyDict; links?: AnyDict[]; is_last_update?: boolean; user_token?: string; user_id?: string }): Promise<SendMessageResult> {
    const params = new DynamicCardUpdateParams({
      msg_id: msgId, head_status_info: opts?.head_status_info,
      links: opts?.links, is_last_update: opts?.is_last_update || false,
      user_token: opts?.user_token || "", user_id: opts?.user_id || "",
    });
    return this.updateDynamicCardWithParams(params);
  }

  async updateDynamicCardWithParams(params: DynamicCardUpdateParams): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    let url = buildApiUrl(this._config, "message", "dynamic_update", token);
    // Identity must match the card's sender (LXBUGS-128492): bot-sent cards
    // work with the app identity; human-sent cards need user_token/user_id.
    if (params.user_token) url += `&user_token=${encodeURIComponent(params.user_token)}`;
    const appCardUpdateMsg: AnyDict = { isLastUpdate: params.is_last_update };
    if (params.head_status_info) appCardUpdateMsg.headStatusInfo = params.head_status_info;
    if (params.links) appCardUpdateMsg.links = params.links;
    const payload: AnyDict = { msgId: params.msg_id, msgType: "appCard", msgData: { appCardUpdateMsg } };
    if (params.user_id) payload.userId = params.user_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: "dynamic_update" });
    return _parseSendResponse(data!, "dynamic_update", "update_dynamic_card");
  }

  /**
   * Revoke previously sent messages (4.6.7).
   *
   * Sender contract (4.6.7):
   * - `chat_type: "bot"` revokes messages the bot sent one-to-one.
   * - `chat_type: "group"` requires `sender_id` = the sender's **staffId**
   *   (human open id). A bot identity has no staffId, so a group message sent
   *   under the bot's own identity cannot be revoked through this API — send it
   *   with `user_token` / `sender_id` when it has to stay revocable.
   * - The server answers errCode 59003 (「当前组织禁用机器人」) for some
   *   bot-identity revokes even when the bot is enabled for sending; `err_code`
   *   is the machine-readable truth — do not parse the message text.
   *
   * Per-message outcomes are exposed in `sub_status`; if any message failed,
   * `success` is false and `err_code` carries the first failing code.
   */
  async revokeMessage(messageIds: string[], opts?: { chat_type?: string; sender_id?: string }): Promise<SendMessageResult> {
    const chatType = opts?.chat_type || "bot";
    if (!messageIds || messageIds.length === 0) {
      return new SendMessageResult({ success: false, error: "message_ids is required", operation: "revoke" });
    }
    if (!["staff", "group", "notification", "account", "bot"].includes(chatType)) {
      return new SendMessageResult({
        success: false,
        error: `unsupported chat_type='${chatType}': expected staff, group, notification, account or bot`,
        operation: "revoke",
      });
    }
    if ((chatType === "staff" || chatType === "group") && !opts?.sender_id) {
      return new SendMessageResult({
        success: false,
        error:
          `chat_type='${chatType}' requires sender_id (the sender's staffId). ` +
          "A bot has no staffId, so group messages sent under the bot's own identity " +
          "cannot be revoked through this API — send with user_token/sender_id when the " +
          "message must stay revocable (4.6.7)",
        operation: "revoke",
      });
    }
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = buildApiUrl(this._config, "message", "revoke", token);
    const payload: AnyDict = { messageIds, chatType };
    if (opts?.sender_id) payload.senderId = opts.sender_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, operation: "revoke_message" });
    return _parseRevokeResponse(data!);
  }

  /**
   * @deprecated Use {@link fetchGroupList} from "groups" module instead.
   */
  async queryGroups(opts?: { page_offset?: number; page_size?: number }): Promise<QueryGroupsResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const pageOffset = opts?.page_offset ?? 0;
    const pageSize = opts?.page_size || 100;
    const result = await fetchGroupList(this._config, token, {
      page_offset: pageOffset, page_size: pageSize, fetchFn: this._fetchFn,
    });
    return new QueryGroupsResult({
      success: result.success,
      total_group_ids: result.total_group_ids,
      group_ids: result.group_ids || [],
      error: result.error,
      raw_response: result.raw_response,
    });
  }

  async sendReminderMsg(msgId: string, reminderTypes: number[], userIdList: string[]): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return sendReminder(this._config, token, msgId, reminderTypes, userIdList, { fetchFn: this._fetchFn! });
  }

  async uploadMediaFile(filePath: string, opts?: { media_type?: number; user_token?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const mediaType = opts?.media_type || guessMediaType(filePath);
    const result = await uploadMedia(this._config, this._tokenManager!, this._fetchFn!, filePath, mediaType, opts?.user_token || "");
    if (!result.success) return new SendMessageResult({ success: false, error: result.error });
    return new SendMessageResult({ success: true, message_id: result.media_id, operation: "upload_media", raw_response: result.raw_response });
  }

  async uploadAppMediaFile(filePath: string, opts?: { media_type?: string; width?: number; height?: number; duration?: number }): Promise<SendMessageResult> {
    await this._ensureInit();
    const result = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, filePath, opts?.media_type || guessAppMediaType(filePath), { width: opts?.width, height: opts?.height, duration: opts?.duration });
    if (!result.success) return new SendMessageResult({ success: false, error: result.error });
    return new SendMessageResult({ success: true, message_id: result.media_id, operation: "upload_app_media", raw_response: result.raw_response });
  }

  async uploadAppMediaFileV2(filePath: string, userToken: string, opts?: { media_type?: string; width?: number; height?: number; duration?: number }): Promise<SendMessageResult> {
    await this._ensureInit();
    const result = await uploadAppMediaV2(this._config, this._tokenManager!, this._fetchFn!, filePath, userToken, opts?.media_type || guessAppMediaType(filePath), { width: opts?.width, height: opts?.height, duration: opts?.duration });
    if (!result.success) return new SendMessageResult({ success: false, error: result.error });
    return new SendMessageResult({ success: true, message_id: result.media_id, operation: "upload_app_media_v2", raw_response: result.raw_response });
  }

  async downloadMediaFile(mediaId: string): Promise<DownloadMediaResult> {
    await this._ensureInit();
    return downloadMedia(this._config, this._tokenManager!, this._fetchFn!, mediaId);
  }

  async downloadMediaFileByShareId(shareId: string, opts?: { user_token?: string }): Promise<DownloadMediaResult> {
    await this._ensureInit();
    return downloadMediaByShareId(this._config, this._tokenManager!, this._fetchFn!, shareId, { userToken: opts?.user_token || "" });
  }

  /**
   * Download media and save to a file.
   *
   * Note: unlike most SDK methods (which return a *Result with a success
   * field), this throws LansengerFileError on failure and returns the path
   * string on success.
   */
  async downloadMediaToFile(mediaId: string, opts?: { target_path?: string; media_type?: string }): Promise<string> {
    await this._ensureInit();
    return downloadMediaToFile(this._config, this._tokenManager!, this._fetchFn!, mediaId, opts?.target_path, opts?.media_type || "file");
  }

  async downloadMediaToFileResult(mediaId: string, opts?: { target_path?: string; media_type?: string }): Promise<DownloadFileResult> {
    await this._ensureInit();
    return downloadMediaToFileResult(this._config, this._tokenManager!, this._fetchFn!, mediaId, opts?.target_path, opts?.media_type || "file");
  }

  async fetchMediaPathInfo(mediaId: string, opts?: { user_token?: string }): Promise<MediaPathResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMediaPath(this._config, token, mediaId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  buildAuthorizeUrl(redirectUri?: string, opts?: { scope?: string | string[]; state?: string }): string {
    return buildAuthorizeUrl(this._config, redirectUri, opts);
  }

  static parseAuthorizeCallback(queryString: string | AnyDict): AnyDict {
    return parseAuthorizeCallback(queryString);
  }

  static validateCallbackState(callbackState: string, expectedState: string): boolean {
    return validateCallbackState(callbackState, expectedState);
  }

  async exchangeCode(code: string, opts?: { redirect_uri?: string }): Promise<UserTokenResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const result = await exchangeCodeForUserToken(this._config, token, code, { redirect_uri: opts?.redirect_uri, fetchFn: this._fetchFn! });

    if (result.success) {
      if (this._store) {
        this._store.saveUserToken(result.user_token || "", result.refresh_token || "", result.expires_in, 300, result.refresh_expires_in || 0);
      }
      this._userTokenManager!.setTokens(
        result.user_token || "",
        result.refresh_token || "",
        result.expires_in,
        result.staff_id || "",
        result.refresh_expires_in || 0,
      );
    }

    return result;
  }

  async refreshUserToken(refreshToken: string, opts?: { scope?: string }): Promise<UserTokenResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return refreshUserToken(this._config, token, refreshToken, { scope: opts?.scope, fetchFn: this._fetchFn! });
  }

  async fetchUserInfoByToken(userToken: string): Promise<UserInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchUserInfo(this._config, token, userToken, { fetchFn: this._fetchFn! });
  }

  async fetchStaffBasicInfo(staffId: string, opts?: { user_token?: string }): Promise<StaffBasicInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchStaffBasicInfo(this._config, token, staffId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchStaffDetail(staffId: string, opts?: { user_token?: string }): Promise<StaffDetailResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchStaffDetail(this._config, token, staffId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchDepartmentAncestors(staffId: string, opts?: { user_token?: string }): Promise<DepartmentAncestorsResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchDepartmentAncestors(this._config, token, staffId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchStaffIdMapping(orgId: string, idType: string, idValue: string, opts?: { user_token?: string }): Promise<StaffIdMappingResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchStaffIdMapping(this._config, token, orgId, idType, idValue, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchOrgExtraFieldIds(orgId: string, opts?: { user_token?: string; page?: number; page_size?: number }): Promise<ExtraFieldIdsResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchOrgExtraFieldIds(this._config, token, orgId, { user_token: opts?.user_token || "", page: opts?.page, page_size: opts?.page_size, fetchFn: this._fetchFn! });
  }

  async fetchOrgInfo(orgId: string, opts?: { user_token?: string }): Promise<OrgInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchOrgInfo(this._config, token, orgId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async searchStaff(keyword: string, opts?: { user_token?: string; user_id?: string; recursive?: boolean; sector_ids?: string[]; page?: number; page_size?: number }): Promise<StaffSearchResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return searchStaff(this._config, token, keyword, { user_token: opts?.user_token || "", user_id: opts?.user_id || "", recursive: opts?.recursive, sector_ids: opts?.sector_ids, page: opts?.page, page_size: opts?.page_size, fetchFn: this._fetchFn! });
  }

  async sendBotMessage(msgType: string, msgData: AnyDict, chatIds?: string[], departmentIds?: string[], opts?: { user_token?: string; entry_id?: string; is_group?: boolean; ref_msg_id?: string }): Promise<BotMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    if (opts?.is_group && chatIds && chatIds.length > 0) {
      const results: SendMessageResult[] = [];
      for (const gid of chatIds) {
        results.push(await sendGroupMessage(this._config, token, gid, msgType, msgData, { user_token: opts?.user_token || "", entry_id: opts?.entry_id || "", refMsgId: opts?.ref_msg_id || "", fetchFn: this._fetchFn! }));
      }
      const first = results[0];
      const allSuccess = results.every(r => r.success);
      const allErrors = results.filter(r => !r.success).map(r => r.error || "");
      const allMessageIds = results.map(r => r.message_id || "").filter(id => id);
      if (allSuccess) {
        return new BotMessageResult({ success: true, message_id: allMessageIds.join(",") || first.message_id, raw_response: first.raw_response });
      }
      return new BotMessageResult({ success: false, error: allErrors.join("; ") || first.error, raw_response: first.raw_response });
    }
    const url = buildApiUrl(this._config, "bot", "message_create", token, { userToken: opts?.user_token || "" });
    const payload: AnyDict = { msgType, msgData };
    if (chatIds && chatIds.length > 0) payload.userIdList = chatIds;
    if (departmentIds && departmentIds.length > 0) payload.departmentIdList = departmentIds;
    if (opts?.entry_id) payload.entryId = opts.entry_id;
    if (opts?.ref_msg_id) payload.refMsgId = opts.ref_msg_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new BotMessageResult({ success: false, error: httpErr });
    const errCode = data!.errCode ?? -1;
    if (errCode !== 0) {
      const msg = data!.errMsg || "Unknown error";
      return new BotMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` , err_code: errCodeOf(data) });
    }
    const d = data!.data || {};
    return new BotMessageResult({ success: true, message_id: d.msgId, invalid_staff: d.invalidStaff, invalid_department: d.invalidDepartment, raw_response: data! });
  }

  async sendAccountMessage(msgType: string, msgData: AnyDict, chatIds?: string[], departmentIds?: string[], opts?: { account_id?: string; entry_id?: string; attach?: string; user_token?: string }): Promise<AccountMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return sendAccountMessage(this._config, token, msgType, msgData, { chat_ids: chatIds, department_ids: departmentIds, account_id: opts?.account_id || "", entry_id: opts?.entry_id || "", attach: opts?.attach || "", user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async sendUserMessage(receiverId: string, msgType: string, msgData: AnyDict, opts?: { user_token?: string; common?: AnyDict; uuid?: string }): Promise<UserMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return sendUserMessage(this._config, token, opts?.user_token || "", receiverId, msgType, msgData, { common: opts?.common, uuid: opts?.uuid, fetchFn: this._fetchFn! });
  }

  async sendGroupMessage(groupId: string, msgType: string, msgData: AnyDict, opts?: { user_token?: string; sender_id?: string; reminder_all?: boolean; reminder_user_ids?: string[]; reminder_bot_ids?: string[]; outlines?: string; uuid?: string; entry_id?: string; ref_msg_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();

    let finalMsgData = msgData;
    if (opts?.reminder_all || (opts?.reminder_user_ids && opts.reminder_user_ids.length > 0) || (opts?.reminder_bot_ids && opts.reminder_bot_ids.length > 0)) {
      const reminder: AnyDict = { all: opts?.reminder_all || false, userIds: opts?.reminder_user_ids || [], botIds: opts?.reminder_bot_ids || [] };
      finalMsgData = { ...msgData };
      if (msgType === "text") {
        finalMsgData.text = { ...(msgData.text || {}), reminder };
      } else if (msgType === "formatText") {
        finalMsgData.formatText = { ...(msgData.formatText || {}), reminder };
      }
    }

    return sendGroupMessage(this._config, token, groupId, msgType, finalMsgData, { user_token: opts?.user_token || "", sender_id: opts?.sender_id || "", outlines: opts?.outlines || "", uuid: opts?.uuid || "", entry_id: opts?.entry_id || "", refMsgId: opts?.ref_msg_id || "", fetchFn: this._fetchFn! });
  }

  async createStreamMessage(receiverId: string, receiverType: string, streamId: string): Promise<StreamMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createStreamMessage(this._config, token, receiverId, receiverType, streamId, { fetchFn: this._fetchFn! });
  }

  async fetchStreamMessage(msgId: string): Promise<StreamMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchStreamMessage(this._config, token, msgId, { fetchFn: this._fetchFn! });
  }

  async createGroup(name: string, orgId: string, opts?: { owner_id?: string; description?: string; avatar_id?: string; staff_id_list?: string[]; department_id_list?: string[]; user_token?: string; apply_request_id?: string; apply_notes?: string; apply_global_unique_id?: string; apply_session_unique_id?: string }): Promise<CreateGroupResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createGroup(this._config, token, name, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchGroupInfo(groupId: string, opts?: { user_token?: string }): Promise<GroupInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchGroupInfo(this._config, token, groupId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchGroupMembers(groupId: string, opts?: { user_token?: string; page_offset?: number; page_size?: number }): Promise<GroupMemberResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchGroupMembers(this._config, token, groupId, { user_token: opts?.user_token || "", page_offset: opts?.page_offset, page_size: opts?.page_size, fetchFn: this._fetchFn! });
  }

  async fetchGroupList(opts?: { user_token?: string; page_offset?: number; page_size?: number }): Promise<GroupListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchGroupList(this._config, token, { user_token: opts?.user_token || "", page_offset: opts?.page_offset, page_size: opts?.page_size, fetchFn: this._fetchFn! });
  }

  async checkIsInGroup(groupId: string, opts?: { user_token?: string; staff_id?: string }): Promise<IsInGroupResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return checkIsInGroup(this._config, token, groupId, { user_token: opts?.user_token || "", staff_id: opts?.staff_id || "", fetchFn: this._fetchFn! });
  }

  async updateGroupInfo(groupId: string, opts?: { name?: string; description?: string; avatar_id?: string; owner_id?: string; assistant?: string[]; demote_assistant?: string[]; manage_mode?: number; location_share?: boolean; needs_confirm?: boolean; is_public?: boolean; max_members?: number; max_history_msg_count?: number; remind_all?: boolean; send_msg_status?: boolean; user_token?: string }): Promise<UpdateGroupResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateGroupInfo(this._config, token, groupId, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateGroupMembers(groupId: string, opts?: { add_user_list?: string[]; del_user_list?: string[]; add_department_id_list?: string[]; user_token?: string }): Promise<UpdateGroupMembersResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateGroupMembers(this._config, token, groupId, { ...opts, fetchFn: this._fetchFn! });
  }

  async dismissGroup(groupId: string, opts?: { user_token?: string }): Promise<UpdateGroupResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return dismissGroup(this._config, token, groupId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchDepartmentDetail(departmentId: string, opts?: { user_token?: string; tag_id?: string }): Promise<DepartmentDetailResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchDepartmentDetail(this._config, token, departmentId, { user_token: opts?.user_token || "", tag_id: opts?.tag_id || "", fetchFn: this._fetchFn! });
  }

  async fetchDepartmentChildren(departmentId: string, opts?: { user_token?: string }): Promise<DepartmentChildrenResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchDepartmentChildren(this._config, token, departmentId, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! });
  }

  async fetchDepartmentStaffs(departmentId: string, opts?: { user_token?: string; page?: number; page_size?: number }): Promise<DepartmentStaffsResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchDepartmentStaffs(this._config, token, departmentId, { user_token: opts?.user_token || "", page: opts?.page, page_size: opts?.page_size, fetchFn: this._fetchFn! });
  }

  async fetchPrimaryCalendar(opts?: { user_token?: string; user_id?: string }): Promise<CalendarPrimaryResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchPrimaryCalendar(this._config, token, { user_token: opts?.user_token || "", user_id: opts?.user_id || "", fetchFn: this._fetchFn! });
  }

  async createSchedule(calendarId: string, summary: string, startTime: AnyDict, endTime: AnyDict, attendees: AnyDict[], opts?: { description?: string; all_day?: string; repeat_type?: string; rule?: string; expire_date_type?: string; reminder_type?: string; attendee_permissions?: string; user_token?: string; user_id?: string }): Promise<ScheduleCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const userId = opts?.user_id || "";
    if (!attendees || !attendees.length) {
      if (!userId) throw new Error("attendees is required (or provide user_id to auto-fill creator)");
      attendees = [{ staffId: userId, attendeeFlag: "yes" }];
    }
    return createSchedule(this._config, token, calendarId, summary, startTime, endTime, attendees, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchSchedule(calendarId: string, scheduleId: string, opts?: { user_token?: string; user_id?: string }): Promise<ScheduleInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchSchedule(this._config, token, calendarId, scheduleId, { user_token: opts?.user_token || "", user_id: opts?.user_id || "", fetchFn: this._fetchFn! });
  }

  async deleteSchedule(calendarId: string, scheduleId: string, opts?: { reminder_type?: string; operation_type?: string; current_time?: number; user_token?: string; user_id?: string }): Promise<ScheduleCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deleteSchedule(this._config, token, calendarId, scheduleId, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateSchedule(calendarId: string, scheduleId: string, opts?: { summary?: string; description?: string; operation_type?: string; current_time?: number; reminder_type?: string; repeat_type?: string; rule?: string; expire_date_type?: string; all_day?: string; attendee_permissions?: string; start_time?: AnyDict; end_time?: AnyDict; user_token?: string; user_id?: string }): Promise<ScheduleUpdateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateSchedule(this._config, token, calendarId, scheduleId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchScheduleList(calendarId: string, startTime: number, endTime: number, opts?: { user_token?: string; user_id?: string }): Promise<ScheduleListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchScheduleList(this._config, token, calendarId, startTime, endTime, { user_token: opts?.user_token || "", user_id: opts?.user_id || "", fetchFn: this._fetchFn! });
  }

  async fetchScheduleAttendees(calendarId: string, scheduleId: string, opts?: { page?: number; page_size?: number; user_token?: string; user_id?: string }): Promise<ScheduleAttendeesResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchScheduleAttendees(this._config, token, calendarId, scheduleId, { ...opts, fetchFn: this._fetchFn! });
  }

  async addScheduleAttendees(calendarId: string, scheduleId: string, attendees: string[], opts?: { reminder_type?: string; user_token?: string; user_id?: string }): Promise<ScheduleCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return addScheduleAttendees(this._config, token, calendarId, scheduleId, attendees, { ...opts, fetchFn: this._fetchFn! });
  }

  async deleteScheduleAttendees(calendarId: string, scheduleId: string, attendees: string[], opts?: { reminder_type?: string; user_token?: string; user_id?: string }): Promise<ScheduleCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deleteScheduleAttendees(this._config, token, calendarId, scheduleId, attendees, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateScheduleAttendeeMeta(calendarId: string, scheduleId: string, opts?: { rsvp_status?: string; color?: string; permissions?: string; busy_free_state?: string; remind_times?: number[]; user_token?: string; user_id?: string }): Promise<ScheduleAttendeeMetaResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateScheduleAttendeeMeta(this._config, token, calendarId, scheduleId, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateScheduleAttendees(calendarId: string, scheduleId: string, opts?: { add_attendees?: string[]; delete_attendees?: string[]; reminder_type?: string; operation_type?: string; current_time?: number; user_token?: string; user_id?: string }): Promise<ScheduleAttendeesUpdateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateScheduleAttendees(this._config, token, calendarId, scheduleId, { ...opts, fetchFn: this._fetchFn! });
  }

  // ── Bot Commands (4.37) ───────────────────────────────────────────

  async createBotCommands(scopeType: number, commands: AnyDict[], opts?: { chat_id?: string; chat_type?: string; staff_id?: string }): Promise<BotCommandResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createBotCommands(this._config, token, scopeType, commands, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchBotCommands(scopeType: number, opts?: { chat_id?: string; chat_type?: string; staff_id?: string }): Promise<BotCommandQueryResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchBotCommands(this._config, token, scopeType, { ...opts, fetchFn: this._fetchFn! });
  }

  async deleteBotCommands(scopeType: number, opts?: { chat_id?: string; chat_type?: string; staff_id?: string }): Promise<BotCommandResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deleteBotCommands(this._config, token, scopeType, { ...opts, fetchFn: this._fetchFn! });
  }

  // ── Personal Apps (4.38) ───────────────────────────────────────────

  async createPersonalApp(opts: { user_token: string; name?: string; avatar_id?: string; description?: string }): Promise<PersonalAppCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createPersonalApp(this._config, token, opts);
  }

  async updatePersonalApp(appId: string, opts: { user_token: string; name: string; avatar_id?: string; description?: string }): Promise<PersonalAppInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updatePersonalApp(this._config, token, appId, opts);
  }

  async fetchPersonalApp(appId: string, opts?: { user_token?: string }): Promise<PersonalAppInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchPersonalApp(this._config, token, appId, { ...opts, fetchFn: this._fetchFn! });
  }

  async deletePersonalApp(appId: string, opts?: { user_token?: string }): Promise<PersonalAppInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deletePersonalApp(this._config, token, appId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchPersonalAppList(opts?: { user_token?: string }): Promise<PersonalAppListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchPersonalAppList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchChatList(opts?: { chat_type?: number; keyword?: string; start_time?: number; end_time?: number; user_token?: string }): Promise<ChatListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchChatList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchChatMessages(opts?: { staff_id?: string; group_id?: string; page_size?: number; base_version?: string; start_time?: number; end_time?: number; sender_id?: string; user_token?: string }): Promise<ChatMessagesResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchChatMessages(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  static parseCallbackPayload(encryptedData: string, opts?: { encoding_key?: string; verify_signature?: boolean; timestamp?: string; nonce?: string; signature?: string; callback_token?: string; known_app_id?: string }): CallbackEvent[] {
    return parseCallbackPayload(encryptedData, { encodingKey: opts?.encoding_key || "", verifySignature: opts?.verify_signature || false, timestamp: opts?.timestamp || "", nonce: opts?.nonce || "", signature: opts?.signature || "", callbackToken: opts?.callback_token || "", knownAppId: opts?.known_app_id || "" });
  }

  parseCallback(encryptedData: string, opts?: { verify_signature?: boolean; timestamp?: string; nonce?: string; signature?: string; known_app_id?: string }): CallbackEvent[] {
    return parseCallbackPayload(encryptedData, { encodingKey: this._config.encoding_key, verifySignature: opts?.verify_signature || false, timestamp: opts?.timestamp || "", nonce: opts?.nonce || "", signature: opts?.signature || "", callbackToken: this._config.callback_token, knownAppId: opts?.known_app_id || "" });
  }

  static verifyCallbackSignature(timestamp: string, nonce: string, signature: string, encodingKey: string, opts?: { data_encrypt?: string; callback_token?: string }): boolean {
    return verifyCallbackSignature(timestamp, nonce, signature, encodingKey, opts?.data_encrypt || "", opts?.callback_token || "");
  }

  verifyCallback(timestamp: string, nonce: string, signature: string, opts?: { data_encrypt?: string }): boolean {
    return verifyCallbackSignature(timestamp, nonce, signature, this._config.encoding_key, opts?.data_encrypt || "", this._config.callback_token);
  }

  static getCallbackEventTypes(): Record<string, string> {
    return getCallbackEventTypes();
  }

  // ── Videoconference (视频会议开放能力, /xtra/videoconference/openapi/v1) ──

  async createVideoconferenceMeeting(opts: { subject: string; start_time: number; members: AnyDict[]; org_id: string | number; auto_record?: number; type?: number; group_new?: number; conf_password?: string; control_password?: string; mask_type?: number; ext_attr?: string; join_mute?: number; open_mute?: number; enable_pre_join?: number; user_stop_time?: number; invite_admin?: number; user_token?: string }): Promise<VideoconferenceDetailResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createMeeting(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async modifyVideoconferenceMeeting(opts: { mid: string | number; subject: string; start_time: number; members: AnyDict[]; org_id: string | number; operator: string; auto_record?: number; type?: number; group_new?: number; conf_password?: string; control_password?: string; user_stop_time?: number; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return modifyMeeting(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async cancelVideoconferenceMeeting(opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return cancelMeeting(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async stopVideoconferenceMeeting(opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return stopMeeting(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceDetail(opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceDetailResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingDetail(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceMeetingList(opts: { org_id: string | number; start_time: number; end_time: number; fetch_range?: string; staff_id?: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceRecordList(opts: { org_id: string | number; start_time: number; end_time: number; admin?: string; create_source?: number; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingRecordList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceSimplerecord(opts: { mid: string | number; org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMemberSimplerecord(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceFixroomList(opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchFixroomList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceStatus(opts: { mids: (string | number)[]; org_id: string | number; user_token?: string }): Promise<VideoconferenceStatusListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingStatus(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async subscribeVideoconferenceEvents(opts: { mid: string | number; org_id: string | number; events: AnyDict[]; call_back_info?: string; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return subscribeMeetingEvents(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceParams(opts: { meeting_number: string; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceParamResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingParams(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceHistory(opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchHistoryMeetings(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceActive(opts: { org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchActiveMeetings(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async controlVideoconferenceMember(opts: { mid: string | number; staff_id: string; op_code: string; operator: string; org_id: string | number; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return controlMeetingMember(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async inviteVideoconferenceMembers(opts: { meeting_number: string; members: AnyDict[]; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceOpResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return inviteMeetingMembers(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceMemberList(opts: { mid: string | number; org_id: string | number; operator: string; limit?: number; offset?: number; user_token?: string }): Promise<VideoconferenceListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchMeetingMemberList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceVodList(opts: { mid: string | number; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceVodListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchVodList(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceVodDownloadUrls(opts: { vods: AnyDict[]; org_id: string | number; operator: string; user_token?: string }): Promise<VideoconferenceVodUrlResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchVodDownloadUrls(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchVideoconferenceConf(opts: { org_id: string | number; meeting_number?: string; operator?: string; user_token?: string }): Promise<VideoconferenceConfResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchOrgVideoconfConf(this._config, token, { ...opts, fetchFn: this._fetchFn! });
  }
}
