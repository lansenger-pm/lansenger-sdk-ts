import { setSDKDebug, isSDKDebug } from "../src/debug";

describe("SDK debug logging", () => {
  afterEach(() => {
    setSDKDebug(false);
  });

  test("setSDKDebug(true) → isSDKDebug() returns true", () => {
    setSDKDebug(true);
    expect(isSDKDebug()).toBe(true);
  });

  test("setSDKDebug(false) → isSDKDebug() returns false", () => {
    setSDKDebug(true);
    setSDKDebug(false);
    expect(isSDKDebug()).toBe(false);
  });

  test("isSDKDebug() returns false by default", () => {
    // afterEach already resets to false, but verify explicitly
    expect(isSDKDebug()).toBe(false);
  });
});
