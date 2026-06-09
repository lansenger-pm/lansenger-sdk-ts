import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { SendMessageResult } from "./models";
import { REMINDER_TYPE_NONE, REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS, REMINDER_TYPE_PHONE } from "./constants";

export { REMINDER_TYPE_NONE, REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS, REMINDER_TYPE_PHONE };

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