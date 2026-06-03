import { parseApiResponse, FetchFn } from "../src/http";

describe("parseApiResponse", () => {
  test("errCode 0 returns success", () => {
    const [ok, err] = parseApiResponse({ errCode: 0 });
    expect(ok).toBe(true);
    expect(err).toBeNull();
  });

  test("errCode -1 returns failure", () => {
    const [ok, err] = parseApiResponse({ errCode: -1, errMsg: "bad" });
    expect(ok).toBe(false);
    expect(err).toContain("errCode=-1");
    expect(err).toContain("bad");
  });

  test("errCode 1 returns failure with default message", () => {
    const [ok, err] = parseApiResponse({ errCode: 1 });
    expect(ok).toBe(false);
    expect(err).toContain("Unknown error");
  });

  test("missing errCode defaults to -1", () => {
    const [ok, err] = parseApiResponse({});
    expect(ok).toBe(false);
    expect(err).toContain("errCode=-1");
  });

  test("null errCode defaults to -1", () => {
    const [ok, err] = parseApiResponse({ errCode: null });
    expect(ok).toBe(false);
  });

  test("errCode 0 with errMsg still succeeds", () => {
    const [ok, err] = parseApiResponse({ errCode: 0, errMsg: "ok" });
    expect(ok).toBe(true);
    expect(err).toBeNull();
  });
});