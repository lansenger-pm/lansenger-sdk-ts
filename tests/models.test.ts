import {
  SendMessageResult, StaffBasicInfoResult, UserTokenResult,
  GroupInfoResult, CreateGroupResult, TodoTaskCreateResult,
  CalendarPrimaryResult, ScheduleCreateResult, ChatListResult,
  ChatStaffInfo, ChatGroupInfo, ChatMessageInfo, ChatMessagesResult,
  StaffDetailResult, DepartmentAncestorsResult, StaffIdMappingResult,
  OrgInfoResult, UploadMediaResult, QueryGroupsResult,
  GroupMemberResult, GroupListResult, IsInGroupResult,
  UpdateGroupResult, UpdateGroupMembersResult,
  TodoTaskInfoResult, TodoTaskListResult, TodoTaskStatusCountResult,
  TodoTaskExecutorListResult, ScheduleInfoResult, ScheduleListResult,
  ScheduleAttendeesResult, ScheduleUpdateResult, ScheduleAttendeeMetaResult,
  AppCardParams, LinkCardParams, OaCardParams,
  DynamicCardUpdateParams, GroupCreateInfo,
  DepartmentDetailResult, DepartmentChildrenResult, DepartmentStaffsResult,
  ExtraFieldIdsResult, StaffSearchResult,
  AccountMessageResult, UserMessageResult, BotMessageResult,
  StreamMessageResult, DownloadMediaResult, MediaPathResult,
  UserInfoResult,
} from "../src/models";

describe("SendMessageResult", () => {
  test("constructor defaults", () => {
    const r = new SendMessageResult({ success: true });
    expect(r.success).toBe(true);
    expect(r.message_id).toBeNull();
    expect(r.error).toBeNull();
    expect(r.platform).toBe("lansenger");
    expect(r.msg_type).toBeNull();
    expect(r.operation).toBeNull();
    expect(r.retryable).toBe(false);
  });

  test("constructor with all fields", () => {
    const r = new SendMessageResult({
      success: false, message_id: "mid1", error: "err",
      platform: "test", msg_type: "text", operation: "op",
      raw_response: { foo: 1 }, retryable: true,
    });
    expect(r.message_id).toBe("mid1");
    expect(r.platform).toBe("test");
    expect(r.retryable).toBe(true);
  });

  test("toDict includes non-null fields", () => {
    const r = new SendMessageResult({ success: true, message_id: "mid", error: "e" });
    const d = r.toDict();
    expect(d.success).toBe(true);
    expect(d.message_id).toBe("mid");
    expect(d.error).toBe("e");
    expect(d.platform).toBe("lansenger");
  });

  test("toDict omits null fields", () => {
    const r = new SendMessageResult({ success: true });
    const d = r.toDict();
    expect(d).not.toHaveProperty("message_id");
    expect(d).not.toHaveProperty("error");
  });
});

describe("StaffBasicInfoResult", () => {
  test("constructor defaults", () => {
    const r = new StaffBasicInfoResult({ success: true });
    expect(r.org_id).toBeNull();
    expect(r.name).toBeNull();
    expect(r.gender).toBeNull();
  });

  test("constructor with data", () => {
    const r = new StaffBasicInfoResult({
      success: true, org_id: "oid", name: "Zhang",
      gender: 1, avatar_url: "http://av",
    });
    expect(r.org_id).toBe("oid");
    expect(r.name).toBe("Zhang");
  });

  test("toDict includes non-null fields", () => {
    const r = new StaffBasicInfoResult({ success: true, name: "Li", gender: 2 });
    const d = r.toDict();
    expect(d.success).toBe(true);
    expect(d.name).toBe("Li");
    expect(d.gender).toBe(2);
    expect(d).not.toHaveProperty("org_id");
  });
});

describe("UserTokenResult", () => {
  test("constructor defaults", () => {
    const r = new UserTokenResult({ success: true });
    expect(r.expires_in).toBe(7200);
    expect(r.refresh_expires_in).toBe(2592000);
    expect(r.user_token).toBeNull();
  });

  test("constructor with data", () => {
    const r = new UserTokenResult({
      success: true, user_token: "ut1", expires_in: 3600,
      refresh_token: "rt1", staff_id: "s1",
    });
    expect(r.user_token).toBe("ut1");
    expect(r.expires_in).toBe(3600);
    expect(r.refresh_token).toBe("rt1");
  });

  test("toDict includes user_token with expires_in", () => {
    const r = new UserTokenResult({ success: true, user_token: "ut1" });
    const d = r.toDict();
    expect(d.user_token).toBe("ut1");
    expect(d.expires_in).toBe(7200);
  });

  test("toDict omits null user_token", () => {
    const r = new UserTokenResult({ success: true });
    const d = r.toDict();
    expect(d).not.toHaveProperty("user_token");
    expect(d).not.toHaveProperty("expires_in");
  });
});

describe("GroupInfoResult", () => {
  test("constructor defaults", () => {
    const r = new GroupInfoResult({ success: true });
    expect(r.name).toBeNull();
    expect(r.state).toBeNull();
    expect(r.total_members).toBeNull();
  });

  test("constructor with data", () => {
    const r = new GroupInfoResult({
      success: true, name: "TestGroup", state: 1, total_members: 10,
      owner: { staffId: "s1" }, max_members: 500,
    });
    expect(r.name).toBe("TestGroup");
    expect(r.total_members).toBe(10);
  });

  test("toDict includes non-null fields", () => {
    const r = new GroupInfoResult({ success: true, name: "G1", state: 1 });
    const d = r.toDict();
    expect(d.name).toBe("G1");
    expect(d.state).toBe(1);
    expect(d).not.toHaveProperty("description");
  });
});

describe("CreateGroupResult", () => {
  test("constructor defaults", () => {
    const r = new CreateGroupResult({ success: true });
    expect(r.group_id).toBeNull();
    expect(r.total_members).toBe(0);
  });

  test("constructor with data", () => {
    const r = new CreateGroupResult({
      success: true, group_id: "gid1", total_members: 5,
      invalid_staff: ["s1"],
    });
    expect(r.group_id).toBe("gid1");
    expect(r.total_members).toBe(5);
  });

  test("toDict always includes total_members", () => {
    const r = new CreateGroupResult({ success: true, group_id: "gid" });
    const d = r.toDict();
    expect(d.total_members).toBe(0);
    expect(d.group_id).toBe("gid");
  });
});

describe("TodoTaskCreateResult", () => {
  test("constructor defaults", () => {
    const r = new TodoTaskCreateResult({ success: true });
    expect(r.todotask_id).toBeNull();
  });

  test("toDict", () => {
    const r = new TodoTaskCreateResult({ success: true, todotask_id: "tid" });
    const d = r.toDict();
    expect(d.todotask_id).toBe("tid");
  });
});

describe("CalendarPrimaryResult", () => {
  test("constructor defaults", () => {
    const r = new CalendarPrimaryResult({ success: true });
    expect(r.calendar_id).toBeNull();
    expect(r.summary).toBeNull();
  });

  test("constructor with data", () => {
    const r = new CalendarPrimaryResult({
      success: true, calendar_id: "cal1", summary: "My Calendar",
    });
    expect(r.calendar_id).toBe("cal1");
  });
});

describe("ScheduleCreateResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleCreateResult({ success: true });
    expect(r.schedule_id).toBeNull();
  });

  test("toDict", () => {
    const r = new ScheduleCreateResult({ success: true, schedule_id: "sch1" });
    const d = r.toDict();
    expect(d.schedule_id).toBe("sch1");
  });
});

describe("ChatListResult", () => {
  test("constructor defaults", () => {
    const r = new ChatListResult({ success: true });
    expect(r.staff_infos).toBeNull();
    expect(r.group_infos).toBeNull();
  });

  test("toDict maps sub-objects", () => {
    const si = new ChatStaffInfo({ staff_id: "s1", staff_name: "Zhang", sector_names: ["dept1"] });
    const gi = new ChatGroupInfo({ group_id: "g1", group_name: "Group1" });
    const r = new ChatListResult({ success: true, staff_infos: [si], group_infos: [gi] });
    const d = r.toDict();
    expect(d.staff_infos[0].staff_id).toBe("s1");
    expect(d.group_infos[0].group_id).toBe("g1");
  });
});

describe("ChatMessagesResult", () => {
  test("constructor defaults", () => {
    const r = new ChatMessagesResult({ success: true });
    expect(r.has_more).toBe(false);
    expect(r.total).toBe(0);
    expect(r.last_version).toBe("");
  });

  test("toDict maps messages", () => {
    const msg = new ChatMessageInfo({ send_time: "100", sender: "s1", message_type: "text", content: { text: "hi" } });
    const r = new ChatMessagesResult({ success: true, messages: [msg], has_more: true, total: 1, last_version: "v2" });
    const d = r.toDict();
    expect(d.messages[0].send_time).toBe("100");
    expect(d.has_more).toBe(true);
  });
});

describe("StaffDetailResult", () => {
  test("constructor defaults", () => {
    const r = new StaffDetailResult({ success: true });
    expect(r.name).toBeNull();
    expect(r.email).toBeNull();
    expect(r.login_name).toBeNull();
  });

  test("constructor with data", () => {
    const r = new StaffDetailResult({ success: true, name: "Li", email: "li@test.com" });
    expect(r.name).toBe("Li");
    expect(r.email).toBe("li@test.com");
  });
});

describe("DepartmentAncestorsResult", () => {
  test("toDict", () => {
    const r = new DepartmentAncestorsResult({ success: true, ancestor_groups: [[{ deptId: "d1" }]] });
    const d = r.toDict();
    expect(d.ancestor_groups).toHaveLength(1);
  });
});

describe("StaffIdMappingResult", () => {
  test("toDict", () => {
    const r = new StaffIdMappingResult({ success: true, staff_id: "sid" });
    const d = r.toDict();
    expect(d.staff_id).toBe("sid");
  });
});

describe("OrgInfoResult", () => {
  test("constructor with data", () => {
    const r = new OrgInfoResult({ success: true, org_id: "oid", org_name: "Org1" });
    expect(r.org_id).toBe("oid");
    expect(r.org_name).toBe("Org1");
  });
});

describe("AppCardParams", () => {
  test("constructor defaults", () => {
    const p = new AppCardParams({ body_title: "title" });
    expect(p.body_title).toBe("title");
    expect(p.chat_id).toBe("");
    expect(p.is_dynamic).toBe(false);
    expect(p.fields).toBeNull();
    expect(p.links).toBeNull();
  });
});

describe("LinkCardParams", () => {
  test("constructor defaults", () => {
    const p = new LinkCardParams({ title: "link" });
    expect(p.title).toBe("link");
    expect(p.chat_id).toBe("");
  });
});

describe("OaCardParams", () => {
  test("constructor defaults", () => {
    const p = new OaCardParams({ title: "oa" });
    expect(p.title).toBe("oa");
    expect(p.chat_id).toBe("");
  });
});

describe("DynamicCardUpdateParams", () => {
  test("constructor defaults", () => {
    const p = new DynamicCardUpdateParams({ msg_id: "m1" });
    expect(p.msg_id).toBe("m1");
    expect(p.is_last_update).toBe(false);
  });
});

describe("GroupCreateInfo", () => {
  test("constructor defaults", () => {
    const g = new GroupCreateInfo({ name: "G", org_id: "1" });
    expect(g.name).toBe("G");
    expect(g.org_id).toBe("1");
    expect(g.owner_id).toBe("");
    expect(g.staff_id_list).toBeNull();
  });
});

describe("QueryGroupsResult", () => {
  test("constructor defaults", () => {
    const r = new QueryGroupsResult({ success: true });
    expect(r.total_group_ids).toBe(0);
    expect(r.group_ids).toEqual([]);
    expect(r.platform).toBe("lansenger");
    expect(r.operation).toBe("query_groups");
  });
});

describe("GroupMemberResult", () => {
  test("constructor defaults", () => {
    const r = new GroupMemberResult({ success: true });
    expect(r.total_members).toBe(0);
    expect(r.members).toBeNull();
  });
});

describe("IsInGroupResult", () => {
  test("constructor defaults", () => {
    const r = new IsInGroupResult({ success: true });
    expect(r.is_in_group).toBe(false);
  });
});

describe("UpdateGroupResult", () => {
  test("toDict", () => {
    const r = new UpdateGroupResult({ success: true });
    const d = r.toDict();
    expect(d.success).toBe(true);
    expect(d).not.toHaveProperty("error");
  });
});

describe("UpdateGroupMembersResult", () => {
  test("toDict always includes counts", () => {
    const r = new UpdateGroupMembersResult({ success: true });
    const d = r.toDict();
    expect(d.total_members).toBe(0);
    expect(d.added_staff_count).toBe(0);
    expect(d.deleted_staff_count).toBe(0);
  });
});

describe("GroupListResult", () => {
  test("constructor defaults", () => {
    const r = new GroupListResult({ success: true });
    expect(r.total_group_ids).toBe(0);
    expect(r.group_ids).toBeNull();
  });
});

describe("TodoTaskInfoResult", () => {
  test("constructor defaults", () => {
    const r = new TodoTaskInfoResult({ success: true });
    expect(r.todotask_id).toBeNull();
    expect(r.title).toBeNull();
  });
});

describe("TodoTaskListResult", () => {
  test("constructor defaults", () => {
    const r = new TodoTaskListResult({ success: true });
    expect(r.total).toBe(0);
    expect(r.todotask_list).toBeNull();
  });
});

describe("TodoTaskStatusCountResult", () => {
  test("constructor defaults", () => {
    const r = new TodoTaskStatusCountResult({ success: true });
    expect(r.status_counts).toBeNull();
  });
});

describe("TodoTaskExecutorListResult", () => {
  test("constructor defaults", () => {
    const r = new TodoTaskExecutorListResult({ success: true });
    expect(r.total).toBe(0);
    expect(r.executor_list).toBeNull();
  });
});

describe("ScheduleInfoResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleInfoResult({ success: true });
    expect(r.schedule_id).toBeNull();
    expect(r.summary).toBeNull();
  });
});

describe("ScheduleListResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleListResult({ success: true });
    expect(r.schedule_list).toBeNull();
  });
});

describe("ScheduleAttendeesResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleAttendeesResult({ success: true });
    expect(r.total).toBe(0);
    expect(r.attendees).toBeNull();
  });
});

describe("ScheduleUpdateResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleUpdateResult({ success: true });
    expect(r.schedule_ids).toBeNull();
  });
});

describe("ScheduleAttendeeMetaResult", () => {
  test("constructor defaults", () => {
    const r = new ScheduleAttendeeMetaResult({ success: true });
    expect(r.error).toBeNull();
  });
});

describe("UploadMediaResult", () => {
  test("constructor defaults", () => {
    const r = new UploadMediaResult({ success: true });
    expect(r.media_id).toBeNull();
  });
});

describe("DownloadMediaResult", () => {
  test("toDict includes size when data present", () => {
    const r = new DownloadMediaResult({ success: true, data: Buffer.from("hello") });
    const d = r.toDict();
    expect(d.size).toBe(5);
  });
});

describe("UserInfoResult", () => {
  test("constructor defaults", () => {
    const r = new UserInfoResult({ success: true });
    expect(r.staff_id).toBeNull();
    expect(r.name).toBeNull();
  });
});

describe("ExtraFieldIdsResult", () => {
  test("constructor defaults", () => {
    const r = new ExtraFieldIdsResult({ success: true });
    expect(r.has_more).toBe(false);
    expect(r.total).toBe(0);
  });
});

describe("StaffSearchResult", () => {
  test("constructor defaults", () => {
    const r = new StaffSearchResult({ success: true });
    expect(r.has_more).toBe(false);
    expect(r.total).toBe(0);
  });
});

describe("AccountMessageResult", () => {
  test("constructor defaults", () => {
    const r = new AccountMessageResult({ success: true });
    expect(r.message_id).toBeNull();
  });
});

describe("UserMessageResult", () => {
  test("constructor defaults", () => {
    const r = new UserMessageResult({ success: true });
    expect(r.message_id).toBeNull();
  });
});

describe("BotMessageResult", () => {
  test("constructor defaults", () => {
    const r = new BotMessageResult({ success: true });
    expect(r.message_id).toBeNull();
  });
});

describe("StreamMessageResult", () => {
  test("constructor defaults", () => {
    const r = new StreamMessageResult({ success: true });
    expect(r.message_id).toBeNull();
  });
});

describe("MediaPathResult", () => {
  test("constructor defaults", () => {
    const r = new MediaPathResult({ success: true });
    expect(r.media_path).toBeNull();
    expect(r.name).toBeNull();
  });
});

describe("ChatStaffInfo", () => {
  test("constructor defaults", () => {
    const s = new ChatStaffInfo({});
    expect(s.staff_id).toBe("");
    expect(s.staff_name).toBe("");
    expect(s.sector_names).toBeNull();
  });

  test("toDict", () => {
    const s = new ChatStaffInfo({ staff_id: "s1", staff_name: "Zhang", sector_names: ["d1"] });
    const d = s.toDict();
    expect(d.staff_id).toBe("s1");
    expect(d.sector_names).toEqual(["d1"]);
  });
});

describe("ChatGroupInfo", () => {
  test("toDict", () => {
    const g = new ChatGroupInfo({ group_id: "g1", group_name: "G1" });
    const d = g.toDict();
    expect(d.group_id).toBe("g1");
    expect(d.group_name).toBe("G1");
  });
});

describe("ChatMessageInfo", () => {
  test("toDict omits null content", () => {
    const m = new ChatMessageInfo({ send_time: "100", sender: "s1", message_type: "text" });
    const d = m.toDict();
    expect(d).not.toHaveProperty("content");
  });
});