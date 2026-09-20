import { LansengerConfig } from "../src/config";
import { API_ENDPOINTS } from "../src/constants";
import {
  fetchBoardroomList,
  fetchBoardroomDetail,
  fetchBoardroomSchedule,
  fetchBoardroomReserveDetail,
  reserveBoardroom,
  editBoardroomReserve,
  cancelBoardroomReserve,
  confirmBoardroomSign,
  fetchMyBoardroomReserves,
  fetchBoardroomGradings,
  fetchBoardroomAreaOffices,
} from "../src/boardrooms";
import type { FetchFn } from "../src/http";

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async () => ({
    ok: true, status: 200, statusText: "OK",
    json: async () => responseData,
  } as any);
}

function httpErrorFetch(): FetchFn {
  return async () => ({
    ok: false, status: 500, statusText: "Internal Server Error",
    json: async () => ({}),
  } as any);
}

function capturingFetch(
  capture: { body?: Record<string, any> },
  responseData: Record<string, any> = { errCode: 0, data: {} },
): FetchFn {
  return async (_url, init) => {
    capture.body = JSON.parse((init?.body as string) || "{}");
    return {
      ok: true, status: 200, statusText: "OK",
      json: async () => responseData,
    } as any;
  };
}

describe("fetchBoardroomList", () => {
  test("sends page defaults and documented filters", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await fetchBoardroomList(config, appToken, {
      grading_id: "g1",
      area_office_id: "area1",
      floor_ids: ["f1", "f2"],
      equipment: ["tv"],
      query_date: "2026-07-22",
      user_token: "ut1",
      fetchFn: capturingFetch(cap, {
        errCode: 0,
        data: { count: 1, data: [{ id: "room1", name: "第一会议室" }] },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.count).toBe(1);
    expect(r.items![0].id).toBe("room1");
    expect(cap.body).toEqual({
      page: 1,
      limit: 10,
      gradingId: "g1",
      areaOfficeId: "area1",
      areaOfficeFoolerIds: ["f1", "f2"],
      equipment: ["tv"],
      queryDate: "2026-07-22",
    });
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomList(config, appToken, {
      fetchFn: mockFetchFn({ errCode: 10008, errMsg: "API服务 数据不存在" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=10008");
  });

  test("returns HTTP error", async () => {
    const r = await fetchBoardroomList(config, appToken, { fetchFn: httpErrorFetch() });
    expect(r.success).toBe(false);
    expect(r.error).toContain("HTTP error");
  });
});

describe("fetchBoardroomDetail", () => {
  test("requires room_id", async () => {
    const r = await fetchBoardroomDetail(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("room_id is required");
  });

  test("maps room detail fields", async () => {
    const r = await fetchBoardroomDetail(config, appToken, "room1", {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: {
          id: "room1", name: "第一会议室", status: "1", peopleNum: 20,
          canReserveFlag: "1", address: "A座", areaName: "北区", gradingId: "g1",
        },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.room_id).toBe("room1");
    expect(r.people_num).toBe(20);
    expect(r.can_reserve_flag).toBe("1");
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomDetail(config, appToken, "room1", {
      fetchFn: mockFetchFn({ errCode: 54000, errMsg: "room missing" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54000");
  });
});

describe("fetchBoardroomSchedule", () => {
  test.each([
    ["", "2026-07-22", "g1", "room_id is required"],
    ["room1", "", "g1", "query_date is required"],
    ["room1", "2026-07-22", "", "grading_id is required"],
  ])("validates required arguments", async (roomId, queryDate, gradingId, message) => {
    const r = await fetchBoardroomSchedule(config, appToken, roomId, queryDate, gradingId);
    expect(r.success).toBe(false);
    expect(r.error).toContain(message);
  });

  test("maps reservations and deactivations", async () => {
    const r = await fetchBoardroomSchedule(config, appToken, "room1", "2026-07-22", "g1", {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: {
          id: "room1", name: "第一会议室", peopleNum: 20, canReserveFlag: "1",
          reserveDtoList: [{ id: "r1" }], deactivatedInfoList: [{ reason: "维护" }],
        },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.reserves).toHaveLength(1);
    expect(r.deactivations).toHaveLength(1);
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomSchedule(config, appToken, "room1", "2026-07-22", "g1", {
      fetchFn: mockFetchFn({ errCode: 54001, errMsg: "schedule missing" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54001");
  });
});

describe("fetchBoardroomReserveDetail", () => {
  test("requires reserve_room_id", async () => {
    const r = await fetchBoardroomReserveDetail(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("reserve_room_id is required");
  });

  test("maps reservation detail", async () => {
    const r = await fetchBoardroomReserveDetail(config, appToken, "res1", {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: {
          id: "res1", boardRoomName: "第一会议室", name: "周会", status: "5",
          reserveTimeStart: "09:00", reserveTimeEnd: "10:00",
          reserveTime: "1小时", reserveUserName: "张三", peopleNumber: "10",
        },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.reserve_id).toBe("res1");
    expect(r.boardroom_name).toBe("第一会议室");
    expect(r.people_number).toBe("10");
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomReserveDetail(config, appToken, "res1", {
      fetchFn: mockFetchFn({ errCode: 54002, errMsg: "reservation missing" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54002");
  });
});

describe("reserveBoardroom", () => {
  test("requires boardroom_id", async () => {
    const r = await reserveBoardroom(config, appToken, "", "周会", "g1", "s", "e", "不提醒");
    expect(r.success).toBe(false);
    expect(r.error).toContain("boardroom_id is required");
  });

  test("sends camelCase reservation body and maps result", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await reserveBoardroom(
      config, appToken, "room1", "周会", "g1", "2026-07-22 09:00:00",
      "2026-07-22 10:00:00", "会前15分钟",
      {
        people_number: "10",
        reserve_type: "1",
        repeat_type: "week",
        repeat_days: [1, 3],
        invitation_user_list: ["u1"],
        fetchFn: capturingFetch(cap, {
          errCode: 0,
          data: { id: "res1", reserveCode: "BR001", boardRoomName: "第一会议室", name: "周会", status: "5" },
        }),
      },
    );
    expect(r.success).toBe(true);
    expect(r.reserve_code).toBe("BR001");
    expect(cap.body).toMatchObject({
      boardRoomId: "room1",
      name: "周会",
      gradingId: "g1",
      reserveTimeStartStr: "2026-07-22 09:00:00",
      reserveTimeEndStr: "2026-07-22 10:00:00",
      noticeTime: "会前15分钟",
      peopleNumber: "10",
      reserveType: "1",
      repeatType: "week",
      repeatDays: [1, 3],
      invitationUserList: ["u1"],
    });
  });

  test("returns API error", async () => {
    const r = await reserveBoardroom(config, appToken, "room1", "周会", "g1", "s", "e", "不提醒", {
      fetchFn: mockFetchFn({ errCode: 54000, errMsg: "会议室已被占用" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54000");
  });
});

describe("editBoardroomReserve", () => {
  test("requires reserve_id", async () => {
    const r = await editBoardroomReserve(config, appToken, "", "room1", "周会", "g1", "s", "e", "不提醒");
    expect(r.success).toBe(false);
    expect(r.error).toContain("reserve_id is required");
  });

  test("sends id and edit type", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await editBoardroomReserve(
      config, appToken, "res1", "room1", "周会", "g1", "s", "e", "不提醒",
      { edit_type: "2", fetchFn: capturingFetch(cap) },
    );
    expect(r.success).toBe(true);
    expect(cap.body).toMatchObject({ id: "res1", editType: "2", boardRoomId: "room1" });
  });

  test("returns API error", async () => {
    const r = await editBoardroomReserve(
      config, appToken, "res1", "room1", "周会", "g1", "s", "e", "不提醒",
      { fetchFn: mockFetchFn({ errCode: 54003, errMsg: "edit failed" }) },
    );
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54003");
  });
});

describe("cancelBoardroomReserve", () => {
  test("requires reserve_id", async () => {
    const r = await cancelBoardroomReserve(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("reserve_id is required");
  });

  test("sends documented cancellation body", async () => {
    const cap: { body?: Record<string, any> } = {};
    const r = await cancelBoardroomReserve(config, appToken, "res1", {
      cancel_reason: "改期",
      is_send: true,
      notify_user_list: ["u1"],
      cancel_type: "1",
      fetchFn: capturingFetch(cap, { errCode: 0, data: true }),
    });
    expect(r.success).toBe(true);
    expect(r.done).toBe(true);
    expect(cap.body).toMatchObject({
      id: "res1", cancelReason: "改期", isSend: true, userList: ["u1"], cancelType: "1",
    });
  });

  test("returns API error", async () => {
    const r = await cancelBoardroomReserve(config, appToken, "res1", {
      fetchFn: mockFetchFn({ errCode: 54004, errMsg: "cancel failed" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54004");
  });
});

describe("confirmBoardroomSign", () => {
  test("requires reserve_id", async () => {
    const r = await confirmBoardroomSign(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("reserve_id is required");
  });

  test("confirms sign", async () => {
    const r = await confirmBoardroomSign(config, appToken, "res1", {
      fetchFn: mockFetchFn({ errCode: 0, data: true }),
    });
    expect(r.success).toBe(true);
    expect(r.done).toBe(true);
  });

  test("returns API error", async () => {
    const r = await confirmBoardroomSign(config, appToken, "res1", {
      fetchFn: mockFetchFn({ errCode: 54005, errMsg: "confirm failed" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54005");
  });
});

describe("fetchMyBoardroomReserves", () => {
  test("requires grading_id", async () => {
    const r = await fetchMyBoardroomReserves(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("grading_id is required");
  });

  test("parses paged reservations", async () => {
    const r = await fetchMyBoardroomReserves(config, appToken, "g1", {
      keys: "周会",
      fetchFn: mockFetchFn({
        errCode: 0,
        data: { count: 1, data: [{ id: "res1", name: "周会" }] },
      }),
    });
    expect(r.success).toBe(true);
    expect(r.count).toBe(1);
    expect(r.items![0].name).toBe("周会");
  });

  test("returns API error", async () => {
    const r = await fetchMyBoardroomReserves(config, appToken, "g1", {
      fetchFn: mockFetchFn({ errCode: 54006, errMsg: "list failed" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54006");
  });
});

describe("fetchBoardroomGradings", () => {
  test("returns grading list", async () => {
    const r = await fetchBoardroomGradings(config, appToken, {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: [{ id: "g1", name: "默认分级", type: "GRADING_ADMIN" }],
      }),
    });
    expect(r.success).toBe(true);
    expect(r.total).toBe(1);
    expect(r.gradings![0].id).toBe("g1");
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomGradings(config, appToken, {
      fetchFn: mockFetchFn({ errCode: 54007, errMsg: "gradings failed" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54007");
  });

  test("returns HTTP error", async () => {
    const r = await fetchBoardroomGradings(config, appToken, { fetchFn: httpErrorFetch() });
    expect(r.success).toBe(false);
    expect(r.error).toContain("HTTP error");
  });
});

describe("fetchBoardroomAreaOffices", () => {
  test("requires grading_id", async () => {
    const r = await fetchBoardroomAreaOffices(config, appToken, "");
    expect(r.success).toBe(false);
    expect(r.error).toContain("grading_id is required");
  });

  test("returns office areas", async () => {
    const r = await fetchBoardroomAreaOffices(config, appToken, "g1", {
      fetchFn: mockFetchFn({
        errCode: 0,
        data: [{ id: "area1", name: "北区" }],
      }),
    });
    expect(r.success).toBe(true);
    expect(r.total).toBe(1);
    expect(r.areas![0].name).toBe("北区");
  });

  test("returns API error", async () => {
    const r = await fetchBoardroomAreaOffices(config, appToken, "g1", {
      fetchFn: mockFetchFn({ errCode: 54008, errMsg: "areas failed" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=54008");
  });
});

describe("boardroom constants", () => {
  test("endpoint paths", () => {
    expect(API_ENDPOINTS.boardrooms.room_list).toBe("/xtra/boardroom/server/openapi/v2/roomList");
    expect(API_ENDPOINTS.boardrooms.reserve_room).toBe("/xtra/boardroom/server/openapi/v2/reserveRoom");
    expect(API_ENDPOINTS.boardrooms.area_office_list).toBe("/xtra/boardroom/server/openapi/v2/areaOfficeList");
  });
});
