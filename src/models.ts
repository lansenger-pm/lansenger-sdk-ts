type AnyDict = Record<string, any>;

export class SendMessageResult {
  success: boolean;
  message_id: string | null;
  error: string | null;
  platform: string;
  msg_type: string | null;
  operation: string | null;
  raw_response: AnyDict | null;
  retryable: boolean;

  constructor(init: {
    success: boolean;
    message_id?: string | null;
    error?: string | null;
    platform?: string;
    msg_type?: string | null;
    operation?: string | null;
    raw_response?: AnyDict | null;
    retryable?: boolean;
  }) {
    this.success = init.success;
    this.message_id = init.message_id ?? null;
    this.error = init.error ?? null;
    this.platform = init.platform ?? "lansenger";
    this.msg_type = init.msg_type ?? null;
    this.operation = init.operation ?? null;
    this.raw_response = init.raw_response ?? null;
    this.retryable = init.retryable ?? false;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, platform: this.platform };
    if (this.message_id !== null) d.message_id = this.message_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class StaffBasicInfoResult {
  success: boolean;
  org_id: string | null;
  org_name: string | null;
  name: string | null;
  gender: number | null;
  signature: string | null;
  avatar_url: string | null;
  avatar_id: string | null;
  status: number | null;
  departments: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: {
    success: boolean;
    org_id?: string | null;
    org_name?: string | null;
    name?: string | null;
    gender?: number | null;
    signature?: string | null;
    avatar_url?: string | null;
    avatar_id?: string | null;
    status?: number | null;
    departments?: AnyDict[] | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    this.org_id = init.org_id ?? null;
    this.org_name = init.org_name ?? null;
    this.name = init.name ?? null;
    this.gender = init.gender ?? null;
    this.signature = init.signature ?? null;
    this.avatar_url = init.avatar_url ?? null;
    this.avatar_id = init.avatar_id ?? null;
    this.status = init.status ?? null;
    this.departments = init.departments ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["org_id", "org_name", "name", "gender", "signature", "avatar_url", "avatar_id", "status", "departments"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class StaffDetailResult {
  success: boolean;
  name!: string | null;
  signature!: string | null;
  avatar_id!: string | null;
  avatar_url!: string | null;
  status!: number | null;
  departments!: AnyDict[] | null;
  gender!: number | null;
  org_id!: string | null;
  org_name!: string | null;
  login_name!: string | null;
  employee_number!: string | null;
  email!: string | null;
  external_id!: string | null;
  nationality!: string | null;
  birthdate!: string | null;
  id_number!: string | null;
  native_place!: string | null;
  duties!: string | null;
  parties!: string | null;
  address!: string | null;
  mobile_phone!: Record<string, string> | null;
  extra_phones!: Record<string, string>[] | null;
  introduction!: AnyDict | null;
  education!: AnyDict[] | null;
  career!: AnyDict[] | null;
  login_ways!: number[] | null;
  tags!: string[] | null;
  extra_field_set!: Record<string, string> | null;
  leaders!: string[] | null;
  join_date!: number | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    name?: string | null;
    signature?: string | null;
    avatar_id?: string | null;
    avatar_url?: string | null;
    status?: number | null;
    departments?: AnyDict[] | null;
    gender?: number | null;
    org_id?: string | null;
    org_name?: string | null;
    login_name?: string | null;
    employee_number?: string | null;
    email?: string | null;
    external_id?: string | null;
    nationality?: string | null;
    birthdate?: string | null;
    id_number?: string | null;
    native_place?: string | null;
    duties?: string | null;
    parties?: string | null;
    address?: string | null;
    mobile_phone?: Record<string, string> | null;
    extra_phones?: Record<string, string>[] | null;
    introduction?: AnyDict | null;
    education?: AnyDict[] | null;
    career?: AnyDict[] | null;
    login_ways?: number[] | null;
    tags?: string[] | null;
    extra_field_set?: Record<string, string> | null;
    leaders?: string[] | null;
    join_date?: number | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["name", "signature", "avatar_id", "avatar_url", "status", "departments", "gender", "org_id", "org_name", "login_name", "employee_number", "email", "external_id", "nationality", "birthdate", "id_number", "native_place", "duties", "parties", "address", "mobile_phone", "extra_phones", "introduction", "education", "career", "login_ways", "tags", "extra_field_set", "leaders", "join_date", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["name", "signature", "avatar_id", "avatar_url", "status", "departments", "gender", "org_id", "org_name", "login_name", "employee_number", "email", "external_id", "nationality", "birthdate", "id_number", "native_place", "duties", "parties", "address", "mobile_phone", "extra_phones", "introduction", "education", "career", "login_ways", "tags", "extra_field_set", "leaders", "join_date"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class DepartmentAncestorsResult {
  success: boolean;
  ancestor_groups: Record<string, string>[][] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; ancestor_groups?: Record<string, string>[][] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.ancestor_groups = init.ancestor_groups ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.ancestor_groups !== null) d.ancestor_groups = this.ancestor_groups;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class StaffIdMappingResult {
  success: boolean;
  staff_id: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; staff_id?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.staff_id = init.staff_id ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.staff_id !== null) d.staff_id = this.staff_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class OrgInfoResult {
  success: boolean;
  org_id: string | null;
  org_name: string | null;
  icon_url: string | null;
  org_max_member_limit: number | null;
  org_order_type: number | null;
  org_days_limit: number | null;
  org_billing_date: number | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: {
    success: boolean;
    org_id?: string | null;
    org_name?: string | null;
    icon_url?: string | null;
    org_max_member_limit?: number | null;
    org_order_type?: number | null;
    org_days_limit?: number | null;
    org_billing_date?: number | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    this.org_id = init.org_id ?? null;
    this.org_name = init.org_name ?? null;
    this.icon_url = init.icon_url ?? null;
    this.org_max_member_limit = init.org_max_member_limit ?? null;
    this.org_order_type = init.org_order_type ?? null;
    this.org_days_limit = init.org_days_limit ?? null;
    this.org_billing_date = init.org_billing_date ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["org_id", "org_name", "icon_url", "org_max_member_limit", "org_order_type", "org_days_limit", "org_billing_date"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ExtraFieldIdsResult {
  success: boolean;
  has_more: boolean;
  total: number;
  extra_field_ids: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; has_more?: boolean; total?: number; extra_field_ids?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.has_more = init.has_more ?? false;
    this.total = init.total ?? 0;
    this.extra_field_ids = init.extra_field_ids ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, has_more: this.has_more, total: this.total };
    if (this.extra_field_ids !== null) d.extra_field_ids = this.extra_field_ids;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class StaffSearchResult {
  success: boolean;
  has_more: boolean;
  total: number;
  staff_info: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; has_more?: boolean; total?: number; staff_info?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.has_more = init.has_more ?? false;
    this.total = init.total ?? 0;
    this.staff_info = init.staff_info ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, has_more: this.has_more, total: this.total };
    if (this.staff_info !== null) d.staff_info = this.staff_info;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class QueryGroupsResult {
  success: boolean;
  total_group_ids: number;
  group_ids: string[];
  error: string | null;
  platform: string;
  operation: string;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total_group_ids?: number; group_ids?: string[]; error?: string | null; platform?: string; operation?: string; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total_group_ids = init.total_group_ids ?? 0;
    this.group_ids = init.group_ids ?? [];
    this.error = init.error ?? null;
    this.platform = init.platform ?? "lansenger";
    this.operation = init.operation ?? "query_groups";
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = {
      success: this.success,
      total_group_ids: this.total_group_ids,
      group_ids: this.group_ids,
      platform: this.platform,
      operation: this.operation,
    };
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class UploadMediaResult {
  success: boolean;
  media_id: string | null;
  created_time: string | null;
  raw_response: AnyDict | null;
  error: string | null;

  constructor(init: { success: boolean; media_id?: string | null; created_time?: string | null; raw_response?: AnyDict | null; error?: string | null }) {
    this.success = init.success;
    this.media_id = init.media_id ?? null;
    this.created_time = init.created_time ?? null;
    this.raw_response = init.raw_response ?? null;
    this.error = init.error ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.media_id !== null) d.media_id = this.media_id;
    if (this.created_time !== null) d.created_time = this.created_time;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class DownloadMediaResult {
  success: boolean;
  data: Buffer | null;
  error: string | null;

  constructor(init: { success: boolean; data?: Buffer | null; error?: string | null }) {
    this.success = init.success;
    this.data = init.data ?? null;
    this.error = init.error ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.data !== null) d.size = this.data.length;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class MediaPathResult {
  success: boolean;
  media_path: string | null;
  name: string | null;
  type: string | null;
  size: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; media_path?: string | null; name?: string | null; type?: string | null; size?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.media_path = init.media_path ?? null;
    this.name = init.name ?? null;
    this.type = init.type ?? null;
    this.size = init.size ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["media_path", "name", "type", "size"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class AppCardParams {
  body_title: string;
  chat_id: string;
  head_title: string;
  body_sub_title: string;
  body_content: string;
  signature: string;
  fields: Record<string, string>[] | null;
  links: Record<string, string>[] | null;
  card_link: string;
  pc_card_link: string;
  pad_card_link: string;
  is_dynamic: boolean;
  head_status_info: Record<string, string> | null;
  staff_id: string;
  head_icon_url: string;
  is_group: boolean;
  user_token: string;
  sender_id: string;

  constructor(init: {
    body_title: string;
    chat_id?: string;
    head_title?: string;
    body_sub_title?: string;
    body_content?: string;
    signature?: string;
    fields?: Record<string, string>[] | null;
    links?: Record<string, string>[] | null;
    card_link?: string;
    pc_card_link?: string;
    pad_card_link?: string;
    is_dynamic?: boolean;
    head_status_info?: Record<string, string> | null;
    staff_id?: string;
    head_icon_url?: string;
    is_group?: boolean;
    user_token?: string;
    sender_id?: string;
  }) {
    this.body_title = init.body_title;
    this.chat_id = init.chat_id ?? "";
    this.head_title = init.head_title ?? "";
    this.body_sub_title = init.body_sub_title ?? "";
    this.body_content = init.body_content ?? "";
    this.signature = init.signature ?? "";
    this.fields = init.fields ?? null;
    this.links = init.links ?? null;
    this.card_link = init.card_link ?? "";
    this.pc_card_link = init.pc_card_link ?? "";
    this.pad_card_link = init.pad_card_link ?? "";
    this.is_dynamic = init.is_dynamic ?? false;
    this.head_status_info = init.head_status_info ?? null;
    this.staff_id = init.staff_id ?? "";
    this.head_icon_url = init.head_icon_url ?? "";
    this.is_group = init.is_group ?? false;
    this.user_token = init.user_token ?? "";
    this.sender_id = init.sender_id ?? "";
  }
}

export class LinkCardParams {
  chat_id: string;
  title: string;
  link: string;
  description: string;
  icon_link: string;
  pc_link: string;
  pad_link: string;
  from_name: string;
  from_icon_link: string;
  is_group: boolean;
  user_token: string;
  sender_id: string;

  constructor(init: {
    chat_id?: string;
    title?: string;
    link?: string;
    description?: string;
    icon_link?: string;
    pc_link?: string;
    pad_link?: string;
    from_name?: string;
    from_icon_link?: string;
    is_group?: boolean;
    user_token?: string;
    sender_id?: string;
  }) {
    this.chat_id = init.chat_id ?? "";
    this.title = init.title ?? "";
    this.link = init.link ?? "";
    this.description = init.description ?? "";
    this.icon_link = init.icon_link ?? "";
    this.pc_link = init.pc_link ?? "";
    this.pad_link = init.pad_link ?? "";
    this.from_name = init.from_name ?? "";
    this.from_icon_link = init.from_icon_link ?? "";
    this.is_group = init.is_group ?? false;
    this.user_token = init.user_token ?? "";
    this.sender_id = init.sender_id ?? "";
  }
}

export class OaCardParams {
  chat_id: string;
  head: string;
  title: string;
  sub_title: string;
  staff_id: string;
  fields: Record<string, string>[] | null;
  link: string;
  pc_link: string;
  pad_link: string;
  card_action: AnyDict | null;
  is_group: boolean;
  user_token: string;
  sender_id: string;

  constructor(init: {
    chat_id?: string;
    head?: string;
    title?: string;
    sub_title?: string;
    staff_id?: string;
    fields?: Record<string, string>[] | null;
    link?: string;
    pc_link?: string;
    pad_link?: string;
    card_action?: AnyDict | null;
    is_group?: boolean;
    user_token?: string;
    sender_id?: string;
  }) {
    this.chat_id = init.chat_id ?? "";
    this.head = init.head ?? "";
    this.title = init.title ?? "";
    this.sub_title = init.sub_title ?? "";
    this.staff_id = init.staff_id ?? "";
    this.fields = init.fields ?? null;
    this.link = init.link ?? "";
    this.pc_link = init.pc_link ?? "";
    this.pad_link = init.pad_link ?? "";
    this.card_action = init.card_action ?? null;
    this.is_group = init.is_group ?? false;
    this.user_token = init.user_token ?? "";
    this.sender_id = init.sender_id ?? "";
  }
}

export class DynamicCardUpdateParams {
  msg_id: string;
  head_status_info: Record<string, string> | null;
  links: Record<string, string>[] | null;
  is_last_update: boolean;

  constructor(init: { msg_id: string; head_status_info?: Record<string, string> | null; links?: Record<string, string>[] | null; is_last_update?: boolean }) {
    this.msg_id = init.msg_id;
    this.head_status_info = init.head_status_info ?? null;
    this.links = init.links ?? null;
    this.is_last_update = init.is_last_update ?? false;
  }
}

export class ApproveCardParams {
  chat_id: string = "";
  body_title: string = "";
  body_content: string = "";
  head_title: string = "";
  head_icon_link: string = "";
  head_icon_id: string = "";
  head_status_describe: string = "";
  head_status_icon: number = 0;
  head_status_icon_link: string = "";
  head_status_colour: string = "";
  body_format_type: number = 1;
  fields?: Record<string, string>[];
  reminder_all: boolean = false;
  reminder_user_ids?: string[];
  reminder_bot_ids?: string[];
  card_link: string = "";
  card_link_for_pc: string = "";
  card_link_for_pad: string = "";
  buttons?: Record<string, any>[];
  expire_time: number = 0;
  is_group: boolean = false;
  user_token: string = "";
  sender_id: string = "";

  constructor(data?: Partial<ApproveCardParams>) {
    if (data) Object.assign(this, data);
  }
}

export class ApproveCardUpdateParams {
  msg_id: string = "";
  head_status_describe: string = "";
  head_status_icon: number = 0;
  head_status_icon_link: string = "";
  head_status_colour: string = "";
  buttons?: Record<string, any>[];

  constructor(data?: Partial<ApproveCardUpdateParams>) {
    if (data) Object.assign(this, data);
  }
}

export class UserTokenResult {
  success: boolean;
  user_token: string | null;
  expires_in: number;
  refresh_token: string | null;
  refresh_expires_in: number;
  staff_id: string | null;
  scope: string | null;
  state: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: {
    success: boolean;
    user_token?: string | null;
    expires_in?: number;
    refresh_token?: string | null;
    refresh_expires_in?: number;
    staff_id?: string | null;
    scope?: string | null;
    state?: string | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    this.user_token = init.user_token ?? null;
    this.expires_in = init.expires_in ?? 7200;
    this.refresh_token = init.refresh_token ?? null;
    this.refresh_expires_in = init.refresh_expires_in ?? 2592000;
    this.staff_id = init.staff_id ?? null;
    this.scope = init.scope ?? null;
    this.state = init.state ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.user_token !== null) {
      d.user_token = this.user_token;
      d.expires_in = this.expires_in;
    }
    if (this.refresh_token !== null) {
      d.refresh_token = this.refresh_token;
      d.refresh_expires_in = this.refresh_expires_in;
    }
    if (this.staff_id !== null) d.staff_id = this.staff_id;
    if (this.scope !== null) d.scope = this.scope;
    if (this.state !== null) d.state = this.state;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class UserInfoResult {
  success: boolean;
  staff_id: string | null;
  name: string | null;
  org_id: string | null;
  org_name: string | null;
  avatar_id: string | null;
  avatar_url: string | null;
  mobile_phone: Record<string, string> | null;
  email: string | null;
  employee_number: string | null;
  login_name: string | null;
  external_id: string | null;
  department: Record<string, string>[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: {
    success: boolean;
    staff_id?: string | null;
    name?: string | null;
    org_id?: string | null;
    org_name?: string | null;
    avatar_id?: string | null;
    avatar_url?: string | null;
    mobile_phone?: Record<string, string> | null;
    email?: string | null;
    employee_number?: string | null;
    login_name?: string | null;
    external_id?: string | null;
    department?: Record<string, string>[] | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    this.staff_id = init.staff_id ?? null;
    this.name = init.name ?? null;
    this.org_id = init.org_id ?? null;
    this.org_name = init.org_name ?? null;
    this.avatar_id = init.avatar_id ?? null;
    this.avatar_url = init.avatar_url ?? null;
    this.mobile_phone = init.mobile_phone ?? null;
    this.email = init.email ?? null;
    this.employee_number = init.employee_number ?? null;
    this.login_name = init.login_name ?? null;
    this.external_id = init.external_id ?? null;
    this.department = init.department ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.staff_id !== null) d.staff_id = this.staff_id;
    if (this.name !== null) d.name = this.name;
    if (this.org_id !== null) d.org_id = this.org_id;
    if (this.org_name !== null) d.org_name = this.org_name;
    if (this.avatar_id !== null) d.avatar_id = this.avatar_id;
    if (this.avatar_url !== null) d.avatar_url = this.avatar_url;
    if (this.email !== null) d.email = this.email;
    if (this.employee_number !== null) d.employee_number = this.employee_number;
    if (this.login_name !== null) d.login_name = this.login_name;
    if (this.external_id !== null) d.external_id = this.external_id;
    if (this.mobile_phone !== null) d.mobile_phone = this.mobile_phone;
    if (this.department !== null) d.department = this.department;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class AccountMessageResult {
  success: boolean;
  message_id: string | null;
  invalid_staff: string[] | null;
  invalid_department: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; message_id?: string | null; invalid_staff?: string[] | null; invalid_department?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.message_id = init.message_id ?? null;
    this.invalid_staff = init.invalid_staff ?? null;
    this.invalid_department = init.invalid_department ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.message_id !== null) d.message_id = this.message_id;
    if (this.invalid_staff !== null) d.invalid_staff = this.invalid_staff;
    if (this.invalid_department !== null) d.invalid_department = this.invalid_department;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class UserMessageResult {
  success: boolean;
  message_id: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; message_id?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.message_id = init.message_id ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.message_id !== null) d.message_id = this.message_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class BotMessageResult {
  success: boolean;
  message_id: string | null;
  invalid_staff: string[] | null;
  invalid_department: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; message_id?: string | null; invalid_staff?: string[] | null; invalid_department?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.message_id = init.message_id ?? null;
    this.invalid_staff = init.invalid_staff ?? null;
    this.invalid_department = init.invalid_department ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.message_id !== null) d.message_id = this.message_id;
    if (this.invalid_staff !== null) d.invalid_staff = this.invalid_staff;
    if (this.invalid_department !== null) d.invalid_department = this.invalid_department;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class StreamMessageResult {
  success: boolean;
  message_id: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; message_id?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.message_id = init.message_id ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.message_id !== null) d.message_id = this.message_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class GroupCreateInfo {
  name: string;
  org_id: string;
  owner_id: string;
  description: string;
  avatar_id: string;
  staff_id_list: string[] | null;
  department_id_list: string[] | null;
  apply_request_id: string;
  apply_notes: string;
  apply_global_unique_id: string;
  apply_session_unique_id: string;

  constructor(init: {
    name: string;
    org_id: string;
    owner_id?: string;
    description?: string;
    avatar_id?: string;
    staff_id_list?: string[] | null;
    department_id_list?: string[] | null;
    apply_request_id?: string;
    apply_notes?: string;
    apply_global_unique_id?: string;
    apply_session_unique_id?: string;
  }) {
    this.name = init.name;
    this.org_id = init.org_id;
    this.owner_id = init.owner_id ?? "";
    this.description = init.description ?? "";
    this.avatar_id = init.avatar_id ?? "";
    this.staff_id_list = init.staff_id_list ?? null;
    this.department_id_list = init.department_id_list ?? null;
    this.apply_request_id = init.apply_request_id ?? "";
    this.apply_notes = init.apply_notes ?? "";
    this.apply_global_unique_id = init.apply_global_unique_id ?? "";
    this.apply_session_unique_id = init.apply_session_unique_id ?? "";
  }
}

export class CreateGroupResult {
  success: boolean;
  group_id: string | null;
  total_members: number;
  invalid_staff: string[] | null;
  invalid_department: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; group_id?: string | null; total_members?: number; invalid_staff?: string[] | null; invalid_department?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.group_id = init.group_id ?? null;
    this.total_members = init.total_members ?? 0;
    this.invalid_staff = init.invalid_staff ?? null;
    this.invalid_department = init.invalid_department ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.group_id !== null) d.group_id = this.group_id;
    d.total_members = this.total_members;
    if (this.invalid_staff !== null) d.invalid_staff = this.invalid_staff;
    if (this.invalid_department !== null) d.invalid_department = this.invalid_department;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class GroupInfoResult {
  success: boolean;
  name!: string | null;
  description!: string | null;
  avatar_id!: string | null;
  avatar_url!: string | null;
  owner!: Record<string, string> | null;
  creator!: Record<string, string> | null;
  state!: number | null;
  manage_mode!: number | null;
  location_share!: number | null;
  needs_confirm!: number | null;
  is_public!: number | null;
  max_members!: number | null;
  max_history_msg_count!: number | null;
  total_members!: number | null;
  remind_all!: boolean | null;
  send_msg_status!: boolean | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    name?: string | null;
    description?: string | null;
    avatar_id?: string | null;
    avatar_url?: string | null;
    owner?: Record<string, string> | null;
    creator?: Record<string, string> | null;
    state?: number | null;
    manage_mode?: number | null;
    location_share?: boolean | null;
    needs_confirm?: boolean | null;
    is_public?: boolean | null;
    max_members?: number | null;
    max_history_msg_count?: number | null;
    total_members?: number | null;
    remind_all?: boolean | null;
    send_msg_status?: boolean | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["name", "description", "avatar_id", "avatar_url", "owner", "creator", "state", "manage_mode", "location_share", "needs_confirm", "is_public", "max_members", "max_history_msg_count", "total_members", "remind_all", "send_msg_status", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["name", "description", "avatar_id", "avatar_url", "owner", "creator", "state", "manage_mode", "location_share", "needs_confirm", "is_public", "max_members", "max_history_msg_count", "total_members", "remind_all", "send_msg_status"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class GroupMemberResult {
  success: boolean;
  total_members: number;
  members: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total_members?: number; members?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total_members = init.total_members ?? 0;
    this.members = init.members ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total_members: this.total_members };
    if (this.members !== null) d.members = this.members;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class UpdateGroupResult {
  success: boolean;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class UpdateGroupMembersResult {
  success: boolean;
  total_members: number;
  added_staff_count: number;
  deleted_staff_count: number;
  invalid_staff: string[] | null;
  invalid_department: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total_members?: number; added_staff_count?: number; deleted_staff_count?: number; invalid_staff?: string[] | null; invalid_department?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total_members = init.total_members ?? 0;
    this.added_staff_count = init.added_staff_count ?? 0;
    this.deleted_staff_count = init.deleted_staff_count ?? 0;
    this.invalid_staff = init.invalid_staff ?? null;
    this.invalid_department = init.invalid_department ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total_members: this.total_members, added_staff_count: this.added_staff_count, deleted_staff_count: this.deleted_staff_count };
    if (this.invalid_staff !== null) d.invalid_staff = this.invalid_staff;
    if (this.invalid_department !== null) d.invalid_department = this.invalid_department;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class GroupListResult {
  success: boolean;
  total_group_ids: number;
  group_ids: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total_group_ids?: number; group_ids?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total_group_ids = init.total_group_ids ?? 0;
    this.group_ids = init.group_ids ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total_group_ids: this.total_group_ids };
    if (this.group_ids !== null) d.group_ids = this.group_ids;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class IsInGroupResult {
  success: boolean;
  is_in_group: boolean;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; is_in_group?: boolean; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.is_in_group = init.is_in_group ?? false;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, is_in_group: this.is_in_group };
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class DepartmentDetailResult {
  success: boolean;
  id!: string | null;
  name!: string | null;
  external_id!: string | null;
  parent_id!: string | null;
  order!: number | null;
  has_children!: boolean | null;
  normal_members!: number | null;
  inactive_members!: number | null;
  frozen_members!: number | null;
  deleted_members!: number | null;
  tags!: string[] | null;
  ancestor_departments!: Record<string, string>[] | null;
  leaders!: string[] | null;
  emails!: string[] | null;
  phones!: string[] | null;
  addresses!: string[] | null;
  introductions!: string[] | null;
  dept_type!: number | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    id?: string | null;
    name?: string | null;
    external_id?: string | null;
    parent_id?: string | null;
    order?: number | null;
    has_children?: boolean | null;
    normal_members?: number | null;
    inactive_members?: number | null;
    frozen_members?: number | null;
    deleted_members?: number | null;
    tags?: string[] | null;
    ancestor_departments?: Record<string, string>[] | null;
    leaders?: string[] | null;
    emails?: string[] | null;
    phones?: string[] | null;
    addresses?: string[] | null;
    introductions?: string[] | null;
    dept_type?: number | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["id", "name", "external_id", "parent_id", "order", "has_children", "normal_members", "inactive_members", "frozen_members", "deleted_members", "tags", "ancestor_departments", "leaders", "emails", "phones", "addresses", "introductions", "dept_type", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["id", "name", "external_id", "parent_id", "order", "has_children", "normal_members", "inactive_members", "frozen_members", "deleted_members", "tags", "ancestor_departments", "leaders", "emails", "phones", "addresses", "introductions", "dept_type"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class DepartmentChildrenResult {
  success: boolean;
  departments: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; departments?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.departments = init.departments ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.departments !== null) d.departments = this.departments;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class DepartmentStaffsResult {
  success: boolean;
  has_more: boolean;
  total: number;
  staffs: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; has_more?: boolean; total?: number; staffs?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.has_more = init.has_more ?? false;
    this.total = init.total ?? 0;
    this.staffs = init.staffs ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, has_more: this.has_more, total: this.total };
    if (this.staffs !== null) d.staffs = this.staffs;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class TodoTaskCreateResult {
  success: boolean;
  todotask_id: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; todotask_id?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.todotask_id = init.todotask_id ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.todotask_id !== null) d.todotask_id = this.todotask_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class TodoTaskInfoResult {
  success: boolean;
  todotask_id!: string | null;
  source_id!: string | null;
  title!: string | null;
  desc!: string | null;
  status!: string | null;
  type!: number | null;
  link!: string | null;
  pc_link!: string | null;
  sender_id!: string | null;
  executor_ids!: string[] | null;
  create_time!: string | null;
  app_id!: string | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    todotask_id?: string | null;
    source_id?: string | null;
    title?: string | null;
    desc?: string | null;
    status?: string | null;
    type?: number | null;
    link?: string | null;
    pc_link?: string | null;
    sender_id?: string | null;
    executor_ids?: string[] | null;
    create_time?: string | null;
    app_id?: string | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["todotask_id", "source_id", "title", "desc", "status", "type", "link", "pc_link", "sender_id", "executor_ids", "create_time", "app_id", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["todotask_id", "source_id", "title", "desc", "status", "type", "link", "pc_link", "sender_id", "executor_ids", "create_time", "app_id"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class TodoTaskListResult {
  success: boolean;
  total: number;
  todotask_list: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total?: number; todotask_list?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total = init.total ?? 0;
    this.todotask_list = init.todotask_list ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total: this.total };
    if (this.todotask_list !== null) d.todotask_list = this.todotask_list;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class TodoTaskStatusCountResult {
  success: boolean;
  status_counts: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; status_counts?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.status_counts = init.status_counts ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.status_counts !== null) d.status_counts = this.status_counts;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class TodoTaskExecutorListResult {
  success: boolean;
  total: number;
  executor_list: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total?: number; executor_list?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total = init.total ?? 0;
    this.executor_list = init.executor_list ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total: this.total };
    if (this.executor_list !== null) d.executor_list = this.executor_list;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class CalendarPrimaryResult {
  success: boolean;
  calendar_id!: string | null;
  summary!: string | null;
  description!: string | null;
  permissions!: string | null;
  color!: string | null;
  type!: string | null;
  role!: string | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    calendar_id?: string | null;
    summary?: string | null;
    description?: string | null;
    permissions?: string | null;
    color?: string | null;
    type?: string | null;
    role?: string | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["calendar_id", "summary", "description", "permissions", "color", "type", "role", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["calendar_id", "summary", "description", "permissions", "color", "type", "role"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleCreateResult {
  success: boolean;
  schedule_id: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; schedule_id?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.schedule_id = init.schedule_id ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.schedule_id !== null) d.schedule_id = this.schedule_id;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleInfoResult {
  success: boolean;
  schedule_id!: string | null;
  summary!: string | null;
  description!: string | null;
  repeat_type!: string | null;
  all_day!: string | null;
  start_time!: AnyDict | null;
  end_time!: AnyDict | null;
  creator!: AnyDict | null;
  rsvp_status!: string | null;
  error!: string | null;
  raw_response!: AnyDict | null;

  constructor(init: {
    success: boolean;
    schedule_id?: string | null;
    summary?: string | null;
    description?: string | null;
    repeat_type?: string | null;
    all_day?: string | null;
    start_time?: AnyDict | null;
    end_time?: AnyDict | null;
    creator?: AnyDict | null;
    rsvp_status?: string | null;
    error?: string | null;
    raw_response?: AnyDict | null;
  }) {
    this.success = init.success;
    const keys = ["schedule_id", "summary", "description", "repeat_type", "all_day", "start_time", "end_time", "creator", "rsvp_status", "error", "raw_response"] as const;
    for (const k of keys) {
      (this as any)[k] = init[k] ?? null;
    }
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    for (const key of ["schedule_id", "summary", "description", "repeat_type", "all_day", "start_time", "end_time", "creator", "rsvp_status"] as const) {
      const v = (this as any)[key];
      if (v !== null) d[key] = v;
    }
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleListResult {
  success: boolean;
  schedule_list: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; schedule_list?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.schedule_list = init.schedule_list ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.schedule_list !== null) d.schedule_list = this.schedule_list;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleAttendeesResult {
  success: boolean;
  total: number;
  attendees: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; total?: number; attendees?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.total = init.total ?? 0;
    this.attendees = init.attendees ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, total: this.total };
    if (this.attendees !== null) d.attendees = this.attendees;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleUpdateResult {
  success: boolean;
  schedule_ids: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; schedule_ids?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.schedule_ids = init.schedule_ids ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.schedule_ids !== null) d.schedule_ids = this.schedule_ids;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleAttendeeMetaResult {
  success: boolean;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ScheduleAttendeesUpdateResult {
  success: boolean;
  schedule_ids: string[] | null;
  failed_attendees: string[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; schedule_ids?: string[] | null; failed_attendees?: string[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.schedule_ids = init.schedule_ids ?? null;
    this.failed_attendees = init.failed_attendees ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.schedule_ids !== null) d.schedule_ids = this.schedule_ids;
    if (this.failed_attendees !== null) d.failed_attendees = this.failed_attendees;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class BotCommandResult {
  success: boolean;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class BotCommandQueryResult {
  success: boolean;
  scope_type: number | null;
  chat_id: string | null;
  chat_type: string | null;
  staff_id: string | null;
  commands: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; scope_type?: number | null; chat_id?: string | null; chat_type?: string | null; staff_id?: string | null; commands?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.scope_type = init.scope_type ?? null;
    this.chat_id = init.chat_id ?? null;
    this.chat_type = init.chat_type ?? null;
    this.staff_id = init.staff_id ?? null;
    this.commands = init.commands ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.scope_type !== null) d.scope_type = this.scope_type;
    if (this.chat_id !== null) d.chat_id = this.chat_id;
    if (this.chat_type !== null) d.chat_type = this.chat_type;
    if (this.staff_id !== null) d.staff_id = this.staff_id;
    if (this.commands !== null) d.commands = this.commands;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class PersonalAppCreateResult {
  success: boolean;
  app_id: string | null;
  secret: string | null;
  apigw_addr: string | null;
  passport_addr: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; app_id?: string | null; secret?: string | null; apigw_addr?: string | null; passport_addr?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.app_id = init.app_id ?? null;
    this.secret = init.secret ?? null;
    this.apigw_addr = init.apigw_addr ?? null;
    this.passport_addr = init.passport_addr ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.app_id !== null) d.app_id = this.app_id;
    if (this.secret !== null) d.secret = this.secret;
    if (this.apigw_addr !== null) d.apigw_addr = this.apigw_addr;
    if (this.passport_addr !== null) d.passport_addr = this.passport_addr;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class PersonalAppInfoResult {
  success: boolean;
  app_id: string | null;
  name: string | null;
  avatar_id: string | null;
  description: string | null;
  apigw_addr: string | null;
  passport_addr: string | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; app_id?: string | null; name?: string | null; avatar_id?: string | null; description?: string | null; apigw_addr?: string | null; passport_addr?: string | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.app_id = init.app_id ?? null;
    this.name = init.name ?? null;
    this.avatar_id = init.avatar_id ?? null;
    this.description = init.description ?? null;
    this.apigw_addr = init.apigw_addr ?? null;
    this.passport_addr = init.passport_addr ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.app_id !== null) d.app_id = this.app_id;
    if (this.name !== null) d.name = this.name;
    if (this.avatar_id !== null) d.avatar_id = this.avatar_id;
    if (this.description !== null) d.description = this.description;
    if (this.apigw_addr !== null) d.apigw_addr = this.apigw_addr;
    if (this.passport_addr !== null) d.passport_addr = this.passport_addr;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class PersonalAppListResult {
  success: boolean;
  app_list: AnyDict[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; app_list?: AnyDict[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.app_list = init.app_list ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.app_list !== null) d.app_list = this.app_list;
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ChatStaffInfo {
  staff_id: string;
  staff_name: string;
  sector_names: string[] | null;

  constructor(init: { staff_id?: string; staff_name?: string; sector_names?: string[] | null }) {
    this.staff_id = init.staff_id ?? "";
    this.staff_name = init.staff_name ?? "";
    this.sector_names = init.sector_names ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { staff_id: this.staff_id, staff_name: this.staff_name };
    if (this.sector_names !== null) d.sector_names = this.sector_names;
    return d;
  }
}

export class ChatGroupInfo {
  group_id: string;
  group_name: string;

  constructor(init: { group_id?: string; group_name?: string }) {
    this.group_id = init.group_id ?? "";
    this.group_name = init.group_name ?? "";
  }

  toDict(): AnyDict {
    return { group_id: this.group_id, group_name: this.group_name };
  }
}

export class ChatListResult {
  success: boolean;
  staff_infos: ChatStaffInfo[] | null;
  group_infos: ChatGroupInfo[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; staff_infos?: ChatStaffInfo[] | null; group_infos?: ChatGroupInfo[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.staff_infos = init.staff_infos ?? null;
    this.group_infos = init.group_infos ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success };
    if (this.staff_infos !== null) d.staff_infos = this.staff_infos.map(s => s.toDict());
    if (this.group_infos !== null) d.group_infos = this.group_infos.map(g => g.toDict());
    if (this.error !== null) d.error = this.error;
    return d;
  }
}

export class ChatMessageInfo {
  send_time: string;
  sender: string;
  message_type: string;
  content: AnyDict | null;

  constructor(init: { send_time?: string; sender?: string; message_type?: string; content?: AnyDict | null }) {
    this.send_time = init.send_time ?? "";
    this.sender = init.sender ?? "";
    this.message_type = init.message_type ?? "";
    this.content = init.content ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { send_time: this.send_time, sender: this.sender, message_type: this.message_type };
    if (this.content !== null) d.content = this.content;
    return d;
  }

  plainText(): string {
    const content = this.content;
    if (content === null || content === undefined) return "";
    if (typeof content === "string") return content;
    if (typeof content === "object") {
      if ("text" in content && content.text) return content.text;
      if ("formatText" in content && typeof content.formatText === "object" && content.formatText !== null) {
        return content.formatText.content || "";
      }
    }
    return "";
  }
}

export class ChatMessagesResult {
  success: boolean;
  has_more: boolean;
  total: number;
  last_version: string;
  name: string;
  chat_type: string;
  messages: ChatMessageInfo[] | null;
  error: string | null;
  raw_response: AnyDict | null;

  constructor(init: { success: boolean; has_more?: boolean; total?: number; last_version?: string; name?: string; chat_type?: string; messages?: ChatMessageInfo[] | null; error?: string | null; raw_response?: AnyDict | null }) {
    this.success = init.success;
    this.has_more = init.has_more ?? false;
    this.total = init.total ?? 0;
    this.last_version = init.last_version ?? "";
    this.name = init.name ?? "";
    this.chat_type = init.chat_type ?? "";
    this.messages = init.messages ?? null;
    this.error = init.error ?? null;
    this.raw_response = init.raw_response ?? null;
  }

  toDict(): AnyDict {
    const d: AnyDict = { success: this.success, has_more: this.has_more, total: this.total, last_version: this.last_version, name: this.name, chat_type: this.chat_type };
    if (this.messages !== null) d.messages = this.messages.map(m => m.toDict());
    if (this.error !== null) d.error = this.error;
    return d;
  }
}