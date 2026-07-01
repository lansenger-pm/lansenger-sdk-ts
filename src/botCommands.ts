import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { BotCommandResult, BotCommandQueryResult } from "./models";

export async function createBotCommands(
  config: LansengerConfig,
  appToken: string,
  scopeType: number,
  commands: Record<string, any>[],
  opts?: { chat_id?: string; chat_type?: string; staff_id?: string; fetchFn?: FetchFn },
): Promise<BotCommandResult> {
  if (scopeType < 1 || scopeType > 7) return new BotCommandResult({ success: false, error: "scope_type must be 1-7" });
  if (!commands || !commands.length) return new BotCommandResult({ success: false, error: "commands is required" });

  const url = buildApiUrl(config, "bot_commands", "create", appToken);

  const body: Record<string, any> = { scopeType, commands };
  if (opts?.chat_id) body.chatId = opts.chat_id;
  if (opts?.chat_type) body.chatType = opts.chat_type;
  if (opts?.staff_id) body.staffId = opts.staff_id;

  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new BotCommandResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BotCommandResult({ success: false, error: apiErr });
  return new BotCommandResult({ success: true, raw_response: data! });
}

export async function fetchBotCommands(
  config: LansengerConfig,
  appToken: string,
  scopeType: number,
  opts?: { chat_id?: string; chat_type?: string; staff_id?: string; fetchFn?: FetchFn },
): Promise<BotCommandQueryResult> {
  if (scopeType < 1 || scopeType > 7) return new BotCommandQueryResult({ success: false, error: "scope_type must be 1-7" });

  const url = buildApiUrl(config, "bot_commands", "fetch", appToken);

  const body: Record<string, any> = { scopeType };
  if (opts?.chat_id) body.chatId = opts.chat_id;
  if (opts?.chat_type) body.chatType = opts.chat_type;
  if (opts?.staff_id) body.staffId = opts.staff_id;

  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new BotCommandQueryResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BotCommandQueryResult({ success: false, error: apiErr });

  const d = data!.data || {};
  return new BotCommandQueryResult({
    success: true,
    scope_type: d.scopeType ?? null,
    chat_id: d.chatId ?? null,
    chat_type: d.chatType ?? null,
    staff_id: d.staffId ?? null,
    commands: d.commands ?? null,
    raw_response: data!,
  });
}

export async function deleteBotCommands(
  config: LansengerConfig,
  appToken: string,
  scopeType: number,
  opts?: { chat_id?: string; chat_type?: string; staff_id?: string; fetchFn?: FetchFn },
): Promise<BotCommandResult> {
  if (scopeType < 1 || scopeType > 7) return new BotCommandResult({ success: false, error: "scope_type must be 1-7" });

  const url = buildApiUrl(config, "bot_commands", "delete", appToken);

  const body: Record<string, any> = { scopeType };
  if (opts?.chat_id) body.chatId = opts.chat_id;
  if (opts?.chat_type) body.chatType = opts.chat_type;
  if (opts?.staff_id) body.staffId = opts.staff_id;

  const [data, httpErr] = await doPost(url, body, opts?.fetchFn);
  if (httpErr) return new BotCommandResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new BotCommandResult({ success: false, error: apiErr });
  return new BotCommandResult({ success: true, raw_response: data! });
}
