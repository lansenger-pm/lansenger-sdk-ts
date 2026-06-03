import { fetchStaffBasicInfo, fetchStaffDetail, fetchDepartmentAncestors, fetchStaffIdMapping, fetchOrgInfo, searchStaff, fetchOrgExtraFieldIds } from "../src/contacts";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";

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

describe("fetchStaffBasicInfo", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { orgId: "org1", orgName: "Org1", name: "Zhang", gender: 1, avatarId: "av1", status: 1 },
    });
    const result = await fetchStaffBasicInfo(config, appToken, "staff1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.org_id).toBe("org1");
    expect(result.name).toBe("Zhang");
    expect(result.gender).toBe(1);
  });

  test("returns error on empty staff_id", async () => {
    const result = await fetchStaffBasicInfo(config, appToken, "");
    expect(result.success).toBe(false);
    expect(result.error).toContain("staff_id is required");
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500);
    const result = await fetchStaffBasicInfo(config, appToken, "staff1", { fetchFn });
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP error");
  });

  test("returns error on API error", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "invalid" });
    const result = await fetchStaffBasicInfo(config, appToken, "staff1", { fetchFn });
    expect(result.success).toBe(false);
    expect(result.error).toContain("API error");
  });
});

describe("fetchStaffDetail", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { name: "Zhang", email: "z@test.com", employeeNumber: "E001", loginName: "zhang" },
    });
    const result = await fetchStaffDetail(config, appToken, "staff1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.name).toBe("Zhang");
    expect(result.email).toBe("z@test.com");
  });

  test("returns error on empty staff_id", async () => {
    const result = await fetchStaffDetail(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchDepartmentAncestors", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: [{ ancestorDepartments: [{ deptId: "d1", deptName: "Dept1" }] }],
    });
    const result = await fetchDepartmentAncestors(config, appToken, "staff1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.ancestor_groups).toHaveLength(1);
  });

  test("returns error on empty staff_id", async () => {
    const result = await fetchDepartmentAncestors(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchStaffIdMapping", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { staffId: "mapped_staff" },
    });
    const result = await fetchStaffIdMapping(config, appToken, "org1", "phone", "1234", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.staff_id).toBe("mapped_staff");
  });

  test("returns error on empty org_id", async () => {
    const result = await fetchStaffIdMapping(config, appToken, "", "phone", "1234");
    expect(result.success).toBe(false);
  });

  test("returns error on empty id_type", async () => {
    const result = await fetchStaffIdMapping(config, appToken, "org1", "", "1234");
    expect(result.success).toBe(false);
  });

  test("returns error on empty id_value", async () => {
    const result = await fetchStaffIdMapping(config, appToken, "org1", "phone", "");
    expect(result.success).toBe(false);
  });
});

describe("fetchOrgInfo", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { orgId: "org1", orgName: "Org1", iconUrl: "http://icon" },
    });
    const result = await fetchOrgInfo(config, appToken, "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.org_id).toBe("org1");
    expect(result.org_name).toBe("Org1");
  });

  test("returns error on empty org_id", async () => {
    const result = await fetchOrgInfo(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("searchStaff", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { hasMore: false, total: 1, staffInfo: [{ name: "Zhang" }] },
    });
    const result = await searchStaff(config, appToken, "Zhang", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
  });

  test("returns error on empty keyword", async () => {
    const result = await searchStaff(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchOrgExtraFieldIds", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { hasMore: false, total: 5, extraFieldIds: [{ id: "f1" }] },
    });
    const result = await fetchOrgExtraFieldIds(config, appToken, "org1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total).toBe(5);
  });

  test("returns error on empty org_id", async () => {
    const result = await fetchOrgExtraFieldIds(config, appToken, "");
    expect(result.success).toBe(false);
  });
});