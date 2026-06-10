import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { LansengerConfig } from "./config";
import { TokenManager, UserTokenManager } from "./auth";
import { CredentialStore } from "./persistence";
import { doGet, doPost, FetchFn } from "./http";
import { buildApiUrl } from "./urlHelpers";
import { APP_MEDIA_TYPE_IMAGE, APP_MEDIA_TYPE_FILE, guessMediaType, guessAppMediaType } from "./constants";
import { LansengerAPIError, LansengerAuthError, LansengerConfigError, LansengerFileError } from "./exceptions";
import {
  SendMessageResult, AppCardParams, LinkCardParams, OaCardParams,
  DynamicCardUpdateParams, QueryGroupsResult, UploadMediaResult,
  DownloadMediaResult, UserTokenResult, UserInfoResult,
  StaffBasicInfoResult, StaffDetailResult, DepartmentAncestorsResult,
  StaffIdMappingResult, ExtraFieldIdsResult, OrgInfoResult, StaffSearchResult,
  BotMessageResult, AccountMessageResult, UserMessageResult,
  StreamMessageResult, CreateGroupResult, GroupInfoResult,
  GroupMemberResult, GroupListResult, IsInGroupResult,
  UpdateGroupResult, UpdateGroupMembersResult, DepartmentDetailResult,
  DepartmentChildrenResult, DepartmentStaffsResult,
  TodoTaskCreateResult, TodoTaskInfoResult, TodoTaskListResult,
  TodoTaskStatusCountResult, TodoTaskExecutorListResult,
  CalendarPrimaryResult, ScheduleCreateResult, ScheduleInfoResult,
  ScheduleUpdateResult, ScheduleListResult, ScheduleAttendeesResult,
  ScheduleAttendeeMetaResult, ChatListResult, ChatMessagesResult,
  MediaPathResult,
} from "./models";
import { fetchStaffBasicInfo, fetchStaffDetail, fetchDepartmentAncestors, fetchStaffIdMapping, fetchOrgExtraFieldIds, searchStaff, fetchOrgInfo } from "./contacts";
import { fetchDepartmentDetail, fetchDepartmentChildren, fetchDepartmentStaffs } from "./departments";
import { createGroup, fetchGroupInfo, fetchGroupMembers, fetchGroupList, checkIsInGroup, updateGroupInfo, updateGroupMembers, dismissGroup } from "./groups";
import { buildAuthorizeUrl, exchangeCodeForUserToken, refreshUserToken, parseAuthorizeCallback, validateCallbackState } from "./oauth";
import { fetchUserInfo } from "./users";
import { createStreamMessage, fetchStreamMessage } from "./streaming";
import { createSchedule, fetchSchedule, deleteSchedule, updateSchedule, fetchScheduleList, fetchScheduleAttendees, addScheduleAttendees, deleteScheduleAttendees, updateScheduleAttendeeMeta, fetchPrimaryCalendar } from "./calendars";
import { createTodoTask, updateTodoTask, updateTodoTaskStatus, deleteTodoTask, fetchTodoTaskList, fetchTodoTaskBySourceId, fetchTodoTaskById, fetchTodoTaskStatusCounts, updateExecutorStatus, addExecutors, deleteExecutors, fetchExecutorList } from "./todos";
import { fetchChatList, fetchChatMessages } from "./chats";
import { sendAccountMessage } from "./accountMessages";
import { sendUserMessage } from "./userMessages";
import { sendGroupMessage } from "./groupMessages";
import { sendReminder } from "./reminders";
import { uploadMedia, uploadAppMedia, downloadMedia, downloadMediaToFile, fetchMediaPath } from "./media";
import { parseCallbackPayload, verifyCallbackSignature, getCallbackEventTypes, CallbackEvent } from "./callbacks";

type AnyDict = Record<string, any>;

function _parseSendResponse(data: AnyDict, msgType: string = "", operation: string = ""): SendMessageResult {
  const errCode = data.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data.errMsg || "Unknown error";
    return new SendMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}`, msg_type: msgType, operation, retryable: true });
  }
  const d = data.data || {};
  return new SendMessageResult({ success: true, message_id: d.msgId, msg_type: msgType, operation, raw_response: data });
}

export class LansengerClient {
  private _config: LansengerConfig;
  private _fetchFn: FetchFn | undefined = undefined;
  private _tokenManager: TokenManager | null = null;
  private _userTokenManager: UserTokenManager | null = null;
  private _store: CredentialStore | null = null;

  constructor(
    appId: string,
    appSecret: string,
    apiGatewayUrl: string = "https://open.e.lanxin.cn/open/apigw",
    passportUrl: string = "",
    httpTimeout: number = 30,
    storePath?: string,
    encodingKey: string = "",
    callbackToken: string = "",
    redirectUri: string = "",
  ) {
    this._config = new LansengerConfig(appId, appSecret, apiGatewayUrl, passportUrl, httpTimeout, encodingKey, callbackToken, redirectUri);
    if (storePath) {
      this._store = new CredentialStore(storePath);
    }
  }

  static fromEnv(storePath?: string): LansengerClient {
    const config = LansengerConfig.fromEnv();
    return new LansengerClient(config.app_id, config.app_secret, config.api_gateway_url, config.passport_url, config.http_timeout, storePath, config.encoding_key, config.callback_token, config.redirect_uri);
  }

  static fromConfig(config: LansengerConfig, storePath?: string): LansengerClient {
    return new LansengerClient(config.app_id, config.app_secret, config.api_gateway_url, config.passport_url, config.http_timeout, storePath, config.encoding_key, config.callback_token, config.redirect_uri);
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

  async getUserToken(): Promise<string> {
    await this._ensureInit();
    return this._userTokenManager!.getToken();
  }

  async setUserTokens(userToken: string, refreshToken: string, expiresIn: number = 7200, staffId: string = ""): Promise<void> {
    await this._ensureInit();
    this._userTokenManager!.setTokens(userToken, refreshToken, expiresIn, staffId);
  }

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

  private async _sendPrivate(chatId: string, msgType: string, msgData: AnyDict): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = this._privateMsgUrl(token);
    const payload: AnyDict = { userIdList: [chatId], msgType, msgData };
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: msgType, operation: "private_message" });
    return _parseSendResponse(data!, msgType, "private_message");
  }

  private async _sendGroup(groupId: string, msgType: string, msgData: AnyDict, opts?: { userToken?: string; senderId?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = this._groupMsgUrl(token);
    const payload: AnyDict = { groupId, msgType, msgData };
    if (opts?.userToken) payload.userToken = opts.userToken;
    if (opts?.senderId) payload.senderId = opts.senderId;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: msgType, operation: "group_message", retryable: true });
    return _parseSendResponse(data!, msgType, "group_message");
  }

  async sendText(chatId: string, content: string, opts?: { file_path?: string; media_type?: string; cover_image_path?: string; reminder_all?: boolean; reminder_user_ids?: string[]; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const textObj: AnyDict = { content };
    if (opts?.reminder_all || opts?.reminder_user_ids) {
      const reminder: AnyDict = {};
      if (opts?.reminder_all) reminder.all = true;
      if (opts?.reminder_user_ids) reminder.userIds = opts.reminder_user_ids;
      textObj.reminder = reminder;
    }
    if (opts?.file_path) {
      await this._ensureInit();
      const mt = opts.media_type || guessAppMediaType(opts.file_path) || APP_MEDIA_TYPE_FILE;
      const mediaResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, opts.file_path, mt);
      if (!mediaResult.success) return new SendMessageResult({ success: false, error: mediaResult.error });
      textObj.mediaType = mt;
      textObj.mediaIds = [mediaResult.media_id];
      if (opts.cover_image_path) {
        const coverResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, opts.cover_image_path, APP_MEDIA_TYPE_IMAGE);
        if (!coverResult.success) return new SendMessageResult({ success: false, error: coverResult.error });
        textObj.coverMediaIds = [coverResult.media_id];
      }
    }
    const msgData: AnyDict = { text: textObj };
    const isGroup = opts?.is_group || false;
    if (isGroup) return this._sendGroup(chatId, "text", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "" });
    return this._sendPrivate(chatId, "text", msgData);
  }

  async sendMarkdown(chatId: string, content: string, opts?: { reminder_all?: boolean; reminder_user_ids?: string[]; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    const formatTextObj: AnyDict = { formatType: 1, text: content };
    if (opts?.reminder_all || opts?.reminder_user_ids) {
      const reminder: AnyDict = {};
      if (opts?.reminder_all) reminder.all = true;
      if (opts?.reminder_user_ids) reminder.userIds = opts.reminder_user_ids;
      formatTextObj.reminder = reminder;
    }
    const msgData: AnyDict = { formatText: formatTextObj };
    const isGroup = opts?.is_group || false;
    if (isGroup) return this._sendGroup(chatId, "formatText", msgData, { userToken: opts?.user_token || "", senderId: opts?.sender_id || "" });
    return this._sendPrivate(chatId, "formatText", msgData);
  }

  async sendFile(chatId: string, filePath: string, opts?: { caption?: string; media_type?: string; cover_image_path?: string; is_group?: boolean; user_token?: string; sender_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const mediaType = opts?.media_type || guessAppMediaType(filePath) || APP_MEDIA_TYPE_FILE;
    const uploadResult = await uploadAppMedia(this._config, this._tokenManager!, this._fetchFn!, filePath, mediaType);
    if (!uploadResult.success) return new SendMessageResult({ success: false, error: uploadResult.error });
    const textObj: AnyDict = { content: opts?.caption || "", mediaType, mediaIds: [uploadResult.media_id] };
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
      const textObj: AnyDict = { content: opts?.caption || "", mediaType: APP_MEDIA_TYPE_IMAGE, mediaIds: [uploadResult.media_id] };
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

  async updateDynamicCard(msgId: string, opts?: { head_status_info?: AnyDict; links?: AnyDict[]; is_last_update?: boolean }): Promise<SendMessageResult> {
    const params = new DynamicCardUpdateParams({
      msg_id: msgId, head_status_info: opts?.head_status_info,
      links: opts?.links, is_last_update: opts?.is_last_update || false,
    });
    return this.updateDynamicCardWithParams(params);
  }

  async updateDynamicCardWithParams(params: DynamicCardUpdateParams): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = buildApiUrl(this._config, "message", "dynamic_update", token);
    const appCardUpdateMsg: AnyDict = { isLastUpdate: params.is_last_update };
    if (params.head_status_info) appCardUpdateMsg.headStatusInfo = params.head_status_info;
    if (params.links) appCardUpdateMsg.links = params.links;
    const payload: AnyDict = { msgId: params.msg_id, msgType: "appCard", msgData: { appCardUpdateMsg } };
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, msg_type: "dynamic_update" });
    return _parseSendResponse(data!, "dynamic_update", "update_dynamic_card");
  }

  async revokeMessage(messageIds: string[], opts?: { chat_type?: string; sender_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const url = buildApiUrl(this._config, "message", "revoke", token);
    const payload: AnyDict = { messageIds, chatType: opts?.chat_type || "bot" };
    if (opts?.sender_id) payload.senderId = opts.sender_id;
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new SendMessageResult({ success: false, error: httpErr, operation: "revoke_message" });
    return _parseSendResponse(data!, "", "revoke_message");
  }

  async queryGroups(opts?: { page_offset?: number; page_size?: number }): Promise<QueryGroupsResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    const pageOffset = opts?.page_offset ?? 0;
    const pageSize = opts?.page_size || 100;
    const url = buildApiUrl(this._config, "groups", "fetch", token, { 
      queryParams: { page_offset: pageOffset, page_size: pageSize }
    });
    const [data, httpErr] = await doGet(url, this._fetchFn);
    if (httpErr) return new QueryGroupsResult({ success: false, error: httpErr });
    const errCode = data!.errCode ?? -1;
    if (errCode !== 0) {
      const msg = data!.errMsg || "Unknown error";
      return new QueryGroupsResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
    }
    const d = data!.data || {};
    return new QueryGroupsResult({
      success: true, total_group_ids: d.totalGroupIds || 0,
      group_ids: d.groupIds || [], raw_response: data!,
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

  async downloadMediaFile(mediaId: string): Promise<DownloadMediaResult> {
    await this._ensureInit();
    return downloadMedia(this._config, this._tokenManager!, this._fetchFn!, mediaId);
  }

  async downloadMediaToFile(mediaId: string, opts?: { target_path?: string; media_type?: string }): Promise<string> {
    await this._ensureInit();
    return downloadMediaToFile(this._config, this._tokenManager!, this._fetchFn!, mediaId, opts?.target_path, opts?.media_type || "file");
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

  async sendBotMessage(msgType: string, msgData: AnyDict, chatIds?: string[], departmentIds?: string[], opts?: { user_token?: string; entry_id?: string; is_group?: boolean }): Promise<BotMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    if (opts?.is_group && chatIds && chatIds.length > 0) {
      const results: SendMessageResult[] = [];
      for (const gid of chatIds) {
        results.push(await sendGroupMessage(this._config, token, gid, msgType, msgData, { user_token: opts?.user_token || "", fetchFn: this._fetchFn! }));
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
    const [data, httpErr] = await doPost(url, payload, this._fetchFn);
    if (httpErr) return new BotMessageResult({ success: false, error: httpErr });
    const errCode = data!.errCode ?? -1;
    if (errCode !== 0) {
      const msg = data!.errMsg || "Unknown error";
      return new BotMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
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

  async sendGroupMessage(groupId: string, msgType: string, msgData: AnyDict, opts?: { user_token?: string; sender_id?: string; reminder_all?: boolean; reminder_user_ids?: string[]; outlines?: string; uuid?: string; entry_id?: string }): Promise<SendMessageResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return sendGroupMessage(this._config, token, groupId, msgType, msgData, { user_token: opts?.user_token || "", sender_id: opts?.sender_id || "", outlines: opts?.outlines || "", uuid: opts?.uuid || "", entry_id: opts?.entry_id || "", fetchFn: this._fetchFn! });
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

  async createTodoTask(title: string, link: string, pcLink: string, executorIds: string[], orgId: string, type: number = 1, opts?: { source_id?: string; desc?: string; sender_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return createTodoTask(this._config, token, title, link, pcLink, executorIds, orgId, type, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateTodoTask(todotaskId: string, title: string, link: string, pcLink: string, orgId: string, opts?: { desc?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateTodoTask(this._config, token, todotaskId, title, link, pcLink, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateTodoTaskStatus(todotaskId: string, status: string, orgId: string, opts?: { staff_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateTodoTaskStatus(this._config, token, todotaskId, status, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async deleteTodoTask(todotaskId: string, orgId: string, opts?: { staff_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deleteTodoTask(this._config, token, todotaskId, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchTodoTaskList(orgId: string, opts?: { app_ids?: string[]; staff_id?: string; status_list?: string[]; user_token?: string }): Promise<TodoTaskListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchTodoTaskList(this._config, token, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchTodoTaskBySourceId(sourceId: string, orgId: string, opts?: { staff_id?: string; user_token?: string }): Promise<TodoTaskInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchTodoTaskBySourceId(this._config, token, sourceId, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchTodoTaskById(todotaskId: string, orgId: string, opts?: { staff_id?: string; user_token?: string }): Promise<TodoTaskInfoResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchTodoTaskById(this._config, token, todotaskId, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchTodoTaskStatusCounts(staffId: string, orgId: string, opts?: { app_id?: string; status_list?: string[]; user_token?: string }): Promise<TodoTaskStatusCountResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchTodoTaskStatusCounts(this._config, token, staffId, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async updateExecutorStatus(executorStatusList: AnyDict[], orgId: string, opts?: { todotask_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return updateExecutorStatus(this._config, token, executorStatusList, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async addExecutors(executorIds: string[], orgId: string, opts?: { todotask_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return addExecutors(this._config, token, executorIds, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async deleteExecutors(executorIds: string[], orgId: string, opts?: { todotask_id?: string; user_token?: string }): Promise<TodoTaskCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return deleteExecutors(this._config, token, executorIds, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchExecutorList(todotaskId: string, orgId: string, opts?: { staff_id?: string; status_list?: string[]; user_token?: string }): Promise<TodoTaskExecutorListResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchExecutorList(this._config, token, todotaskId, orgId, { ...opts, fetchFn: this._fetchFn! });
  }

  async fetchPrimaryCalendar(opts?: { user_token?: string; user_id?: string }): Promise<CalendarPrimaryResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
    return fetchPrimaryCalendar(this._config, token, { user_token: opts?.user_token || "", user_id: opts?.user_id || "", fetchFn: this._fetchFn! });
  }

  async createSchedule(calendarId: string, summary: string, startTime: AnyDict, endTime: AnyDict, attendees: AnyDict[], opts?: { description?: string; all_day?: string; repeat_type?: string; rule?: string; expire_date_type?: string; reminder_type?: string; attendee_permissions?: string; user_token?: string; user_id?: string }): Promise<ScheduleCreateResult> {
    await this._ensureInit();
    const token = await this._tokenManager!.getToken();
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
}