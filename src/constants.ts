export const API_ENDPOINTS: Record<string, Record<string, string>> = {
  auth: {
    tenant_access_token: "/auth/v3/tenant_access_token/internal",
  },
  app_token: {
    create: "/v1/apptoken/create",
  },
  oauth2: {
    authorize: "/oauth2/authorize",
    user_token_create: "/v2/user_token/create",
    refresh_token_create: "/v1/refresh_token/create",
  },
  users: {
    fetch: "/v1/users/fetch",
  },
  staffs: {
    fetch: "/v1/staffs/{staff_id}/fetch",
    detail_fetch: "/v1/staffs/{staff_id}/infor/fetch",
    department_ancestors: "/v1/staffs/{staff_id}/departmentancestors/fetch",
    id_mapping: "/v2/staffs/id_mapping/fetch",
    search: "/v2/staffs/search",
  },
  departments: {
    fetch: "/v1/departments/{department_id}/fetch",
    children_fetch: "/v1/departments/{department_id}/children/fetch",
    staffs_fetch: "/v1/departments/{department_id}/staffs/fetch",
  },
  org: {
    fetch: "/v1/org/{org_id}/fetch",
    extra_field_ids: "/v1/org/{org_id}/extrafieldids/fetch",
  },
  videoconference: {
    meeting_create: "/xtra/videoconference/openapi/v1/meeting/create",
    meeting_modify: "/xtra/videoconference/openapi/v1/meeting/modify",
    // server keeps the historical "cancle" spelling
    meeting_cancel: "/xtra/videoconference/openapi/v1/meeting/cancle",
    meeting_stop: "/xtra/videoconference/openapi/v1/meeting/stop",
    meeting_detail: "/xtra/videoconference/openapi/v1/meeting/detail",
    meeting_list: "/xtra/videoconference/openapi/v1/meeting/list",
    meeting_record_list: "/xtra/videoconference/openapi/v1/meeting/record/list",
    member_simplerecord: "/xtra/videoconference/openapi/v1/meeting/member/simplerecord",
    fixroom_list: "/xtra/videoconference/openapi/v1/meeting/fixroom/list",
    status_fetchmore: "/xtra/videoconference/openapi/v1/meeting/status/fetchmore",
    events_subscribe: "/xtra/videoconference/openapi/v1/meeting/events/subscribe",
    param_fetch: "/xtra/videoconference/openapi/v1/meeting/param/fetch",
    history_fetch: "/xtra/videoconference/openapi/v1/meeting/history/fetch",
    active_fetch: "/xtra/videoconference/openapi/v1/meeting/active/fetch",
    member_control: "/xtra/videoconference/openapi/v1/meeting/member/control",
    member_invite: "/xtra/videoconference/openapi/v1/meeting/member/invite",
    member_list: "/xtra/videoconference/openapi/v1/meeting/member/list",
    vod_list: "/xtra/videoconference/openapi/v1/meeting/vod/list",
    vod_download_url: "/xtra/videoconference/openapi/v1/vod/url/download/fetch",
    conf_fetch: "/xtra/videoconference/openapi/v1/conf/fetch",
  },
  websocket: {
    endpoint: "/v1/ws/endpoint/create",
  },
  smart_bot: {
    private_message: "/v1/bot/messages/create",
    group_message: "/v1/messages/group/create",
  },
  account_message: {
    create: "/v1/messages/create",
  },
  user_message: {
    create: "/v1/messages/chat/create",
  },
  bot: {
    message_create: "/v1/bot/messages/create",
  },
  sse: {
    msg_create: "/v1/sse/msg/create",
    msg_fetch: "/v1/sse/msg/fetch",
  },
  media: {
    create: "/v1/medias/create",
    app_create: "/v1/app/medias/create",
    app_create_v2: "/v2/app/medias/create",
    fetch: "/v1/medias/{media_id}/fetch",
    path_fetch: "/v1/medias/{media_id}/path/fetch",
    share_fetch: "/v1/media/share/{share_id}/fetch",
  },
  message: {
    revoke: "/v1/messages/revoke",
    dynamic_update: "/v1/messages/dynamic/update",
    reminder_create: "/v1/messages/reminder/create",
  },
  groups: {
    create: "/v2/groups/create",
    info_fetch: "/v2/groups/{group_id}/info/fetch",
    info_update: "/v2/groups/{group_id}/info/update",
    members_fetch: "/v2/groups/{group_id}/members/fetch",
    members_update: "/v2/groups/{group_id}/members/update",
    groups_fetch: "/v2/groups/fetch",
    is_in_group: "/v2/groups/{group_id}/members/is_in_group",
    delete: "/v2/groups/{group_id}/delete",
    share_create: "/v2/groups/{group_id}/share/create",
  },
  chats: {
    fetch: "/v1/chats/fetch",
    messages_fetch: "/v1/messages/fetch",
  },
  calendars: {
    primary: "/v1/calendars/primary",
    schedule_create: "/v1/calendars/{calendar_id}/schedules/create",
    schedule_fetch: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/fetch",
    schedule_update: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/update",
    schedule_delete: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/delete",
    schedule_list: "/v1/calendars/{calendar_id}/schedules/fetch",
    attendees_fetch: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/members/fetch",
    attendees_create: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/members/create",
    attendees_delete: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/members/delete",
    attendees_update: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/members/update",
    attendees_meta_update: "/v1/calendars/{calendar_id}/schedules/{schedule_id}/members/meta/update",
  },
  notices: {
    send: "/xtra/notice/server/openapi/v1/send",
    accounts_fetch: "/xtra/notice/server/openapi/v1/notice/account",
  },
  questionnaires: {
    save: "/xtra/questionnaire/server/openapi/v1/saveQuestionnaire",
    questions_save: "/xtra/questionnaire/server/openapi/v1/saveQuestionList",
    question_delete: "/xtra/questionnaire/server/openapi/v1/deleteQuestion",
    publish: "/xtra/questionnaire/server/openapi/v1/publish",
    withdraw: "/xtra/questionnaire/server/openapi/v1/withdraw",
    finish: "/xtra/questionnaire/server/openapi/v1/finish",
    delete: "/xtra/questionnaire/server/openapi/v1/delete",
    detail: "/xtra/questionnaire/server/openapi/v1/detail",
    answer_url: "/xtra/questionnaire/server/openapi/v1/getAnswerUrl",
    copy: "/xtra/questionnaire/server/openapi/v1/copy",
    detail_no_auth: "/xtra/questionnaire/server/openapi/v1/detailWithoutAuth",
    query_list: "/xtra/questionnaire/server/openapi/v1/queryList",
    user_accounts: "/xtra/questionnaire/server/openapi/v1/userOfficeAccountList",
    create_list: "/xtra/questionnaire/server/openapi/v1/createList",
    my_create_list: "/xtra/questionnaire/server/openapi/v1/myCreateList",
    participation_list: "/xtra/questionnaire/server/openapi/v1/participationList",
    answer_list: "/xtra/questionnaire/server/openapi/v1/answerList",
    answer_detail: "/xtra/questionnaire/server/openapi/v1/answerDetail",
    last_answer_detail: "/xtra/questionnaire/server/openapi/v1/lastAnswerDetail",
    answer_data: "/xtra/questionnaire/server/openapi/v1/answerData",
    last_answer_record: "/xtra/questionnaire/server/openapi/v1/lastAnswerRecord",
    upload_url: "/xtra/questionnaire/server/openapi/v1/upload",
  },
  boardrooms: {
    room_list: "/xtra/boardroom/server/openapi/v2/roomList",
    room_detail: "/xtra/boardroom/server/openapi/v2/roomDetail",
    room_schedule: "/xtra/boardroom/server/openapi/v2/roomSchedule",
    reserve_detail: "/xtra/boardroom/server/openapi/v2/reserveDetail",
    reserve_room: "/xtra/boardroom/server/openapi/v2/reserveRoom",
    edit_reserve: "/xtra/boardroom/server/openapi/v2/editReserve",
    reserve_cancel: "/xtra/boardroom/server/openapi/v2/reserveCancel",
    confirm_sign: "/xtra/boardroom/server/openapi/v2/confirmSign",
    my_reserve_list: "/xtra/boardroom/server/openapi/v2/myReserveList",
    grading_list: "/xtra/boardroom/server/openapi/v2/gradingList",
    area_office_list: "/xtra/boardroom/server/openapi/v2/areaOfficeList",
  },
  personal_todos: {
    save: "/xtra/tdtask/server/openapi/v3/taskopt/savePersonalTask",
    update: "/xtra/tdtask/server/openapi/v3/taskopt/updatePersonalTask",
    user_list: "/xtra/tdtask/server/openapi/v3/user/list",
    resource_update: "/xtra/tdtask/server/openapi/resource/update",
    resource_download: "/xtra/tdtask/server/openapi/resource/getResourceDownload",
    resource_upload_url: "/xtra/tdtask/server/openapi/resource/getUploadUrl",
  },
  bot_commands: {
    create: "/v1/bot/commands/create",
    fetch: "/v1/bot/commands/fetch",
    delete: "/v1/bot/commands/delete",
  },
  personal_apps: {
    create: "/v1/personal/apps/create",
    update: "/v1/personal/apps/{app_id}/update",
    fetch: "/v1/personal/apps/{app_id}/fetch",
    delete: "/v1/personal/apps/{app_id}/delete",
    list_fetch: "/v1/personal/apps/list/fetch",
  },
  todo: {
    create: "/xtra/task/unified/v1/todotask/create",
    info_update: "/xtra/task/unified/v1/todotask/info/update",
    status_update: "/xtra/task/unified/v1/todotask/status/update",
    sender_delete: "/xtra/task/unified/v1/sender/todotask/delete",
    list_fetch: "/xtra/task/unified/v1/todotask/list/fetch",
    info_fetch_by_source_id: "/xtra/task/unified/v1/todotask/info/fetchbysourceid",
    info_fetch: "/xtra/task/unified/v1/todotask/info/fetch",
    status_count_list_fetch: "/xtra/task/unified/v1/todotask/status/countList/fetch",
    executor_status_update: "/xtra/task/unified/v1/todotask/executor/status/update",
    executor_create: "/xtra/task/unified/v1/todotask/executor/create",
    executor_delete: "/xtra/task/unified/v1/todotask/executor/delete",
    executor_list_fetch: "/xtra/task/unified/v1/todotask/executor/list/fetch",
    staff_application_fetch: "/xtra/task/unified/v1/staff/application/fetch",
  },
};

export const OAUTH2_SCOPE_BASIC_USER_INFO = "basic_userinfor";

export const OAUTH2_SCOPES: Record<string, string> = {
  basic_user_info: OAUTH2_SCOPE_BASIC_USER_INFO,
};

export const MEDIA_TYPE_VIDEO = 1;
export const MEDIA_TYPE_IMAGE = 2;
export const MEDIA_TYPE_AUDIO = 3;

export const APP_MEDIA_TYPE_FILE = "file";
export const APP_MEDIA_TYPE_VIDEO = "video";
export const APP_MEDIA_TYPE_IMAGE = "image";
export const APP_MEDIA_TYPE_AUDIO = "audio";

// Map app media type (4.5.4 upload string) → message body mediaType (int: 1=video, 2=image, 3=file)
export const APP_TO_MSG_MEDIA_TYPE: Record<string, number> = {
  [APP_MEDIA_TYPE_VIDEO]: MEDIA_TYPE_VIDEO,   // "video" → 1
  [APP_MEDIA_TYPE_IMAGE]: MEDIA_TYPE_IMAGE,   // "image" → 2
  [APP_MEDIA_TYPE_FILE]: MEDIA_TYPE_AUDIO,    // "file"  → 3
  [APP_MEDIA_TYPE_AUDIO]: MEDIA_TYPE_AUDIO,   // "audio" → 3
};

export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
export const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp"]);
export const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".amr", ".m4a", ".ogg", ".flac", ".aac"]);

export const MAX_MESSAGE_LENGTH = 4000;
export const TOKEN_REFRESH_MARGIN = 300;

export const TODO_TODO_STATUS_PENDING_READ = "11";
export const TODO_TODO_STATUS_READ = "12";
export const TODO_TODO_STATUS_PENDING_DO = "21";
export const TODO_TODO_STATUS_DONE = "22";

export const TODO_TYPE_NOTIFICATION = 1;
export const TODO_TYPE_APPROVAL = 2;

export const REMINDER_TYPE_NONE = 0;
export const REMINDER_TYPE_POPUP = 1;
export const REMINDER_TYPE_SMS = 2;
export const REMINDER_TYPE_PHONE = 3;

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

export const QUESTIONNAIRE_STATUS_DRAFT = 1;
export const QUESTIONNAIRE_STATUS_ONGOING = 2;
export const QUESTIONNAIRE_STATUS_WITHDRAWN = 3;
export const QUESTIONNAIRE_STATUS_FINISHED = 4;
export const QUESTIONNAIRE_STATUS_READY_TO_PUBLISH = 5;
export const QUESTIONNAIRE_SCOPE_INTERNAL = 1;
export const QUESTIONNAIRE_SCOPE_PUBLIC = 2;
export const QUESTIONNAIRE_ANSWER_LIMIT_ONCE = 1;
export const QUESTIONNAIRE_ANSWER_LIMIT_UNLIMITED = -1;
export const QUESTIONNAIRE_QUESTION_TYPES = [
  "radio", "checkbox", "picturesVote", "fillblank", "name", "phone",
  "email", "sex", "age", "date", "dateTime", "address", "multiScore",
  "remark", "picturesUpload", "filesUpload",
];

export const BOARDROOM_STATUS_APPROVING = 0;
export const BOARDROOM_STATUS_PENDING_SIGN = 1;
export const BOARDROOM_STATUS_SIGN_TIMEOUT = 2;
export const BOARDROOM_STATUS_REJECTED = 3;
export const BOARDROOM_STATUS_CANCELED = 4;
export const BOARDROOM_STATUS_RESERVED = 5;
export const BOARDROOM_STATUS_FINISHED = 6;
export const BOARDROOM_RESERVE_TYPE_SINGLE = "0";
export const BOARDROOM_RESERVE_TYPE_REPEAT = "1";
export const BOARDROOM_EDIT_TYPE_CURRENT = "1";
export const BOARDROOM_EDIT_TYPE_CURRENT_AND_AFTER = "2";
export const BOARDROOM_CANCEL_TYPE_CURRENT = "1";
export const BOARDROOM_CANCEL_TYPE_CURRENT_AND_AFTER = "2";
export const BOARDROOM_CANCEL_TYPE_ALL_UNFINISHED = "3";

export const PERSONAL_TODO_TYPE_PERSONAL = 1;
export const PERSONAL_TODO_STATUS_UNFINISHED = 0;
export const PERSONAL_TODO_STATUS_FINISHED = 1;
export const PERSONAL_TODO_PRIORITY_LOW = 0;
export const PERSONAL_TODO_PRIORITY_NORMAL = 1;
export const PERSONAL_TODO_PRIORITY_URGENT = 2;
export const PERSONAL_TODO_PRIORITY_VERY_URGENT = 3;
export const PERSONAL_TODO_PLATFORM_APP = 1;
export const PERSONAL_TODO_PLATFORM_WEB = 2;
export const PERSONAL_TODO_PLATFORM_API = 3;
export const PERSONAL_TODO_RESOURCE_MAX_SIZE = 9 * 1024 * 1024;

export const CALLBACK_EVENT_TYPES: Record<string, string> = {
  account_message: "public_account",
  account_subscribe: "public_account",
  account_unsubscribe: "public_account",
  staff_info: "staff",
  staff_modify: "staff",
  staff_create: "staff",
  staff_delete: "staff",
  dept_modify: "department",
  dept_create: "department",
  dept_delete: "department",
  tag_member: "tag",
  app_install_org: "app",
  app_uninstall_org: "app",
  bot_private_message: "bot",
  bot_group_message: "bot",
  group_create_approve: "group",
  telephone_track: "notification",
  ua_cert_create: "certificate",
  ua_cert_delete: "certificate",
  report_location: "location",
  user_logout: "auth",
  data_scope: "data_scope",
  wb_visible_config: "workbench",
  schedule_modify: "calendar",
  schedule_delete: "calendar",
};

export function guessMediaType(filePath: string): number | undefined {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return MEDIA_TYPE_IMAGE;
  if (VIDEO_EXTENSIONS.has(ext)) return MEDIA_TYPE_VIDEO;
  if (AUDIO_EXTENSIONS.has(ext)) return MEDIA_TYPE_AUDIO;
  return undefined;
}

export function guessAppMediaType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return APP_MEDIA_TYPE_IMAGE;
  if (VIDEO_EXTENSIONS.has(ext)) return APP_MEDIA_TYPE_VIDEO;
  if (AUDIO_EXTENSIONS.has(ext)) return APP_MEDIA_TYPE_AUDIO;
  return APP_MEDIA_TYPE_FILE;
}

export const VC_MEMBER_ROLE_HOST = "admin";
export const VC_MEMBER_ROLE_JOIN_HOST = "joinHost";
export const VC_MEMBER_ROLE_MEMBER = "participant";

// opCode values for meeting/member/control (接口枚举字典)
export const VC_OPS = [
  "kick", "quit", "join", "handup", "openScreenShare", "closeScreenShare",
  "openVideo", "closeVideo", "applyAudio", "applyVideo", "shareVideo",
  "cancelShareVideo", "muteall", "unmuteall", "remove", "call",
  "enforceOpenVideo", "setJoinHost", "cancelJoinHost", "inviteOpenAudio",
  "setHost", "grabHost",
];

export const VC_FETCH_RANGE_MY = "my";
export const VC_FETCH_RANGE_ALL = "all";
export const VC_FETCH_RANGE_PERSON = "person";
export const VC_CREATE_SOURCE_CLIENT = 0;
export const VC_CREATE_SOURCE_THIRD_PARTY = 1;

export const VERSION = "1.4.5";
