import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { SendMessageResult } from "./models";

export const REMINDER_TYPE_NONE = 0;
export const REMINDER_TYPE_POPUP = 1;
export const REMINDER_TYPE_SMS = 2;
export const REMINDER_TYPE_PHONE = 3;

export async function sendReminder(
  config: LansengerConfig,
  appToken: string,
  msgId: string,
  reminderTypes: number[],
  userIdList: string[],
  opts?: { fetchFn?: FetchFn },
): Promise<SendMessageResult> {
  if (!msgId) return new SendMessageResult({ success: false, error: "msg_id is required" });
  if (!reminderTypes || !reminderTypes.length) return new SendMessageResult({ success: false, error: "reminder_types is required" });
  if (!userIdList || !userIdList.length) return new SendMessageResult({ success: false, error: "user_id_list is required" });
  const url = buildApiUrl(config, "message", "reminder_create", appToken);
  const body: Record<string, any> = { msgId, reminderTypes, userIdList };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new SendMessageResult({ success: false, error: httpErr, retryable: true });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new SendMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}`, operation: "send_reminder", retryable: true });
  }
  return new SendMessageResult({ success: true, operation: "send_reminder", raw_response: data! });
}