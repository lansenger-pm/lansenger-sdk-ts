import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { AccountMessageResult } from "./models";

export async function sendAccountMessage(
  config: LansengerConfig,
  appToken: string,
  msgType: string,
  msgData: Record<string, any>,
  opts?: {
    chat_ids?: string[]; department_ids?: string[]; account_id?: string;
    entry_id?: string; attach?: string; user_token?: string; fetchFn?: FetchFn;
  },
): Promise<AccountMessageResult> {
  if (!msgType) return new AccountMessageResult({ success: false, error: "msg_type is required" });
  if (!opts?.chat_ids && !opts?.department_ids)
    return new AccountMessageResult({ success: false, error: "at least one of chat_ids or department_ids is required" });
  if (!msgData) return new AccountMessageResult({ success: false, error: "msg_data is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "account_message", "create", appToken, { userToken });
  const payload: Record<string, any> = {
    userIdList: opts?.chat_ids || [], departmentIdList: opts?.department_ids || [],
    msgType, msgData,
  };
  if (opts?.account_id) payload.accountId = opts.account_id;
  if (opts?.entry_id) payload.entryId = opts.entry_id;
  if (opts?.attach) payload.attach = opts.attach;
  const [data, httpErr] = await doPost(url, payload, opts?.fetchFn);
  if (httpErr) return new AccountMessageResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new AccountMessageResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new AccountMessageResult({
    success: true, message_id: d.msgId,
    invalid_staff: d.invalidStaff, invalid_department: d.invalidDepartment,
    raw_response: data!,
  });
}