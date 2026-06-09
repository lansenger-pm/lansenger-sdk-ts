import * as crypto from "crypto";

type AnyDict = Record<string, any>;

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

export class CallbackEvent {
  event_id: number;
  event_type: string;
  category: string;
  data: AnyDict | CallbackEventData;
  app_id: string;
  org_id: string;

  constructor(init: {
    event_id?: number;
    event_type?: string;
    category?: string;
    data?: AnyDict | CallbackEventData;
    app_id?: string;
    org_id?: string;
  }) {
    this.event_id = init.event_id ?? 0;
    this.event_type = init.event_type ?? "";
    this.category = init.category ?? "";
    this.data = init.data ?? {};
    this.app_id = init.app_id ?? "";
    this.org_id = init.org_id ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = {
      event_id: this.event_id,
      event_type: this.event_type,
      category: this.category,
      app_id: this.app_id,
      org_id: this.org_id,
    };
    if (this.data != null) {
      d.data = typeof this.data === "object" && "toDict" in (this.data as any)
        ? (this.data as any).toDict()
        : this.data;
    }
    return d;
  }
}

export class AccountSubscribeData {
  staff_id: string;
  create_time: string;

  constructor(init: { staff_id?: string; create_time?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.create_time = init.create_time ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, create_time: this.create_time };
  }
}

export class AccountUnsubscribeData {
  staff_id: string;
  create_time: string;

  constructor(init: { staff_id?: string; create_time?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.create_time = init.create_time ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, create_time: this.create_time };
  }
}

export class StaffInfoData {
  staff_id: string;
  name: string;
  mobile: string;
  state: string;
  sex: string;
  email: string;
  employee_id: string;
  avatar_id: string;
  timestamp: string;

  constructor(init: {
    staff_id?: string;
    name?: string;
    mobile?: string;
    state?: string;
    sex?: string;
    email?: string;
    employee_id?: string;
    avatar_id?: string;
    timestamp?: string;
  }) {
    this.staff_id = init.staff_id ?? "";
    this.name = init.name ?? "";
    this.mobile = init.mobile ?? "";
    this.state = init.state ?? "";
    this.sex = init.sex ?? "";
    this.email = init.email ?? "";
    this.employee_id = init.employee_id ?? "";
    this.avatar_id = init.avatar_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = {};
    for (const key of ["staff_id", "name", "mobile", "state", "sex", "email", "employee_id", "avatar_id", "timestamp"] as const) {
      const v = (this as any)[key];
      if (v) d[key] = v;
    }
    return d;
  }
}

export class StaffModifyData {
  staff_id: string;
  timestamp: string;

  constructor(init: { staff_id?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, timestamp: this.timestamp };
  }
}

export class StaffCreateData {
  staff_id: string;
  timestamp: string;

  constructor(init: { staff_id?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, timestamp: this.timestamp };
  }
}

export class StaffDeleteData {
  staff_id: string;
  timestamp: string;

  constructor(init: { staff_id?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, timestamp: this.timestamp };
  }
}

export class TelephoneTrackCallerData {
  staff_id: string;
  country_code: string;
  number: string;

  constructor(init: { staff_id?: string; country_code?: string; number?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.country_code = init.country_code ?? "";
    this.number = init.number ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = { staff_id: this.staff_id };
    if (this.country_code) d.country_code = this.country_code;
    if (this.number) d.number = this.number;
    return d;
  }
}

export class TelephoneTrackData {
  transaction_id: string;
  attach: string;
  caller: TelephoneTrackCallerData;
  callee: TelephoneTrackCallerData;
  confirm_type: number;
  timestamp: string;

  constructor(init: {
    transaction_id?: string;
    attach?: string;
    caller?: TelephoneTrackCallerData;
    callee?: TelephoneTrackCallerData;
    confirm_type?: number;
    timestamp?: string;
  }) {
    this.transaction_id = init.transaction_id ?? "";
    this.attach = init.attach ?? "";
    this.caller = init.caller ?? new TelephoneTrackCallerData({});
    this.callee = init.callee ?? new TelephoneTrackCallerData({});
    this.confirm_type = init.confirm_type ?? 0;
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = {
      transaction_id: this.transaction_id,
      caller: this.caller.toDict(),
      callee: this.callee.toDict(),
      confirm_type: this.confirm_type,
    };
    if (this.attach) d.attach = this.attach;
    if (this.timestamp) d.timestamp = this.timestamp;
    return d;
  }
}

export class DeptCreateData {
  dept_id: string;
  timestamp: string;

  constructor(init: { dept_id?: string; timestamp?: string }) {
    this.dept_id = init.dept_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { dept_id: this.dept_id, timestamp: this.timestamp };
  }
}

export class DeptModifyData {
  dept_id: string;
  timestamp: string;

  constructor(init: { dept_id?: string; timestamp?: string }) {
    this.dept_id = init.dept_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { dept_id: this.dept_id, timestamp: this.timestamp };
  }
}

export class DeptDeleteData {
  dept_id: string;
  timestamp: string;

  constructor(init: { dept_id?: string; timestamp?: string }) {
    this.dept_id = init.dept_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { dept_id: this.dept_id, timestamp: this.timestamp };
  }
}

export class AppInstallData {
  org_id: string;
  org_name: string;
  timestamp: string;

  constructor(init: { org_id?: string; org_name?: string; timestamp?: string }) {
    this.org_id = init.org_id ?? "";
    this.org_name = init.org_name ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { org_id: this.org_id, org_name: this.org_name, timestamp: this.timestamp };
  }
}

export class AppUninstallData {
  org_id: string;
  org_name: string;
  timestamp: string;

  constructor(init: { org_id?: string; org_name?: string; timestamp?: string }) {
    this.org_id = init.org_id ?? "";
    this.org_name = init.org_name ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { org_id: this.org_id, org_name: this.org_name, timestamp: this.timestamp };
  }
}

export class UaCertCreateData {
  staff_id: string;
  device_id: string;
  ua_cert: string;
  timestamp: string;

  constructor(init: { staff_id?: string; device_id?: string; ua_cert?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.device_id = init.device_id ?? "";
    this.ua_cert = init.ua_cert ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, device_id: this.device_id, ua_cert: this.ua_cert, timestamp: this.timestamp };
  }
}

export class UaCertDeleteData {
  staff_id: string;
  device_id: string;
  timestamp: string;

  constructor(init: { staff_id?: string; device_id?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.device_id = init.device_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, device_id: this.device_id, timestamp: this.timestamp };
  }
}

export class ReportLocationData {
  location_info: Record<string, string>;

  constructor(init: { location_info?: Record<string, string> }) {
    this.location_info = init.location_info ?? {};
  }

  toDict(): AnyDict {
    return { location_info: this.location_info };
  }
}

export class UserLogoutData {
  staff_id: string;
  device_id: string;
  timestamp: string;

  constructor(init: { staff_id?: string; device_id?: string; timestamp?: string }) {
    this.staff_id = init.staff_id ?? "";
    this.device_id = init.device_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { staff_id: this.staff_id, device_id: this.device_id, timestamp: this.timestamp };
  }
}

export class DataScopeData {
  dept_ids: string[];
  timestamp: string;

  constructor(init: { dept_ids?: string[]; timestamp?: string }) {
    this.dept_ids = init.dept_ids ?? [];
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { dept_ids: this.dept_ids, timestamp: this.timestamp };
  }
}

export class BotPrivateMessageData {
  from_id: string;
  entry_id: string;
  msg_type: string;
  msg_data: AnyDict;

  constructor(init: { from_id?: string; entry_id?: string; msg_type?: string; msg_data?: AnyDict }) {
    this.from_id = init.from_id ?? "";
    this.entry_id = init.entry_id ?? "";
    this.msg_type = init.msg_type ?? "";
    this.msg_data = init.msg_data ?? {};
  }

  toDict(): AnyDict {
    return { from_id: this.from_id, entry_id: this.entry_id, msg_type: this.msg_type, msg_data: this.msg_data };
  }
}

export class BotGroupMessageData {
  from_id: string;
  entry_id: string;
  msg_type: string;
  msg_data: AnyDict;
  group_id: string;
  from_type: number;
  group_name: string;
  bot_creator: string;
  msg_id: string;
  bot_id: string;
  is_at_me: boolean;
  is_at_all: boolean;

  constructor(init: {
    from_id?: string;
    entry_id?: string;
    msg_type?: string;
    msg_data?: AnyDict;
    group_id?: string;
    from_type?: number;
    group_name?: string;
    bot_creator?: string;
    msg_id?: string;
    bot_id?: string;
    is_at_me?: boolean;
    is_at_all?: boolean;
  }) {
    this.from_id = init.from_id ?? "";
    this.entry_id = init.entry_id ?? "";
    this.msg_type = init.msg_type ?? "";
    this.msg_data = init.msg_data ?? {};
    this.group_id = init.group_id ?? "";
    this.from_type = init.from_type ?? 0;
    this.group_name = init.group_name ?? "";
    this.bot_creator = init.bot_creator ?? "";
    this.msg_id = init.msg_id ?? "";
    this.bot_id = init.bot_id ?? "";
    this.is_at_me = init.is_at_me ?? false;
    this.is_at_all = init.is_at_all ?? false;
  }

  toDict(): AnyDict {
    return {
      from_id: this.from_id,
      entry_id: this.entry_id,
      msg_type: this.msg_type,
      msg_data: this.msg_data,
      group_id: this.group_id,
      from_type: this.from_type,
      group_name: this.group_name,
      bot_creator: this.bot_creator,
      msg_id: this.msg_id,
      bot_id: this.bot_id,
      is_at_me: this.is_at_me,
      is_at_all: this.is_at_all,
    };
  }
}

export class WbVisibleConfigData {
  entry_id: string;
  department_ids: string[];
  staff_ids: string[];
  timestamp: string;
  is_test_mode_on: boolean;

  constructor(init: {
    entry_id?: string;
    department_ids?: string[];
    staff_ids?: string[];
    timestamp?: string;
    is_test_mode_on?: boolean;
  }) {
    this.entry_id = init.entry_id ?? "";
    this.department_ids = init.department_ids ?? [];
    this.staff_ids = init.staff_ids ?? [];
    this.timestamp = init.timestamp ?? "";
    this.is_test_mode_on = init.is_test_mode_on ?? false;
  }

  toDict(): AnyDict {
    return {
      entry_id: this.entry_id,
      department_ids: this.department_ids,
      staff_ids: this.staff_ids,
      timestamp: this.timestamp,
      is_test_mode_on: this.is_test_mode_on,
    };
  }
}

export class GroupCreateApproveData {
  apply_request_id: string;
  group_id: string;
  timestamp: string;

  constructor(init: { apply_request_id?: string; group_id?: string; timestamp?: string }) {
    this.apply_request_id = init.apply_request_id ?? "";
    this.group_id = init.group_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { apply_request_id: this.apply_request_id, group_id: this.group_id, timestamp: this.timestamp };
  }
}

export class ScheduleModifyData {
  primary_schedule_id: string;
  schedule_id: string;
  summary: string;
  description: string;
  operation_type: string;
  current_time: number;
  repeat_type: string;
  expire_date_type: string;
  all_day: string;
  rule: string;
  rule_start_time: number;
  rule_end_time: number;
  start_time: AnyDict;
  end_time: AnyDict;
  operator: string;
  attendees: AnyDict[];
  timestamp: string;

  constructor(init: {
    primary_schedule_id?: string;
    schedule_id?: string;
    summary?: string;
    description?: string;
    operation_type?: string;
    current_time?: number;
    repeat_type?: string;
    expire_date_type?: string;
    all_day?: string;
    rule?: string;
    rule_start_time?: number;
    rule_end_time?: number;
    start_time?: AnyDict;
    end_time?: AnyDict;
    operator?: string;
    attendees?: AnyDict[];
    timestamp?: string;
  }) {
    this.primary_schedule_id = init.primary_schedule_id ?? "";
    this.schedule_id = init.schedule_id ?? "";
    this.summary = init.summary ?? "";
    this.description = init.description ?? "";
    this.operation_type = init.operation_type ?? "";
    this.current_time = init.current_time ?? 0;
    this.repeat_type = init.repeat_type ?? "";
    this.expire_date_type = init.expire_date_type ?? "";
    this.all_day = init.all_day ?? "";
    this.rule = init.rule ?? "";
    this.rule_start_time = init.rule_start_time ?? 0;
    this.rule_end_time = init.rule_end_time ?? 0;
    this.start_time = init.start_time ?? {};
    this.end_time = init.end_time ?? {};
    this.operator = init.operator ?? "";
    this.attendees = init.attendees ?? [];
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = {};
    for (const key of [
      "primary_schedule_id", "schedule_id", "summary", "description",
      "operation_type", "current_time", "repeat_type", "expire_date_type",
      "all_day", "rule", "rule_start_time", "rule_end_time",
      "start_time", "end_time", "operator", "attendees", "timestamp",
    ] as const) {
      const v = (this as any)[key];
      if (v !== null && v !== undefined && (typeof v !== "string" || v)) {
        d[key] = v;
      }
    }
    return d;
  }
}

export class ScheduleDeleteData {
  primary_schedule_id: string;
  schedule_id: string;
  summary: string;
  description: string;
  operation_type: string;
  current_time: number;
  repeat_type: string;
  expire_date_type: string;
  all_day: string;
  rule: string;
  rule_start_time: number;
  rule_end_time: number;
  start_time: AnyDict;
  end_time: AnyDict;
  operator: string;
  timestamp: string;

  constructor(init: {
    primary_schedule_id?: string;
    schedule_id?: string;
    summary?: string;
    description?: string;
    operation_type?: string;
    current_time?: number;
    repeat_type?: string;
    expire_date_type?: string;
    all_day?: string;
    rule?: string;
    rule_start_time?: number;
    rule_end_time?: number;
    start_time?: AnyDict;
    end_time?: AnyDict;
    operator?: string;
    timestamp?: string;
  }) {
    this.primary_schedule_id = init.primary_schedule_id ?? "";
    this.schedule_id = init.schedule_id ?? "";
    this.summary = init.summary ?? "";
    this.description = init.description ?? "";
    this.operation_type = init.operation_type ?? "";
    this.current_time = init.current_time ?? 0;
    this.repeat_type = init.repeat_type ?? "";
    this.expire_date_type = init.expire_date_type ?? "";
    this.all_day = init.all_day ?? "";
    this.rule = init.rule ?? "";
    this.rule_start_time = init.rule_start_time ?? 0;
    this.rule_end_time = init.rule_end_time ?? 0;
    this.start_time = init.start_time ?? {};
    this.end_time = init.end_time ?? {};
    this.operator = init.operator ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    const d: AnyDict = {};
    for (const key of [
      "primary_schedule_id", "schedule_id", "summary", "description",
      "operation_type", "current_time", "repeat_type", "expire_date_type",
      "all_day", "rule", "rule_start_time", "rule_end_time",
      "start_time", "end_time", "operator", "timestamp",
    ] as const) {
      const v = (this as any)[key];
      if (v !== null && v !== undefined && (typeof v !== "string" || v)) {
        d[key] = v;
      }
    }
    return d;
  }
}

export class TagMemberData {
  tag_id: string;
  timestamp: string;

  constructor(init: { tag_id?: string; timestamp?: string }) {
    this.tag_id = init.tag_id ?? "";
    this.timestamp = init.timestamp ?? "";
  }

  toDict(): AnyDict {
    return { tag_id: this.tag_id, timestamp: this.timestamp };
  }
}

export type CallbackEventData =
  | AccountSubscribeData
  | AccountUnsubscribeData
  | StaffInfoData
  | StaffModifyData
  | StaffCreateData
  | StaffDeleteData
  | TelephoneTrackData
  | DeptCreateData
  | DeptModifyData
  | DeptDeleteData
  | AppInstallData
  | AppUninstallData
  | UaCertCreateData
  | UaCertDeleteData
  | ReportLocationData
  | UserLogoutData
  | DataScopeData
  | BotPrivateMessageData
  | BotGroupMessageData
  | WbVisibleConfigData
  | GroupCreateApproveData
  | ScheduleModifyData
  | ScheduleDeleteData
  | TagMemberData;

export const EVENT_DATA_PARSERS: Record<string, any> = {
  account_subscribe: AccountSubscribeData,
  account_unsubscribe: AccountUnsubscribeData,
  staff_info: StaffInfoData,
  staff_modify: StaffModifyData,
  staff_create: StaffCreateData,
  staff_delete: StaffDeleteData,
  telephone_track: TelephoneTrackData,
  dept_create: DeptCreateData,
  dept_modify: DeptModifyData,
  dept_delete: DeptDeleteData,
  app_install_org: AppInstallData,
  app_uninstall_org: AppUninstallData,
  ua_cert_create: UaCertCreateData,
  ua_cert_delete: UaCertDeleteData,
  report_location: ReportLocationData,
  user_logout: UserLogoutData,
  data_scope: DataScopeData,
  bot_private_message: BotPrivateMessageData,
  bot_group_message: BotGroupMessageData,
  wb_visible_config: WbVisibleConfigData,
  group_create_approve: GroupCreateApproveData,
  schedule_modify: ScheduleModifyData,
  schedule_delete: ScheduleDeleteData,
  tag_member: TagMemberData,
};

export const FIELD_MAPS: Record<string, Record<string, string>> = {
  account_subscribe: { staffId: "staff_id", createTime: "create_time" },
  account_unsubscribe: { staffId: "staff_id", createTime: "create_time" },
  staff_info: { staffId: "staff_id", name: "name", mobile: "mobile", state: "state", sex: "sex", email: "email", employId: "employee_id", employeeId: "employee_id", avatarId: "avatar_id", timestamp: "timestamp" },
  staff_modify: { staffId: "staff_id", timestamp: "timestamp" },
  staff_create: { staffId: "staff_id", timestamp: "timestamp" },
  staff_delete: { staffId: "staff_id", timestamp: "timestamp" },
  telephone_track: { transactionId: "transaction_id", attach: "attach", confirmType: "confirm_type", timestamp: "timestamp" },
  dept_create: { deptId: "dept_id", timestamp: "timestamp" },
  dept_modify: { deptId: "dept_id", timestamp: "timestamp" },
  dept_delete: { deptId: "dept_id", timestamp: "timestamp" },
  app_install_org: { orgId: "org_id", orgName: "org_name", timestamp: "timestamp" },
  app_uninstall_org: { orgId: "org_id", orgName: "org_name", timestamp: "timestamp" },
  ua_cert_create: { staffId: "staff_id", deviceId: "device_id", uaCert: "ua_cert", timestamp: "timestamp" },
  ua_cert_delete: { staffId: "staff_id", deviceId: "device_id", timestamp: "timestamp" },
  report_location: {},
  user_logout: { staffId: "staff_id", deviceId: "device_id", timestamp: "timestamp" },
  data_scope: { deptIds: "dept_ids", timestamp: "timestamp" },
  bot_private_message: { from: "from_id", entryId: "entry_id", msgType: "msg_type", msgData: "msg_data" },
  bot_group_message: { from: "from_id", entryId: "entry_id", msgType: "msg_type", msgData: "msg_data", groupId: "group_id", fromType: "from_type", groupName: "group_name", botCreator: "bot_creator", msgId: "msg_id", botId: "bot_id", isAtMe: "is_at_me", isAtAll: "is_at_all" },
  wb_visible_config: { entryId: "entry_id", departmentIds: "department_ids", staffIds: "staff_ids", timestamp: "timestamp", isTestModeOn: "is_test_mode_on" },
  group_create_approve: { applyRequestId: "apply_request_id", groupId: "group_id", timestamp: "timestamp" },
  schedule_modify: { primaryScheduleId: "primary_schedule_id", scheduleId: "schedule_id", summary: "summary", description: "description", operationType: "operation_type", currentTime: "current_time", repeatType: "repeat_type", expireDateType: "expire_date_type", allDay: "all_day", rule: "rule", ruleStartTime: "rule_start_time", ruleEndTime: "rule_end_time", startTime: "start_time", endTime: "end_time", operator: "operator", attendees: "attendees", timestamp: "timestamp" },
  schedule_delete: { primaryScheduleId: "primary_schedule_id", scheduleId: "schedule_id", summary: "summary", description: "description", operationType: "operation_type", currentTime: "current_time", repeatType: "repeat_type", expireDateType: "expire_date_type", allDay: "all_day", rule: "rule", ruleStartTime: "rule_start_time", ruleEndTime: "rule_end_time", startTime: "start_time", endTime: "end_time", operator: "operator", timestamp: "timestamp" },
  tag_member: { tagId: "tag_id", timestamp: "timestamp" },
};

function _parseEventData(eventType: string, rawData: AnyDict): AnyDict | CallbackEventData {
  const parserCls = EVENT_DATA_PARSERS[eventType];
  if (!parserCls) return rawData;

  const fieldMap = FIELD_MAPS[eventType] || {};
  const kwargs: AnyDict = {};

  for (const [apiKey, tsKey] of Object.entries(fieldMap)) {
    const value = rawData[apiKey];
    if (value !== undefined && value !== null) kwargs[tsKey] = value;
  }

  if (eventType === "telephone_track") {
    const callerRaw = (typeof rawData.caller === "object" && rawData.caller) || {};
    const calleeRaw = (typeof rawData.callee === "object" && rawData.callee) || {};
    const callerInfo = (typeof callerRaw.mobilePhone === "object" && callerRaw.mobilePhone) || {};
    const calleeInfo = (typeof calleeRaw.mobilePhone === "object" && calleeRaw.mobilePhone) || {};
    kwargs.caller = new TelephoneTrackCallerData({
      staff_id: callerRaw.staffId || "",
      country_code: callerInfo.countryCode || "",
      number: callerInfo.number || "",
    });
    kwargs.callee = new TelephoneTrackCallerData({
      staff_id: calleeRaw.staffId || "",
      country_code: calleeInfo.countryCode || "",
      number: calleeInfo.number || "",
    });
  }

  if (eventType === "report_location") {
    kwargs.location_info = rawData.locationInfo || {};
  }

  return new parserCls(kwargs);
}

function _parseDecryptedPayload(payload: AnyDict): CallbackEvent[] {
  const events: CallbackEvent[] = [];
  let eventList = payload.events || [];
  if (!Array.isArray(eventList)) eventList = [eventList];

  const topAppId = payload.appId || "";
  const topOrgId = payload.orgId || "";

  for (const entry of eventList) {
    const eventType = entry.eventType || entry.type || "";
    const category = CALLBACK_EVENT_TYPES[eventType] || "unknown";
    let rawData = entry.data || {};
    if ((!rawData || (typeof rawData === "object" && Object.keys(rawData).length === 0)) && eventType) {
      rawData = entry;
    }
    const parsedData = _parseEventData(eventType, rawData);

    events.push(new CallbackEvent({
      event_id: entry.eventId || entry.id || 0,
      event_type: eventType,
      category,
      data: parsedData,
      app_id: entry.appId || topAppId,
      org_id: entry.orgId || topOrgId,
    }));
  }

  return events;
}

export function parseCallbackPayload(
  input: string,
  options?: {
    encodingKey?: string;
    verifySignature?: boolean;
    timestamp?: string;
    nonce?: string;
    signature?: string;
    callbackToken?: string;
    knownAppId?: string;
  },
): CallbackEvent[] {
  const opts = options || {};
  const encodingKey = opts.encodingKey || "";

  if (encodingKey && input.trim().startsWith("{")) {
    let payloadInner: AnyDict;
    try {
      payloadInner = JSON.parse(input);
    } catch {
      payloadInner = {};
    }
    const dataEncrypt = payloadInner.dataEncrypt || "";
    if (typeof dataEncrypt === "string" && dataEncrypt) {
      input = dataEncrypt;
    } else {
      if (opts.verifySignature) {
        if (!verifyCallbackSignature(
          opts.timestamp || "", opts.nonce || "", opts.signature || "",
          encodingKey, input, opts.callbackToken || "",
        )) {
          throw new Error("Callback signature verification failed");
        }
      }
      return _parseDecryptedPayload(payloadInner);
    }
  }

  if (encodingKey) {
    if (opts.verifySignature) {
      if (!verifyCallbackSignature(
        opts.timestamp || "", opts.nonce || "", opts.signature || "",
        encodingKey, input, opts.callbackToken || "",
      )) {
        throw new Error("Callback signature verification failed");
      }
    }

    const decrypted = decryptCallbackPayload(input, encodingKey, opts.knownAppId || "");
    const payload: AnyDict = {
      orgId: decrypted.orgId || "",
      appId: decrypted.appId || "",
      events: decrypted.events || [],
    };
    return _parseDecryptedPayload(payload);
  }

  const payload = JSON.parse(input);
  if ("dataEncrypt" in payload && !encodingKey) {
    throw new Error("Encrypted callback payload requires encodingKey for decryption");
  }
  if (opts.verifySignature && !verifyCallbackSignature(
    opts.timestamp || "", opts.nonce || "", opts.signature || "",
    encodingKey, input, opts.callbackToken || "",
  )) {
    throw new Error("Callback signature verification failed");
  }

  return _parseDecryptedPayload(payload);
}

export function verifyCallbackSignature(
  timestamp: string,
  nonce: string,
  signature: string,
  encodingKey: string,
  dataEncrypt: string = "",
  callbackToken?: string,
): boolean {
  const token = callbackToken || encodingKey;
  const params = [token, timestamp, nonce, dataEncrypt];
  params.sort();
  const joined = params.join("");
  const computed = crypto.createHash("sha1").update(joined, "utf8").digest("hex");
  return computed === signature;
}

export function decryptCallbackPayload(
  encryptedData: string,
  encodingKey: string,
  knownAppId: string = "",
): AnyDict {
  const keyBytes = _decodeAesKey(encodingKey);
  const aesKey = keyBytes.slice(0, 32);
  const iv = keyBytes.length >= 48 ? keyBytes.slice(32, 48) : keyBytes.slice(0, 16);

  const encBytes = Buffer.from(encryptedData, "base64");
  const randomPrefixLen = encBytes.readUInt32BE(0);
  const offset = 4 + randomPrefixLen + 32;
  const aesPayload = encBytes.slice(offset);

  const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
  const decrypted = Buffer.concat([decipher.update(aesPayload), decipher.final()]);
  const raw = _pkcs7Unpad(decrypted);

  if (raw.length < 20) {
    throw new Error(`Decrypted data too short: ${raw.length} bytes (need >= 20)`);
  }

  const randomStr = raw.slice(0, 16).toString("utf8");
  const eventsLen = raw.readUInt32BE(16);
  const totalAfterHeader = raw.length - 20;
  if (totalAfterHeader < eventsLen) {
    throw new Error(`Remaining data (${totalAfterHeader}B) shorter than declared events length (${eventsLen}B)`);
  }

  const eventsBytes = raw.slice(20 + totalAfterHeader - eventsLen);
  const middleBytes = raw.slice(20, 20 + totalAfterHeader - eventsLen);

  let eventsData = JSON.parse(eventsBytes.toString("utf8"));
  if (!Array.isArray(eventsData)) eventsData = [eventsData];

  const middleStr = middleBytes.toString("utf8");
  const [orgId, appId] = _splitOrgAppId(middleStr, knownAppId);

  return {
    random: randomStr,
    orgId,
    appId,
    events: eventsData,
    length: eventsLen,
  };
}

function _decodeAesKey(encodingKey: string): Buffer {
  if (encodingKey.length % 4 === 1) {
    throw new Error(`Invalid Base64 key length (${encodingKey.length}): length mod 4 = 1 is not valid Base64`);
  }
  const padded = encodingKey + "=".repeat((4 - encodingKey.length % 4) % 4);
  const keyBytes = Buffer.from(padded, "base64");
  if (keyBytes.length < 32) {
    throw new Error(`Invalid AES key length: ${keyBytes.length} bytes (need >= 32)`);
  }
  return keyBytes;
}

function _pkcs7Unpad(data: Buffer): Buffer {
  const padLen = data[data.length - 1];
  if (padLen < 1 || padLen > 32) {
    throw new Error(`Invalid PKCS7 padding: ${padLen}`);
  }
  for (let i = 0; i < padLen; i++) {
    if (data[data.length - 1 - i] !== padLen) {
      throw new Error("Invalid PKCS7 padding bytes");
    }
  }
  return data.slice(0, data.length - padLen);
}

function _splitOrgAppId(middleStr: string, knownAppId: string = ""): [string, string] {
  if (!middleStr) return ["", ""];
  if (knownAppId && middleStr.endsWith(knownAppId)) {
    return [middleStr.slice(0, -knownAppId.length), knownAppId];
  }
  if (knownAppId) {
    const idx = middleStr.indexOf(knownAppId);
    if (idx >= 0) return [middleStr.slice(0, idx), knownAppId];
  }
  return [middleStr, ""];
}

export function getCallbackEventTypes(): Record<string, string> {
  return CALLBACK_EVENT_TYPES;
}