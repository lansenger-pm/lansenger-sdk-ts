import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { ChatListResult, ChatMessagesResult, ChatStaffInfo, ChatGroupInfo, ChatMessageInfo } from "./models";

export async function fetchChatList(
  config: LansengerConfig,
  appToken: string,
  opts?: { chat_type?: number; keyword?: string; start_time?: number; end_time?: number; user_token?: string; fetchFn?: FetchFn },
): Promise<ChatListResult> {
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "chats", "fetch", appToken, { userToken });
  const payload: Record<string, any> = {};
  if (opts?.chat_type != null) payload.chatType = opts.chat_type;
  if (opts?.keyword) payload.keyword = opts.keyword;
  if (opts?.start_time != null) payload.startTime = opts.start_time;
  if (opts?.end_time != null) payload.endTime = opts.end_time;
  const [data, httpErr] = await doPost(url, payload, opts?.fetchFn);
  if (httpErr) return new ChatListResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new ChatListResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const rd = data!.data || {};
  const staffInfos: ChatStaffInfo[] = [];
  for (const si of (rd.staffIdInfos || [])) {
    staffInfos.push(new ChatStaffInfo({
      staff_id: si.staffId || "", staff_name: si.staffName || "",
      sector_names: si.sectorName || si.sectorNames,
    }));
  }
  const groupInfos: ChatGroupInfo[] = [];
  for (const gi of (rd.groupIdInfos || [])) {
    groupInfos.push(new ChatGroupInfo({ group_id: gi.groupId || "", group_name: gi.groupName || "" }));
  }
  return new ChatListResult({ success: true, staff_infos: staffInfos, group_infos: groupInfos, raw_response: data! });
}

export async function fetchChatMessages(
  config: LansengerConfig,
  appToken: string,
  opts?: {
    staff_id?: string; group_id?: string; page_size?: number;
    base_version?: string; start_time?: number; end_time?: number;
    sender_id?: string; user_token?: string; fetchFn?: FetchFn;
  },
): Promise<ChatMessagesResult> {
  if (!opts?.staff_id && !opts?.group_id)
    return new ChatMessagesResult({ success: false, error: "staff_id or group_id is required" });
  const userToken = opts?.user_token || "";
  const pageSize = opts?.page_size || 100;
  const baseVersion = opts?.base_version || "0";
  let url = buildApiUrl(config, "chats", "messages_fetch", appToken, { userToken })
    + `&page_size=${pageSize}`;
  if (baseVersion) url += `&base_version=${baseVersion}`;
  const payload: Record<string, any> = {};
  if (opts?.staff_id) payload.staffId = opts.staff_id;
  if (opts?.group_id) payload.groupId = opts.group_id;
  if (opts?.start_time != null) payload.startTime = opts.start_time;
  if (opts?.end_time != null) payload.endTime = opts.end_time;
  if (opts?.sender_id) payload.senderId = opts.sender_id;
  const [data, httpErr] = await doPost(url, payload, opts?.fetchFn);
  if (httpErr) return new ChatMessagesResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new ChatMessagesResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const rd = data!.data || {};
  const messages: ChatMessageInfo[] = [];
  for (const msgItem of (rd.messageList || [])) {
    const msgInfoRaw = msgItem.messageInfo || msgItem.messageInfos || {};
    const mi = Array.isArray(msgInfoRaw) && msgInfoRaw.length > 0 ? msgInfoRaw[0] : msgInfoRaw;
    const content = mi.content || null;
    messages.push(new ChatMessageInfo({
      send_time: mi.sendTime || "", sender: mi.sender || "",
      message_type: mi.messageType || "", content,
    }));
  }
  return new ChatMessagesResult({
    success: true, has_more: rd.hasMore || false, total: rd.total || 0,
    last_version: rd.lastVersion || "", name: rd.name || "",
    chat_type: rd.chatType || "", messages, raw_response: data!,
  });
}