import {
  fetchPrimaryCalendar, createSchedule, fetchSchedule,
  deleteSchedule, updateSchedule, fetchScheduleList,
  fetchScheduleAttendees, addScheduleAttendees, deleteScheduleAttendees,
  updateScheduleAttendeeMeta,
} from "../src/calendars";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";
import {
  CalendarPrimaryResult, ScheduleCreateResult, ScheduleInfoResult,
  ScheduleUpdateResult, ScheduleListResult, ScheduleAttendeesResult,
  ScheduleAttendeeMetaResult, ScheduleAttendeesUpdateResult,
} from "../src/models";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => responseData,
    } as any;
  };
}

function mockErrorFetchFn(status: number): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    return {
      ok: false,
      status,
      statusText: "Error",
      json: async () => ({ errCode: -1, errMsg: "HTTP error" }),
    } as any;
  };
}

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

describe("fetchPrimaryCalendar", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { calendarId: "cal1", summary: "Primary", role: "owner" },
    });
    const result = await fetchPrimaryCalendar(config, appToken, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.calendar_id).toBe("cal1");
    expect(result.summary).toBe("Primary");
    expect(result.role).toBe("owner");
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500);
    const result = await fetchPrimaryCalendar(config, appToken, { fetchFn });
    expect(result.success).toBe(false);
  });
});

describe("createSchedule", () => {
  const startTime = { date: "2025-01-01", time: "09:00", timezone: "UTC" };
  const endTime = { date: "2025-01-01", time: "10:00", timezone: "UTC" };
  const attendees = [{ staffId: "s1" }];

  test("returns success with schedule_id", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleId: "sch1" },
    });
    const result = await createSchedule(config, appToken, "cal1", "Meeting", startTime, endTime, attendees, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_id).toBe("sch1");
  });

  test("returns error on empty calendar_id", async () => {
    const result = await createSchedule(config, appToken, "", "Meeting", startTime, endTime, attendees);
    expect(result.success).toBe(false);
  });

  test("returns error on empty summary", async () => {
    const result = await createSchedule(config, appToken, "cal1", "", startTime, endTime, attendees);
    expect(result.success).toBe(false);
  });

  test("returns error on empty startTime", async () => {
    const result = await createSchedule(config, appToken, "cal1", "M", null as any, endTime, attendees);
    expect(result.success).toBe(false);
  });

  test("returns error on empty endTime", async () => {
    const result = await createSchedule(config, appToken, "cal1", "M", startTime, null as any, attendees);
    expect(result.success).toBe(false);
  });

  test("returns error on empty attendees without user_id", async () => {
    const result = await createSchedule(config, appToken, "cal1", "M", startTime, endTime, []);
    expect(result.success).toBe(false);
    expect(result.error).toContain("attendees is required");
  });

  test("auto-fills attendees from user_id when empty attendees array", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: { scheduleId: "sch_auto" } });
    const result = await createSchedule(config, appToken, "cal1", "Meeting", startTime, endTime, [], { user_id: "u1", fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_id).toBe("sch_auto");
  });
});

describe("fetchSchedule", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleId: "sch1", summary: "Meeting", description: "desc", repeatType: "none", allDay: "false" },
    });
    const result = await fetchSchedule(config, appToken, "cal1", "sch1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_id).toBe("sch1");
    expect(result.summary).toBe("Meeting");
  });

  test("returns error on empty calendar_id", async () => {
    const result = await fetchSchedule(config, appToken, "", "sch1");
    expect(result.success).toBe(false);
  });

  test("returns error on empty schedule_id", async () => {
    const result = await fetchSchedule(config, appToken, "cal1", "");
    expect(result.success).toBe(false);
  });
});

describe("deleteSchedule", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleIds: ["sch1"] },
    });
    const result = await deleteSchedule(config, appToken, "cal1", "sch1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_id).toBe("sch1");
  });

  test("returns error on empty calendar_id", async () => {
    const result = await deleteSchedule(config, appToken, "", "sch1");
    expect(result.success).toBe(false);
  });
});

describe("updateSchedule", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleIds: ["sch1"] },
    });
    const result = await updateSchedule(config, appToken, "cal1", "sch1", { summary: "New", fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_ids).toEqual(["sch1"]);
  });

  test("returns error on empty calendar_id", async () => {
    const result = await updateSchedule(config, appToken, "", "sch1", { summary: "N" });
    expect(result.success).toBe(false);
  });

  test("returns error when no fields to update", async () => {
    const result = await updateSchedule(config, appToken, "cal1", "sch1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("at least one field");
  });
});

describe("fetchScheduleList", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleList: [{ scheduleId: "sch1" }] },
    });
    const result = await fetchScheduleList(config, appToken, "cal1", 1000, 2000, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.schedule_list).toHaveLength(1);
  });

  test("returns error on empty calendar_id", async () => {
    const result = await fetchScheduleList(config, appToken, "", 1000, 2000);
    expect(result.success).toBe(false);
  });

  test("returns error when no times", async () => {
    const result = await fetchScheduleList(config, appToken, "cal1", 0, 0);
    expect(result.success).toBe(false);
  });
});

describe("fetchScheduleAttendees", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { total: 2, attendees: [{ staffId: "s1" }] },
    });
    const result = await fetchScheduleAttendees(config, appToken, "cal1", "sch1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
  });

  test("returns error on empty calendar_id", async () => {
    const result = await fetchScheduleAttendees(config, appToken, "", "sch1");
    expect(result.success).toBe(false);
  });
});

describe("addScheduleAttendees", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { scheduleIds: ["sch1"] },
    });
    const result = await addScheduleAttendees(config, appToken, "cal1", "sch1", ["s2"], { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty attendees", async () => {
    const result = await addScheduleAttendees(config, appToken, "cal1", "sch1", []);
    expect(result.success).toBe(false);
  });
});

describe("deleteScheduleAttendees", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await deleteScheduleAttendees(config, appToken, "cal1", "sch1", ["s2"], { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty attendees", async () => {
    const result = await deleteScheduleAttendees(config, appToken, "cal1", "sch1", []);
    expect(result.success).toBe(false);
  });
});

describe("updateScheduleAttendeeMeta", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await updateScheduleAttendeeMeta(config, appToken, "cal1", "sch1", { rsvp_status: "accepted", fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty calendar_id", async () => {
    const result = await updateScheduleAttendeeMeta(config, appToken, "", "sch1", { rsvp_status: "a" });
    expect(result.success).toBe(false);
  });

  test("returns error when no fields", async () => {
    const result = await updateScheduleAttendeeMeta(config, appToken, "cal1", "sch1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("at least one field");
  });
});