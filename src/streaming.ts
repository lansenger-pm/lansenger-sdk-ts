import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { StreamMessageResult } from "./models";

export async function createStreamMessage(
  config: LansengerConfig,
  appToken: string,
  receiverId: string,
  receiverType: string,
  streamId: string,
  opts?: { fetchFn?: FetchFn },
): Promise<StreamMessageResult> {
  if (!receiverId) return new StreamMessageResult({ success: false, error: "receiver_id is required" });
  if (!receiverType) return new StreamMessageResult({ success: false, error: "receiver_type is required" });
  if (!streamId) return new StreamMessageResult({ success: false, error: "stream_id is required" });
  const url = buildApiUrl(config, "sse", "msg_create", appToken);
  const body = { receiverId, receiverType, streamId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new StreamMessageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StreamMessageResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StreamMessageResult({ success: true, message_id: d.msgId, raw_response: data! });
}

export async function fetchStreamMessage(
  config: LansengerConfig,
  appToken: string,
  msgId: string,
  opts?: { fetchFn?: FetchFn },
): Promise<StreamMessageResult> {
  if (!msgId) return new StreamMessageResult({ success: false, error: "msg_id is required" });
  const url = buildApiUrl(config, "sse", "msg_fetch", appToken);
  const body = { msgId };
  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new StreamMessageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new StreamMessageResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new StreamMessageResult({ success: true, message_id: d.msgId, raw_response: data! });
}