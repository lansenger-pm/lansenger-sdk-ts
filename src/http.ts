type AnyDict = Record<string, any>;

export type FetchFn = (url: string | URL, init?: RequestInit) => Promise<Response>;

export async function doGet(
  url: string,
  fetchFn?: FetchFn,
): Promise<[AnyDict | null, string | null]> {
  const fn = fetchFn || (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fn) throw new Error("No fetch function available. Ensure the SDK is properly initialized or provide a fetchFn parameter.");
  try {
    const response = await fn(url);
    if (!response.ok) {
      return [null, `HTTP error: ${response.status} ${response.statusText}`];
    }
    const data = await response.json();
    return [data as AnyDict, null];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [null, `Request error: ${msg}`];
  }
}

export async function doPost(
  url: string,
  body: AnyDict,
  fetchFn?: FetchFn,
): Promise<[AnyDict | null, string | null]> {
  const fn = fetchFn || (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fn) throw new Error("No fetch function available. Ensure the SDK is properly initialized or provide a fetchFn parameter.");
  try {
    const response = await fn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return [null, `HTTP error: ${response.status} ${response.statusText}`];
    }
    const data = await response.json();
    return [data as AnyDict, null];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [null, `Request error: ${msg}`];
  }
}

export async function doPostMultipart(
  url: string,
  formData: FormData,
  fetchFn?: FetchFn,
): Promise<[AnyDict | null, string | null]> {
  const fn = fetchFn || (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fn) throw new Error("No fetch function available. Ensure the SDK is properly initialized or provide a fetchFn parameter.");
  try {
    const response = await fn(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return [null, `HTTP error: ${response.status} ${response.statusText}`];
    }
    const data = await response.json();
    return [data as AnyDict, null];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [null, `Request error: ${msg}`];
  }
}

export function parseApiResponse(
  data: AnyDict,
): [boolean, string | null] {
  const errCode = data.errCode ?? -1;
  if (errCode !== 0) {
    const msg = data.errMsg || "Unknown error";
    return [false, `API error (errCode=${errCode}): ${msg}`];
  }
  return [true, null];
}