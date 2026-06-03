import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { UserMessageResult } from "./models";

export async function sendUserMessage(
  config: LansengerConfig,
  appToken: string,
  userToken: string,
  receiverId: string,
  msgType: string,
  msgData: Record<string, any>,
  opts?: { common?: Record<string, any>; uuid?: string; fetchFn?: FetchFn },
): Promise<UserMessageResult> {
  if (!userToken) return new UserMessageResult({ success: false, error: "user_token is required for user private chat messages" });
  if (!receiverId) return new UserMessageResult({ success: false, error: "receiver_id is required" });
  if (!msgType) return new UserMessageResult({ success: false, error: "msg_type is required" });
  if (!msgData) return new UserMessageResult({ success: false, error: "msg_data is required" });
  const url = buildApiUrl(config, "user_message", "create", appToken, { userToken });
  const finalMsgData: Record<string, any> = { ...msgData };
  if (opts?.common) finalMsgData.common = opts.common;
  const payload: Record<string, any> = { receiverId, msgType, msgData: finalMsgData };
  if (opts?.uuid) payload.uuid = opts.uuid;
  const [data, httpErr] = await doPost(url, payload, opts?.fetchFn);
  if (httpErr) return new UserMessageResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new UserMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new UserMessageResult({ success: true, message_id: d.msgId, raw_response: data! });
}