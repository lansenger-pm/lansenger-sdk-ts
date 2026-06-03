import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doGet, doPost, doPostMultipart, parseApiResponse, FetchFn } from "./http";
import { TokenManager } from "./auth";
import { MEDIA_TYPE_FILE, MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO, APP_MEDIA_TYPE_FILE, guessMediaType, guessAppMediaType } from "./constants";
import { UploadMediaResult, DownloadMediaResult, MediaPathResult } from "./models";
import { LansengerFileError } from "./exceptions";

export async function uploadMedia(
  config: LansengerConfig,
  tokenManager: TokenManager,
  fetchFn: FetchFn,
  filePath: string,
  mediaType: number = MEDIA_TYPE_FILE,
  userToken: string = "",
): Promise<UploadMediaResult> {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile())
    return new UploadMediaResult({ success: false, error: `File not found: ${filePath}` });
  let token: string;
  try { token = await tokenManager.getToken(); } catch (e) { return new UploadMediaResult({ success: false, error: `Auth failed: ${e instanceof Error ? e.message : String(e)}` }); }
  const url = buildApiUrl(config, "media", "create", token, { userToken }) + `&type=${mediaType}`;
  try {
    const fileContent = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("media", new Blob([fileContent]), path.basename(filePath));
    const [data, httpErr] = await doPostMultipart(url, formData, fetchFn);
    if (httpErr) return new UploadMediaResult({ success: false, error: httpErr });
    const errCode = data!.errCode ?? -1;
    if (errCode !== 0) {
      const msg = data!.errMsg || "Unknown upload error";
      return new UploadMediaResult({ success: false, error: `Upload API error (errCode=${errCode}): ${msg}` });
    }
    const d = data!.data || {};
    if (!d.mediaId) return new UploadMediaResult({ success: false, error: "Upload response missing mediaId" });
    return new UploadMediaResult({ success: true, media_id: d.mediaId, created_time: d.createdTime });
  } catch (e) {
    return new UploadMediaResult({ success: false, error: `File read error: ${e instanceof Error ? e.message : String(e)}` });
  }
}

export async function uploadAppMedia(
  config: LansengerConfig,
  tokenManager: TokenManager,
  fetchFn: FetchFn,
  filePath: string,
  mediaType: string = APP_MEDIA_TYPE_FILE,
  opts?: { width?: number; height?: number; duration?: number },
): Promise<UploadMediaResult> {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile())
    return new UploadMediaResult({ success: false, error: `File not found: ${filePath}` });
  let token: string;
  try { token = await tokenManager.getToken(); } catch (e) { return new UploadMediaResult({ success: false, error: `Auth failed: ${e instanceof Error ? e.message : String(e)}` }); }
  let url = buildApiUrl(config, "media", "app_create", token) + `&type=${mediaType}`;
  if (opts?.width != null) url += `&width=${opts.width}`;
  if (opts?.height != null) url += `&height=${opts.height}`;
  if (opts?.duration != null) url += `&duration=${opts.duration}`;
  try {
    const fileContent = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("media", new Blob([fileContent]), path.basename(filePath));
    const [data, httpErr] = await doPostMultipart(url, formData, fetchFn);
    if (httpErr) return new UploadMediaResult({ success: false, error: httpErr });
    const errCode = data!.errCode ?? -1;
    if (errCode !== 0) {
      const msg = data!.errMsg || "Unknown upload error";
      return new UploadMediaResult({ success: false, error: `Upload API error (errCode=${errCode}): ${msg}` });
    }
    const d = data!.data || {};
    if (!d.mediaId) return new UploadMediaResult({ success: false, error: "Upload response missing mediaId" });
    return new UploadMediaResult({ success: true, media_id: d.mediaId });
  } catch (e) {
    return new UploadMediaResult({ success: false, error: `File read error: ${e instanceof Error ? e.message : String(e)}` });
  }
}

export async function downloadMedia(
  config: LansengerConfig,
  tokenManager: TokenManager,
  fetchFn: FetchFn,
  mediaId: string,
): Promise<DownloadMediaResult> {
  let token: string;
  try { token = await tokenManager.getToken(); } catch (e) { return new DownloadMediaResult({ success: false, error: `Auth failed: ${e instanceof Error ? e.message : String(e)}` }); }
  const url = buildApiUrl(config, "media", "fetch", token, { pathVars: { media_id: mediaId } });
  try {
    const response = await fetchFn(url);
    if (!response.ok) return new DownloadMediaResult({ success: false, error: `Download HTTP error: ${response.status}` });
    const arrayBuffer = await response.arrayBuffer();
    return new DownloadMediaResult({ success: true, data: Buffer.from(arrayBuffer) });
  } catch (e) {
    return new DownloadMediaResult({ success: false, error: `Download HTTP error: ${e instanceof Error ? e.message : String(e)}` });
  }
}

export async function downloadMediaToFile(
  config: LansengerConfig,
  tokenManager: TokenManager,
  fetchFn: FetchFn,
  mediaId: string,
  targetPath?: string,
  mediaType: string = "file",
): Promise<string> {
  const result = await downloadMedia(config, tokenManager, fetchFn, mediaId);
  if (!result.success || !result.data) throw new LansengerFileError(`Download failed: ${result.error}`);
  const extMap: Record<string, string> = { image: ".jpg", video: ".mp4", file: ".dat", voice: ".amr" };
  let ext = extMap[mediaType] || ".dat";
  const mediaBytes = result.data;
  if (mediaType === "image" && mediaBytes.length >= 8) {
    if (mediaBytes[0] === 0xff && mediaBytes[1] === 0xd8) ext = ".jpg";
    else if (mediaBytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = ".png";
  }
  if (!targetPath) {
    const tmpDir = os.tmpdir();
    targetPath = path.join(tmpDir, `lansenger_${mediaType}_${mediaId}${ext}`);
  }
  fs.writeFileSync(targetPath, mediaBytes);
  return targetPath;
}

export async function fetchMediaPath(
  config: LansengerConfig,
  appToken: string,
  mediaId: string,
  opts?: { user_token?: string; fetchFn?: FetchFn },
): Promise<MediaPathResult> {
  if (!mediaId) return new MediaPathResult({ success: false, error: "media_id is required" });
  const userToken = opts?.user_token || "";
  const url = buildApiUrl(config, "media", "path_fetch", appToken, { userToken, pathVars: { media_id: mediaId } });
  const [data, httpErr] = await doGet(url, opts?.fetchFn);
  if (httpErr) return new MediaPathResult({ success: false, error: httpErr });
  const errCode = data!.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data!.errMsg || "Unknown error";
    return new MediaPathResult({ success: false, error: `API error (errCode=${errCode}): ${msg}` });
  }
  const d = data!.data || {};
  return new MediaPathResult({
    success: true, media_path: d.mediaPath, name: d.name,
    type: d.type, size: d.size, raw_response: data!,
  });
}