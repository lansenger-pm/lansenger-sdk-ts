import {
  LansengerError,
  LansengerAuthError,
  LansengerConfigError,
  LansengerAPIError,
  LansengerNetworkError,
  LansengerFileError,
} from "../src/exceptions";

describe("Exceptions", () => {
  test("LansengerError basic", () => {
    const err = new LansengerError("test msg");
    expect(err.message).toBe("test msg");
    expect(err.errCode).toBeUndefined();
    expect(err.retryable).toBe(false);
    expect(err instanceof Error).toBe(true);
  });

  test("LansengerError with errCode and retryable", () => {
    const err = new LansengerError("msg", 42, true);
    expect(err.errCode).toBe(42);
    expect(err.retryable).toBe(true);
  });

  test("LansengerAuthError", () => {
    const err = new LansengerAuthError("auth fail", 100);
    expect(err.message).toBe("auth fail");
    expect(err.errCode).toBe(100);
    expect(err.retryable).toBe(false);
    expect(err instanceof LansengerError).toBe(true);
  });

  test("LansengerConfigError", () => {
    const err = new LansengerConfigError("bad config");
    expect(err.message).toBe("bad config");
    expect(err.errCode).toBeUndefined();
    expect(err.retryable).toBe(false);
    expect(err instanceof LansengerError).toBe(true);
  });

  test("LansengerAPIError defaults retryable", () => {
    const err = new LansengerAPIError("api fail", -1);
    expect(err.retryable).toBe(true);
    expect(err.errCode).toBe(-1);
  });

  test("LansengerAPIError can set not retryable", () => {
    const err = new LansengerAPIError("api fail", 0, false);
    expect(err.retryable).toBe(false);
  });

  test("LansengerNetworkError defaults retryable", () => {
    const err = new LansengerNetworkError("network fail");
    expect(err.message).toBe("network fail");
    expect(err.errCode).toBeUndefined();
    expect(err.retryable).toBe(true);
  });

  test("LansengerNetworkError can set not retryable", () => {
    const err = new LansengerNetworkError("fail", false);
    expect(err.retryable).toBe(false);
  });

  test("LansengerFileError", () => {
    const err = new LansengerFileError("file fail");
    expect(err.message).toBe("file fail");
    expect(err.errCode).toBeUndefined();
    expect(err.retryable).toBe(false);
    expect(err instanceof LansengerError).toBe(true);
  });
});