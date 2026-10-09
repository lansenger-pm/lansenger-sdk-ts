import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { uploadAppMediaV2, downloadMediaByShareId, downloadMediaToFile, downloadMediaToFileResult } from "../src/media";
import { TokenManager } from "../src/auth";
import { LansengerConfig } from "../src/config";
import { FetchFn } from "../src/http";

const config = new LansengerConfig("app1", "sec1", "https://your-gateway.example.com");

function mockTokenFetchFn(): FetchFn {
  return async () =>
    ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ errCode: 0, data: { appToken: "app_tok", expiresIn: 7200 } }),
    }) as any;
}

function makeTokenManager(): TokenManager {
  return new TokenManager(config, mockTokenFetchFn());
}

// fetchFn that serves the app-token request and delegates everything else to handler
function routedFetchFn(handler: (url: string, init?: RequestInit) => Promise<any>): FetchFn {
  return async (url: string | URL, init?: RequestInit) => {
    if (url.toString().includes("apptoken/create")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ errCode: 0, data: { appToken: "app_tok", expiresIn: 7200 } }),
      } as any;
    }
    return handler(url.toString(), init);
  };
}

function mockUploadResponse(responseData: Record<string, any>): FetchFn {
  return routedFetchFn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => responseData,
  }));
}

describe("uploadAppMediaV2", () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lansenger_media_test_"));
    tmpFile = path.join(tmpDir, "test.jpg");
    fs.writeFileSync(tmpFile, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns media_id on successful upload", async () => {
    const fetchFn = mockUploadResponse({ errCode: 0, data: { mediaId: "mid_v2_123" } });
    const result = await uploadAppMediaV2(config, makeTokenManager(), fetchFn, tmpFile, "user_tok_1");
    expect(result.success).toBe(true);
    expect(result.media_id).toBe("mid_v2_123");
    expect(result.error).toBeNull();
  });

  test("builds V2 URL with userToken, type and optional params", async () => {
    let capturedUrl = "";
    const fetchFn = routedFetchFn(async (url) => {
      capturedUrl = url;
      return { ok: true, status: 200, statusText: "OK", json: async () => ({ errCode: 0, data: { mediaId: "m1" } }) };
    });
    const result = await uploadAppMediaV2(
      config, makeTokenManager(), fetchFn, tmpFile, "user_tok_1", "image",
      { width: 100, height: 200, duration: 5 },
    );
    expect(result.success).toBe(true);
    expect(capturedUrl).toContain("/v2/app/medias/create");
    expect(capturedUrl).toContain("app_token=app_tok");
    expect(capturedUrl).toContain("user_token=user_tok_1");
    expect(capturedUrl).toContain("type=image");
    expect(capturedUrl).toContain("width=100");
    expect(capturedUrl).toContain("height=200");
    expect(capturedUrl).toContain("duration=5");
  });

  test("returns error when file does not exist", async () => {
    const fetchFn = mockUploadResponse({ errCode: 0, data: { mediaId: "m1" } });
    const result = await uploadAppMediaV2(
      config, makeTokenManager(), fetchFn, path.join(tmpDir, "no_such_file.jpg"), "user_tok_1",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("File not found");
  });

  test("returns error on API error (errCode != 0)", async () => {
    const fetchFn = mockUploadResponse({ errCode: 40001, errMsg: "invalid media" });
    const result = await uploadAppMediaV2(config, makeTokenManager(), fetchFn, tmpFile, "user_tok_1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Upload API error");
    expect(result.error).toContain("40001");
  });

  test("returns error when userToken is empty (required for V2)", async () => {
    const fetchFn = mockUploadResponse({ errCode: 0, data: { mediaId: "m1" } });
    const result = await uploadAppMediaV2(config, makeTokenManager(), fetchFn, tmpFile, "");
    expect(result.success).toBe(false);
    expect(result.error).toContain("userToken is required");
  });
});

describe("downloadMediaByShareId", () => {
  function mockBinaryDownload(body: Uint8Array, contentType: string): FetchFn {
    return routedFetchFn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null) },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    }));
  }

  test("returns Buffer on successful download", async () => {
    const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fetchFn = mockBinaryDownload(payload, "application/octet-stream");
    const result = await downloadMediaByShareId(config, makeTokenManager(), fetchFn, "share_123");
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(Buffer.from(payload));
  });

  test("returns error on JSON error response (Content-Type: application/json)", async () => {
    const body = new TextEncoder().encode(JSON.stringify({ errCode: 40013, errMsg: "share expired" }));
    const fetchFn = mockBinaryDownload(body, "application/json");
    const result = await downloadMediaByShareId(config, makeTokenManager(), fetchFn, "share_expired");
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toContain("Download API error");
    expect(result.error).toContain("40013");
    expect(result.error).toContain("share expired");
  });

  test("passes userToken into the request URL", async () => {
    let capturedUrl = "";
    const fetchFn = routedFetchFn(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/octet-stream" },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      };
    });
    const result = await downloadMediaByShareId(
      config, makeTokenManager(), fetchFn, "share_123", { userToken: "ut_abc" },
    );
    expect(result.success).toBe(true);
    expect(capturedUrl).toContain("/v1/media/share/share_123/fetch");
    expect(capturedUrl).toContain("app_token=app_tok");
    expect(capturedUrl).toContain("user_token=ut_abc");
  });

  test("omits user_token param when userToken is not provided", async () => {
    let capturedUrl = "";
    const fetchFn = routedFetchFn(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/octet-stream" },
        arrayBuffer: async () => new Uint8Array([1]).buffer,
      };
    });
    const result = await downloadMediaByShareId(config, makeTokenManager(), fetchFn, "share_123");
    expect(result.success).toBe(true);
    expect(capturedUrl).not.toContain("user_token=");
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = routedFetchFn(async () => ({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(0),
    }));
    const result = await downloadMediaByShareId(config, makeTokenManager(), fetchFn, "share_123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });
});

describe("downloadMediaToFile / downloadMediaToFileResult", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lansenger_dl_test_"));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function binaryFetchFn(body: Buffer, contentType = "application/octet-stream"): FetchFn {
    return routedFetchFn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => contentType },
      arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    }));
  }

  function jsonErrorFetchFn(payload: Record<string, any>): FetchFn {
    return binaryFetchFn(Buffer.from(JSON.stringify(payload)), "application/json");
  }

  test("downloadMediaToFileResult writes the file and reports path and size", async () => {
    const target = path.join(tmpDir, "ok.dat");
    const result = await downloadMediaToFileResult(
      config, makeTokenManager(), binaryFetchFn(Buffer.from("hello-bytes")), "media_1", target,
    );
    expect(result.success).toBe(true);
    expect(result.path).toBe(target);
    expect(result.size).toBe(11);
    expect(fs.readFileSync(target).toString()).toBe("hello-bytes");
    expect(result.toDict()).toEqual({ success: true, path: target, size: 11 });
  });

  test("downloadMediaToFileResult returns error instead of throwing on API error", async () => {
    const result = await downloadMediaToFileResult(
      config, makeTokenManager(),
      jsonErrorFetchFn({ errCode: 50000, errMsg: "OPEN ID invalid" }), "media_bad",
    );
    expect(result.success).toBe(false);
    expect(result.path).toBeNull();
    expect(result.error).toContain("errCode=50000");
  });

  test("downloadMediaToFileResult returns error when the save fails", async () => {
    const result = await downloadMediaToFileResult(
      config, makeTokenManager(), binaryFetchFn(Buffer.from("payload")), "media_2",
      "/nonexistent-dir-xyz/out.dat",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Save failed");
  });

  test("downloadMediaToFileResult sniffs png extension for image type", async () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(8),
    ]);
    const result = await downloadMediaToFileResult(
      config, makeTokenManager(), binaryFetchFn(png), "media_img", undefined, "image",
    );
    expect(result.success).toBe(true);
    expect(result.path!.endsWith(".png")).toBe(true);
    fs.unlinkSync(result.path!);
  });

  test("downloadMediaToFile keeps throwing LansengerFileError on API error", async () => {
    await expect(
      downloadMediaToFile(
        config, makeTokenManager(),
        jsonErrorFetchFn({ errCode: 50000, errMsg: "OPEN ID invalid" }),
        "media_bad", path.join(tmpDir, "never.dat"),
      ),
    ).rejects.toThrow(/Download failed/);
    expect(fs.existsSync(path.join(tmpDir, "never.dat"))).toBe(false);
  });

  test("downloadMediaToFile still returns the path on success", async () => {
    const target = path.join(tmpDir, "d2f.dat");
    const returned = await downloadMediaToFile(
      config, makeTokenManager(), binaryFetchFn(Buffer.from("abc")), "media_3", target,
    );
    expect(returned).toBe(target);
    expect(fs.readFileSync(target).toString()).toBe("abc");
  });
});
