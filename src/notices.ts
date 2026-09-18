// Lansenger notice API — send official-account notices and query notice accounts (通知系统).
//
// Endpoints:
// - POST /xtra/notice/server/openapi/v1/send           — send a notice via an official account
// - POST /xtra/notice/server/openapi/v1/notice/account — list official accounts of an organization
//
// Paths carry a /server segment (production stage; dev/test environments omit it).
// When user_token is provided, create_mobile / create_user_id may be omitted.
// The module has no revoke/delete interface.

import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import { NoticeSendResult, NoticeAccountListResult } from "./models";

export const NOTICE_CONTENT_TYPE_TEXT = 1;
export const NOTICE_CONTENT_TYPE_LINK = 2;

export const NOTICE_USER_TYPE_PHONE = 1;   // target users by mobile number (phoneUserRange)
export const NOTICE_USER_TYPE_OPENID = 2;  // target users by staffId/department (openUserRange)

export const NOTICE_RANGE_OBJ_TYPE_STAFF = 1;
export const NOTICE_RANGE_OBJ_TYPE_DEPARTMENT = 2;

export const NOTICE_PHONE_RANGE_MAX = 10;   // releaseRangeList / ccRangeList phone limit
export const NOTICE_OPEN_RANGE_MAX = 200;   // releaseRangeList / ccRangeList staff limit

export const NOTICE_REMIND_AFTER_TYPES = ["never", "unOperate", "count"];
export const NOTICE_REMIND_RANGE_TYPES = ["all", "receiver", "partialRemind", "notReminder"];

export async function sendNotice(
  config: LansengerConfig,
  appToken: string,
  params: {
    title: string;
    content_type: number;
    account_code: string;
    user_type: number;
    content?: string;
    notice_link?: string;
    notice_location?: string;
    latitude?: number;
    longitude?: number;
    release_phones?: string[];
    cc_phones?: string[];
    release_range?: Record<string, any>[];
    cc_staff_ids?: string[];
    create_mobile?: string;
    create_user_id?: string;
    resource_list?: Record<string, any>[];
    extend_id?: string;
    confirm_flag?: number;
    forward_flag?: number;
    reply_flag?: number;
    anonymous_flag?: number;
    remind_status?: number;
    remind_msg_type?: string;
    at_once_flag?: number;
    remind_after_type?: string;
    remind_max_count?: number;
    remind_interval_time?: number;
    remind_interval_time_duration?: string;
    remind_range_type?: string;
    remind_range_staff_ids?: string[];
    user_token?: string;
    fetchFn?: FetchFn;
  },
): Promise<NoticeSendResult> {
  if (!params.title) return new NoticeSendResult({ success: false, error: "title is required" });
  if (params.content_type !== NOTICE_CONTENT_TYPE_TEXT && params.content_type !== NOTICE_CONTENT_TYPE_LINK)
    return new NoticeSendResult({ success: false, error: "content_type must be 1 (text) or 2 (link)" });
  if (params.content_type === NOTICE_CONTENT_TYPE_TEXT && !params.content)
    return new NoticeSendResult({ success: false, error: "content is required when content_type is 1 (text)" });
  if (params.content_type === NOTICE_CONTENT_TYPE_LINK && !params.notice_link)
    return new NoticeSendResult({ success: false, error: "notice_link is required when content_type is 2 (link)" });
  if (!params.account_code) return new NoticeSendResult({ success: false, error: "account_code is required" });
  if (params.user_type !== NOTICE_USER_TYPE_PHONE && params.user_type !== NOTICE_USER_TYPE_OPENID)
    return new NoticeSendResult({ success: false, error: "user_type must be 1 (phone) or 2 (openid)" });

  if (params.user_type === NOTICE_USER_TYPE_PHONE) {
    if (!params.release_phones || params.release_phones.length === 0)
      return new NoticeSendResult({ success: false, error: "release_phones is required when user_type is 1 (phone)" });
    if (params.release_phones.length > NOTICE_PHONE_RANGE_MAX)
      return new NoticeSendResult({ success: false, error: `release_phones allows at most ${NOTICE_PHONE_RANGE_MAX} numbers` });
    if (params.cc_phones && params.cc_phones.length > NOTICE_PHONE_RANGE_MAX)
      return new NoticeSendResult({ success: false, error: `cc_phones allows at most ${NOTICE_PHONE_RANGE_MAX} numbers` });
    if (!params.create_mobile && !params.user_token)
      return new NoticeSendResult({ success: false, error: "create_mobile is required when user_type is 1 (phone) and user_token is not provided" });
  }
  if (params.user_type === NOTICE_USER_TYPE_OPENID) {
    if (!params.release_range || params.release_range.length === 0)
      return new NoticeSendResult({ success: false, error: "release_range is required when user_type is 2 (openid)" });
    if (params.release_range.length > NOTICE_OPEN_RANGE_MAX)
      return new NoticeSendResult({ success: false, error: `release_range allows at most ${NOTICE_OPEN_RANGE_MAX} items` });
    if (params.cc_staff_ids && params.cc_staff_ids.length > NOTICE_OPEN_RANGE_MAX)
      return new NoticeSendResult({ success: false, error: `cc_staff_ids allows at most ${NOTICE_OPEN_RANGE_MAX} items` });
    if (!params.create_user_id && !params.user_token)
      return new NoticeSendResult({ success: false, error: "create_user_id is required when user_type is 2 (openid) and user_token is not provided" });
  }

  if (params.remind_after_type && !NOTICE_REMIND_AFTER_TYPES.includes(params.remind_after_type))
    return new NoticeSendResult({ success: false, error: `remind_after_type must be one of: ${NOTICE_REMIND_AFTER_TYPES.join(", ")}` });
  if (params.remind_range_type && !NOTICE_REMIND_RANGE_TYPES.includes(params.remind_range_type))
    return new NoticeSendResult({ success: false, error: `remind_range_type must be one of: ${NOTICE_REMIND_RANGE_TYPES.join(", ")}` });

  const url = buildApiUrl(config, "notices", "send", appToken, { userToken: params.user_token });

  const body: Record<string, any> = {
    title: params.title,
    contentType: params.content_type,
    accountCode: params.account_code,
    userType: params.user_type,
  };
  if (params.content) body.content = params.content;
  if (params.notice_link) body.noticeLink = params.notice_link;
  if (params.notice_location) body.noticeLocation = params.notice_location;
  if (params.latitude !== undefined) body.latitude = params.latitude;
  if (params.longitude !== undefined) body.longitude = params.longitude;
  if (params.user_type === NOTICE_USER_TYPE_PHONE) {
    // 实测：range 对象内缺失 ccRangeList 时服务端抛 errCode=-1（NPE），强制下发
    body.phoneUserRange = {
      releaseRangeList: params.release_phones,
      ccRangeList: params.cc_phones ?? [],
    };
  }
  if (params.user_type === NOTICE_USER_TYPE_OPENID) {
    body.openUserRange = {
      releaseRangeList: params.release_range,
      ccRangeList: params.cc_staff_ids ?? [],
    };
  }
  if (params.create_mobile) body.createMobile = params.create_mobile;
  if (params.create_user_id) body.createUserId = params.create_user_id;
  if (params.resource_list) body.resourceList = params.resource_list;
  if (params.extend_id) body.extendId = params.extend_id;
  if (params.confirm_flag !== undefined) body.confirmFlag = params.confirm_flag;
  if (params.forward_flag !== undefined) body.forwardFlag = params.forward_flag;
  if (params.reply_flag !== undefined) body.replyFlag = params.reply_flag;
  if (params.anonymous_flag !== undefined) body.anonymousFlag = params.anonymous_flag;
  if (params.remind_status !== undefined) body.remindStatus = params.remind_status;
  else body.remindStatus = 0; // 实测：缺失 remindStatus 服务端抛 errCode=-1（NPE），兜底 0
  if (params.remind_msg_type) body.remindMsgType = params.remind_msg_type;
  if (params.at_once_flag !== undefined) body.atOnceFlag = params.at_once_flag;
  if (params.remind_after_type) body.remindAfterType = params.remind_after_type;
  if (params.remind_max_count !== undefined) body.remindMaxCount = params.remind_max_count;
  if (params.remind_interval_time !== undefined) body.remindIntervalTime = params.remind_interval_time;
  if (params.remind_interval_time_duration) body.remindIntervalTimeDuration = params.remind_interval_time_duration;
  if (params.remind_range_type) body.remindRangeType = params.remind_range_type;
  if (params.remind_range_staff_ids) body.remindRangeStaffIds = params.remind_range_staff_ids;

  const [data, httpErr] = await doPost(url, body, params.fetchFn);
  if (httpErr) return new NoticeSendResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new NoticeSendResult({ success: false, error: apiErr });

  const d = data!.data || {};
  return new NoticeSendResult({
    success: true,
    notice_code: d.code ?? null,
    notice_id: d.id ?? null,
    title: d.title ?? null,
    notice_type: d.noticeType ?? null,
    content_type: d.contentType ?? null,
    content_abstract: d.contentAbstract ?? null,
    notice_link: d.noticeLink ?? null,
    notice_status: d.noticeStatus ?? null,
    confirm_status: d.confirmStatus ?? null,
    publish_time: d.publishTime ?? null,
    publish_user_id: d.publishUserId ?? null,
    publish_user_name: d.publishUserName ?? null,
    raw_response: data!,
  });
}

export async function fetchNoticeAccounts(
  config: LansengerConfig,
  appToken: string,
  opts: { org_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<NoticeAccountListResult> {
  const url = buildApiUrl(config, "notices", "accounts_fetch", appToken, { userToken: opts.user_token });

  const body: Record<string, any> = {};
  if (opts.org_id) body.orgId = opts.org_id;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new NoticeAccountListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new NoticeAccountListResult({ success: false, error: apiErr });

  const accounts = data!.data || [];
  return new NoticeAccountListResult({
    success: true,
    total: accounts.length,
    accounts,
    raw_response: data!,
  });
}
