import { buildApiUrl } from "../src/urlHelpers";
import { LansengerConfig } from "../src/config";

const config = new LansengerConfig("app1", "sec1");

describe("buildApiUrl", () => {
  test("basic URL with app token", () => {
    const url = buildApiUrl(config, "app_token", "create", "tok123");
    expect(url).toBe("https://open.e.lanxin.cn/open/apigw/v1/apptoken/create?app_token=tok123");
  });

  test("URL with path vars", () => {
    const url = buildApiUrl(config, "staffs", "fetch", "tok123", { pathVars: { staff_id: "staff1" } });
    expect(url).toContain("/v1/staffs/staff1/fetch");
    expect(url).toContain("app_token=tok123");
  });

  test("URL with path vars encoded", () => {
    const url = buildApiUrl(config, "staffs", "fetch", "tok123", { pathVars: { staff_id: "staff with spaces" } });
    expect(url).toContain("staff%20with%20spaces");
  });

  test("URL with userToken", () => {
    const url = buildApiUrl(config, "staffs", "fetch", "tok123", { userToken: "ut1", pathVars: { staff_id: "s1" } });
    expect(url).toContain("user_token=ut1");
  });

  test("URL with userId", () => {
    const url = buildApiUrl(config, "calendars", "primary", "tok123", { userId: "uid1" });
    expect(url).toContain("user_id=uid1");
  });

  test("URL with both userToken and userId", () => {
    const url = buildApiUrl(config, "calendars", "primary", "tok123", { userToken: "ut1", userId: "uid1" });
    expect(url).toContain("user_token=ut1");
    expect(url).toContain("user_id=uid1");
  });

  test("multiple path vars", () => {
    const url = buildApiUrl(config, "calendars", "schedule_fetch", "tok123", {
      pathVars: { calendar_id: "cal1", schedule_id: "sch1" },
    });
    expect(url).toContain("/v1/calendars/cal1/schedules/sch1/fetch");
  });

  test("custom gateway url", () => {
    const customConfig = new LansengerConfig("a", "s", "https://custom.api");
    const url = buildApiUrl(customConfig, "app_token", "create", "tok1");
    expect(url).toContain("https://custom.api");
  });

  test("app_token encoded", () => {
    const url = buildApiUrl(config, "app_token", "create", "tok+special&val");
    expect(url).toContain("app_token=tok%2Bspecial%26val");
  });

  test("no options defaults to empty", () => {
    const url = buildApiUrl(config, "app_token", "create", "tok1");
    expect(url).not.toContain("user_token");
    expect(url).not.toContain("user_id");
  });
});