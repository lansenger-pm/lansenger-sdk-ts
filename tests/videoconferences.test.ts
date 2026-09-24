import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import {
  createMeeting, modifyMeeting, cancelMeeting, stopMeeting, fetchMeetingDetail,
  fetchMeetingList, fetchMeetingRecordList, fetchMemberSimplerecord, fetchFixroomList,
  fetchMeetingStatus, subscribeMeetingEvents, fetchMeetingParams, fetchHistoryMeetings,
  fetchActiveMeetings, controlMeetingMember, inviteMeetingMembers, fetchMeetingMemberList,
  fetchVodList, fetchVodDownloadUrls, fetchOrgVideoconfConf,
} from "../src/videoconferences";
import { VC_OPS, VC_FETCH_RANGE_PERSON } from "../src/constants";

const HOST_MEMBERS = [
  { staffId: "s1", employeeName: "Host", role: "admin" },
  { staffId: "s2", employeeName: "Member", role: "participant" },
];

function makeConfig(): LansengerConfig {
  return new LansengerConfig("test_app", "test_secret");
}

function mockFetchFn(data: Record<string, any>, capture?: { url?: string; body?: any }): FetchFn {
  return async (url: any, init?: any) => {
    if (capture) {
      capture.url = String(url);
      capture.body = init && init.body ? JSON.parse(init.body) : undefined;
    }
    return { ok: true, status: 200, statusText: "OK", json: async () => data } as any;
  };
}

describe("createMeeting", () => {
  test("returns error on empty subject", async () => {
    const result = await createMeeting(makeConfig(), "tok", { subject: "", start_time: 123, members: HOST_MEMBERS, org_id: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toContain("subject");
  });

  test("returns error without exactly one admin member", async () => {
    const result = await createMeeting(makeConfig(), "tok", {
      subject: "m", start_time: 123, members: [{ staffId: "s1", role: "participant" }], org_id: 1,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("exactly one member must have role='admin'");
  });

  test("returns error on two admin members", async () => {
    const result = await createMeeting(makeConfig(), "tok", {
      subject: "m", start_time: 123,
      members: [{ staffId: "s1", role: "admin" }, { staffId: "s2", role: "admin" }],
      org_id: 1,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("exactly one");
  });

  test("posts to meeting/create and parses meeting fields", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await createMeeting(makeConfig(), "tok", {
      subject: "Standup", start_time: 1700000000000, members: HOST_MEMBERS, org_id: "2285568",
      type: 0, fetchFn: mockFetchFn({ errCode: 0, data: { id: 42, subject: "Standup", meetingNumber: "MN1", startTime: 1700000000000, type: 0, status: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(result.mid).toBe(42);
    expect(result.meeting_number).toBe("MN1");
    expect(capture.url).toContain("/xtra/videoconference/openapi/v1/meeting/create");
    expect(capture.url).toContain("app_token=tok");
    expect(capture.body.orgId).toBe(2285568);
    expect(capture.body.member.length).toBe(2);
  });

  test("omits optional fields when not provided", async () => {
    const capture: { url?: string; body?: any } = {};
    await createMeeting(makeConfig(), "tok", {
      subject: "m", start_time: 1, members: HOST_MEMBERS, org_id: 1,
      fetchFn: mockFetchFn({ errCode: 0, data: {} }, capture),
    });
    expect(capture.body.joinMute).toBeUndefined();
    expect(capture.body.inviteAdmin).toBeUndefined();
  });
});

describe("modifyMeeting", () => {
  test("returns error without admin member", async () => {
    const result = await modifyMeeting(makeConfig(), "tok", {
      mid: 1, subject: "m", start_time: 1, members: [], org_id: 1, operator: "s1",
    });
    expect(result.success).toBe(false);
  });

  test("returns done on success", async () => {
    const result = await modifyMeeting(makeConfig(), "tok", {
      mid: "10", subject: "m", start_time: 1, members: HOST_MEMBERS, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }),
    });
    expect(result.success).toBe(true);
    expect(result.done).toBe(true);
  });

  test("passes user_stop_time through when given", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await modifyMeeting(makeConfig(), "tok", {
      mid: "10", subject: "m", start_time: 1, members: HOST_MEMBERS, org_id: 1, operator: "s1",
      user_stop_time: 1700003600000,
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.body.userStopTime).toBe(1700003600000);
  });

  test("omits user_stop_time when not given", async () => {
    const capture: { url?: string; body?: any } = {};
    await modifyMeeting(makeConfig(), "tok", {
      mid: "10", subject: "m", start_time: 1, members: HOST_MEMBERS, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect("userStopTime" in capture.body).toBe(false);
  });

  // /meeting/modify 返回的是会议对象（无内层 code），done 不应恒为 false。
  // 响应形状取自 2026-09-23 实测抓包。
  test("done is true when the server returns the meeting object", async () => {
    const result = await modifyMeeting(makeConfig(), "tok", {
      mid: "1380079", subject: "测试预约 sdkvfy01 已改", start_time: 1790233200000,
      members: HOST_MEMBERS, org_id: "14803712", operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "OK", data: {
        admin: "s1", autoRecord: 0, confPassword: "", controlPassword: "", createSource: 1,
        ctime: 1790145779263, haveVodRecord: 0, id: 1380079, meetingNumber: "",
        mtime: 1790148033630, startTime: 1790233200000, status: 0, stopTime: 0,
        subject: "测试预约 sdkvfy01 已改", type: 1,
      } }),
    });
    expect(result.success).toBe(true);
    expect(result.done).toBe(true);
  });
});

describe("cancelMeeting / stopMeeting / fetchMeetingDetail", () => {
  test("cancel posts to cancle endpoint", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await cancelMeeting(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1", fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.url).toContain("/meeting/cancle");
    expect(capture.body.mid).toBe(5);
  });

  // 有内层 code 的端点仍按 code == 0 判 done。
  test("done follows the inner code when the endpoint returns one", async () => {
    const result = await cancelMeeting(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 105213, message: "会议未开始或已结束" } }),
    });
    expect(result.success).toBe(true);
    expect(result.done).toBe(false);
    expect(result.message).toBe("会议未开始或已结束");
  });

  // 成功但完全没有 data 负载：三个 SDK 一致判为完成（Go 的 fillVCOp 同义）。
  test("done is true when a successful response carries no payload", async () => {
    const result = await cancelMeeting(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "OK" }),
    });
    expect(result.success).toBe(true);
    expect(result.done).toBe(true);
  });

  test("stop posts to meeting/stop", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await stopMeeting(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1", fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.url).toContain("/meeting/stop");
  });

  test("detail parses meeting fields", async () => {
    const result = await fetchMeetingDetail(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { id: 5, subject: "S", status: 4, startTime: 1, stopTime: 2, admin: "s1" } }),
    });
    expect(result.success).toBe(true);
    expect(result.mid).toBe(5);
    expect(result.status).toBe(4);
    expect(result.admin).toBe("s1");
  });

  test("surfaces API error", async () => {
    const result = await stopMeeting(makeConfig(), "tok", {
      mid: 5, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 105224, errMsg: "already started" }),
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("105224");
  });
});

describe("list endpoints", () => {
  test("meeting list requires staff_id for person fetch range", async () => {
    const result = await fetchMeetingList(makeConfig(), "tok", {
      org_id: 1, start_time: 1, end_time: 2, fetch_range: VC_FETCH_RANGE_PERSON,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("staff_id is required");
  });

  test("meeting list success parses page data", async () => {
    const result = await fetchMeetingList(makeConfig(), "tok", {
      org_id: 1, start_time: 1, end_time: 2, limit: 5, offset: 3,
      fetchFn: mockFetchFn({ errCode: 0, data: { offset: 3, total: 10, items: [{ id: 1 }] } }),
    });
    expect(result.success).toBe(true);
    expect(result.total).toBe(10);
    expect(result.items!.length).toBe(1);
  });

  test("record list defaults create_source to client", async () => {
    const capture: { url?: string; body?: any } = {};
    await fetchMeetingRecordList(makeConfig(), "tok", {
      org_id: 1, start_time: 1, end_time: 2, fetchFn: mockFetchFn({ errCode: 0, data: {} }, capture),
    });
    expect(capture.body.createSource).toBe(0);
  });

  test("simplerecord / fixroom / history / active / member list all succeed", async () => {
    const ok = { errCode: 0, data: { offset: 0, total: 0, items: [] } };
    const r1 = await fetchMemberSimplerecord(makeConfig(), "tok", { mid: 1, org_id: 1, operator: "s1", fetchFn: mockFetchFn(ok) });
    const r2 = await fetchFixroomList(makeConfig(), "tok", { org_id: 1, operator: "s1", fetchFn: mockFetchFn(ok) });
    const r3 = await fetchHistoryMeetings(makeConfig(), "tok", { org_id: 1, operator: "s1", fetchFn: mockFetchFn(ok) });
    const r4 = await fetchActiveMeetings(makeConfig(), "tok", { org_id: 1, operator: "s1", fetchFn: mockFetchFn(ok) });
    const r5 = await fetchMeetingMemberList(makeConfig(), "tok", { mid: 1, org_id: 1, operator: "s1", fetchFn: mockFetchFn(ok) });
    for (const r of [r1, r2, r3, r4, r5]) expect(r.success).toBe(true);
  });
});

describe("fetchMeetingStatus", () => {
  test("returns error on empty mids", async () => {
    const result = await fetchMeetingStatus(makeConfig(), "tok", { mids: [], org_id: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toContain("mids");
  });

  test("returns statuses", async () => {
    const result = await fetchMeetingStatus(makeConfig(), "tok", {
      mids: ["1", 2], org_id: 1,
      fetchFn: mockFetchFn({ errCode: 0, data: { mids: [{ mid: 1, status: 0 }] } }),
    });
    expect(result.success).toBe(true);
    expect(result.statuses!.length).toBe(1);
  });
});

describe("subscribeMeetingEvents", () => {
  test("posts events with optional callback info", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await subscribeMeetingEvents(makeConfig(), "tok", {
      mid: 1, org_id: 1, events: [{ eventType: 1, callbackUrl: "https://cb" }],
      call_back_info: "extra", fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.body.callBackInfo).toBe("extra");
    expect(capture.body.events.length).toBe(1);
  });

  // 2026-09-23 实测抓包：内层带 code，仍按 code == 0 判 done（不受本次语义调整影响）。
  test("done is true for the live-captured subscribe response", async () => {
    const result = await subscribeMeetingEvents(makeConfig(), "tok", {
      mid: 1380079, org_id: 14803712, events: [{ eventType: 1 }],
      fetchFn: mockFetchFn({ errCode: 0, errMsg: "OK", data: { code: 0, errCode: 0, message: "" } }),
    });
    expect(result.success).toBe(true);
    expect(result.done).toBe(true);
  });
});

describe("fetchMeetingParams", () => {
  test("returns error on empty meeting_number", async () => {
    const result = await fetchMeetingParams(makeConfig(), "tok", { meeting_number: "", org_id: 1, operator: "s1" });
    expect(result.success).toBe(false);
  });

  test("returns meeting info", async () => {
    const result = await fetchMeetingParams(makeConfig(), "tok", {
      meeting_number: "MN1", org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { meetingInfo: { meetingNumber: "MN1" } } }),
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ meetingNumber: "MN1" });
  });
});

describe("controlMeetingMember", () => {
  test("passes op_code through verbatim (no client-side validation)", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await controlMeetingMember(makeConfig(), "tok", {
      mid: 1, staff_id: "s2", op_code: "some_new_op", operator: "s1", org_id: 1,
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.body.opCode).toBe("some_new_op");
  });

  test("sends a known op_code unchanged", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await controlMeetingMember(makeConfig(), "tok", {
      mid: 1, staff_id: "s2", op_code: "mute", operator: "s1", org_id: 1,
      fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.body.opCode).toBe("mute");
    // VC_OPS 只是已知值参考表，不参与校验；接口仅支持单人操作，
    // muteall/unmuteall 已按后端确认移除（LXBUGS-128490/邹治会 2026-09-24）
    expect(VC_OPS).toContain("mute");
    expect(VC_OPS).not.toContain("muteall");
  });
});

describe("inviteMeetingMembers", () => {
  test("returns error on empty member list", async () => {
    const result = await inviteMeetingMembers(makeConfig(), "tok", {
      meeting_number: "MN1", members: [], org_id: 1, operator: "s1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("member");
  });

  test("posts member list", async () => {
    const capture: { url?: string; body?: any } = {};
    const result = await inviteMeetingMembers(makeConfig(), "tok", {
      meeting_number: "MN1", members: [{ staffId: "s2", employeeName: "M", type: 0, video: true, audio: true }],
      org_id: 1, operator: "s1", fetchFn: mockFetchFn({ errCode: 0, data: { code: 0 } }, capture),
    });
    expect(result.success).toBe(true);
    expect(capture.body.meetingNumber).toBe("MN1");
    expect(capture.body.member.length).toBe(1);
  });
});

describe("vod endpoints", () => {
  test("vod list parses items", async () => {
    const result = await fetchVodList(makeConfig(), "tok", {
      mid: 1, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { items: [{ vodId: "v1" }] } }),
    });
    expect(result.success).toBe(true);
    expect(result.items![0].vodId).toBe("v1");
  });

  test("vod download urls rejects empty list", async () => {
    const result = await fetchVodDownloadUrls(makeConfig(), "tok", { vods: [], org_id: 1, operator: "s1" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("1..3");
  });

  test("vod download urls rejects more than 3 vods", async () => {
    const vods = [{ vodId: "1" }, { vodId: "2" }, { vodId: "3" }, { vodId: "4" }];
    const result = await fetchVodDownloadUrls(makeConfig(), "tok", { vods, org_id: 1, operator: "s1" });
    expect(result.success).toBe(false);
  });

  test("vod download urls accepts up to 3 vods", async () => {
    const vods = [{ vodId: "1" }, { vodId: "2" }, { vodId: "3" }];
    const result = await fetchVodDownloadUrls(makeConfig(), "tok", {
      vods, org_id: 1, operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: { urls: [] } }),
    });
    expect(result.success).toBe(true);
  });
});

describe("fetchOrgVideoconfConf", () => {
  test("parses conf fields", async () => {
    const result = await fetchOrgVideoconfConf(makeConfig(), "tok", {
      org_id: 1,
      fetchFn: mockFetchFn({ errCode: 0, data: { maxPerson: 100, defaultMaxPerson: 10, allowedRecordFlag: 1, forcePasswdFlag: 0, spaceSize: 2048 } }),
    });
    expect(result.success).toBe(true);
    expect(result.max_person).toBe(100);
    expect(result.space_size).toBe(2048);
  });

  test("sends optional meeting_number and operator", async () => {
    const capture: { url?: string; body?: any } = {};
    await fetchOrgVideoconfConf(makeConfig(), "tok", {
      org_id: 1, meeting_number: "MN1", operator: "s1",
      fetchFn: mockFetchFn({ errCode: 0, data: {} }, capture),
    });
    expect(capture.body.meetingNumber).toBe("MN1");
    expect(capture.body.operator).toBe("s1");
  });
});
