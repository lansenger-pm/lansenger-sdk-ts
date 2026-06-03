import {
  createGroup, fetchGroupInfo, fetchGroupMembers, fetchGroupList,
  checkIsInGroup, updateGroupInfo, updateGroupMembers, dismissGroup,
} from "../src/groups";
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

describe("createGroup", () => {
  test("returns success with group_id", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { groupId: "gid1", totalMembers: 5 },
    });
    const result = await createGroup(config, appToken, "TestGroup", "org1", { staff_id_list: ["s1", "s2"], fetchFn });
    expect(result.success).toBe(true);
    expect(result.group_id).toBe("gid1");
    expect(result.total_members).toBe(5);
  });

  test("returns error on empty name", async () => {
    const result = await createGroup(config, appToken, "", "org1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("name is required");
  });

  test("returns error on empty orgId", async () => {
    const result = await createGroup(config, appToken, "G", "");
    expect(result.success).toBe(false);
    expect(result.error).toContain("org_id is required");
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500);
    const result = await createGroup(config, appToken, "G", "o1", { fetchFn });
    expect(result.success).toBe(false);
  });

  test("returns error on API error", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "bad" });
    const result = await createGroup(config, appToken, "G", "o1", { fetchFn });
    expect(result.success).toBe(false);
    expect(result.error).toContain("API error");
  });

  test("returns with invalid_staff", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { groupId: "g1", invalidStaff: ["s_bad"], invalidDepartment: ["d_bad"] },
    });
    const result = await createGroup(config, appToken, "G", "o1", { fetchFn });
    expect(result.invalid_staff).toEqual(["s_bad"]);
    expect(result.invalid_department).toEqual(["d_bad"]);
  });
});

describe("fetchGroupInfo", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { name: "MyGroup", state: 1, totalMembers: 10, owner: { staffId: "owner1" } },
    });
    const result = await fetchGroupInfo(config, appToken, "gid1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.name).toBe("MyGroup");
    expect(result.total_members).toBe(10);
  });

  test("returns error on empty group_id", async () => {
    const result = await fetchGroupInfo(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchGroupMembers", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { totalMembers: 3, members: [{ staffId: "s1" }] },
    });
    const result = await fetchGroupMembers(config, appToken, "gid1", { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total_members).toBe(3);
  });

  test("returns error on empty group_id", async () => {
    const result = await fetchGroupMembers(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("fetchGroupList", () => {
  test("returns success with data", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { totalGroupIds: 2, groupIds: ["g1", "g2"] },
    });
    const result = await fetchGroupList(config, appToken, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.total_group_ids).toBe(2);
    expect(result.group_ids).toEqual(["g1", "g2"]);
  });
});

describe("checkIsInGroup", () => {
  test("returns success with is_in_group true", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { isInGroup: true },
    });
    const result = await checkIsInGroup(config, appToken, "gid1", { staff_id: "s1", fetchFn });
    expect(result.success).toBe(true);
    expect(result.is_in_group).toBe(true);
  });

  test("returns error on empty group_id", async () => {
    const result = await checkIsInGroup(config, appToken, "");
    expect(result.success).toBe(false);
  });
});

describe("updateGroupInfo", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await updateGroupInfo(config, appToken, "gid1", { name: "NewName", fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty group_id", async () => {
    const result = await updateGroupInfo(config, appToken, "", { name: "N" });
    expect(result.success).toBe(false);
  });

  test("returns error when no fields provided", async () => {
    const result = await updateGroupInfo(config, appToken, "gid1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("at least one field");
  });
});

describe("updateGroupMembers", () => {
  test("returns success with counts", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { totalMembers: 6, addedStaffCount: 2, deletedStaffCount: 1 },
    });
    const result = await updateGroupMembers(config, appToken, "gid1", { add_user_list: ["s3", "s4"], del_user_list: ["s1"], fetchFn });
    expect(result.success).toBe(true);
    expect(result.total_members).toBe(6);
    expect(result.added_staff_count).toBe(2);
  });

  test("returns error on empty group_id", async () => {
    const result = await updateGroupMembers(config, appToken, "");
    expect(result.success).toBe(false);
  });

  test("returns error when no lists provided", async () => {
    const result = await updateGroupMembers(config, appToken, "gid1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("at least one");
  });
});

describe("dismissGroup", () => {
  test("returns success", async () => {
    const fetchFn = mockFetchFn({ errCode: 0, data: {} });
    const result = await dismissGroup(config, appToken, "gid1", { fetchFn });
    expect(result.success).toBe(true);
  });

  test("returns error on empty group_id", async () => {
    const result = await dismissGroup(config, appToken, "");
    expect(result.success).toBe(false);
  });
});