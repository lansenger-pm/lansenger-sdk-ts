import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { SendMessageResult } from "./models";

export async function sendGroupMessage(
  config: LansengerConfig,
  appToken: string,
  groupId: string,
  msgType: string,
  msgData: Record<string, any>,
  opts?: { user_token?: string; sender_id?: string; outlines?: string; uuid?: string; entry_id?: string; refMsgId?: string; fetchFn?: FetchFn },
): Promise<SendMessageResult> {
  if (!msgType) return new SendMessageResult({ success: false, error: "msg_type is required" });
  if (!groupId) return new SendMessageResult({ success: false, error: "group_id is required" });
  if (!msgData) return new SendMessageResult({ success: false, error: "msg_data is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "smart_bot", "group_message", appToken, { userToken });
  const payload: Record<string, any> = { groupId, msgType, msgData };
  if (opts?.sender_id) payload.senderId = opts.sender_id;
  if (opts?.outlines) payload.outlines = opts.outlines;
  if (opts?.uuid) payload.uuid = opts.uuid;
  if (opts?.entry_id) payload.entryId = opts.entry_id;
  if (opts?.refMsgId) payload.refMsgId = opts.refMsgId;
  const [data, httpErr] = await doPost(url, payload, opts?.fetchFn);
  if (httpErr) return new SendMessageResult({ success: false, error: httpErr, retryable: true });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new SendMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}`, retryable: true });
  }
  const d = data!.data || {};
  return new SendMessageResult({
    success: true, message_id: d.msgId, msg_type: msgType,
    operation: "group_message", raw_response: data!,
  });
}