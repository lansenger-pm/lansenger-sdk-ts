import { fetchChatList, fetchChatMessages } from "../src/chats";
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

describe("fetchChatList", () => {
  test("returns success with staff and group infos", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: {
        staffIdInfos: [{ staffId: "s1", staffName: "Zhang", sectorName: ["d1"] }],
        groupIdInfos: [{ groupId: "g1", groupName: "Group1" }],
      },
    });
    const result = await fetchChatList(config, appToken, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.staff_infos).toHaveLength(1);
    expect(result.staff_infos![0].staff_id).toBe("s1");
    expect(result.group_infos).toHaveLength(1);
    expect(result.group_infos![0].group_id).toBe("g1");
  });

  test("returns success with empty infos", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: { staffIdInfos: [], groupIdInfos: [] },
    });
    const result = await fetchChatList(config, appToken, { fetchFn });
    expect(result.success).toBe(true);
    expect(result.staff_infos).toHaveLength(0);
    expect(result.group_infos).toHaveLength(0);
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500);
    const result = await fetchChatList(config, appToken, { fetchFn });
    expect(result.success).toBe(false);
  });

  test("returns error on API error", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "bad" });
    const result = await fetchChatList(config, appToken, { fetchFn });
    expect(result.success).toBe(false);
    expect(result.error).toContain("API error");
  });
});

describe("fetchChatMessages", () => {
  test("returns success with messages", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: {
        hasMore: true,
        total: 5,
        lastVersion: "v2",
        name: "Chat",
        chatType: "private",
        messageList: [{
          messageInfo: {
            sendTime: "100",
            sender: "s1",
            messageType: "text",
            content: { text: "hello" },
          },
        }],
      },
    });
    const result = await fetchChatMessages(config, appToken, { staff_id: "s1", fetchFn });
    expect(result.success).toBe(true);
    expect(result.has_more).toBe(true);
    expect(result.total).toBe(5);
    expect(result.messages).toHaveLength(1);
    expect(result.messages![0].send_time).toBe("100");
    expect(result.messages![0].content!.text).toBe("hello");
  });

  test("returns error without staff_id or group_id", async () => {
    const result = await fetchChatMessages(config, appToken, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain("staff_id or group_id is required");
  });

  test("returns success with group_id", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: {
        hasMore: false, total: 0, lastVersion: "v1",
        name: "GroupChat", chatType: "group", messageList: [],
      },
    });
    const result = await fetchChatMessages(config, appToken, { group_id: "g1", fetchFn });
    expect(result.success).toBe(true);
    expect(result.chat_type).toBe("group");
  });

  test("returns error on HTTP failure", async () => {
    const fetchFn = mockErrorFetchFn(500);
    const result = await fetchChatMessages(config, appToken, { staff_id: "s1", fetchFn });
    expect(result.success).toBe(false);
  });

  test("returns error on API error", async () => {
    const fetchFn = mockFetchFn({ errCode: 40001, errMsg: "bad" });
    const result = await fetchChatMessages(config, appToken, { staff_id: "s1", fetchFn });
    expect(result.success).toBe(false);
  });

  test("handles messageInfos array", async () => {
    const fetchFn = mockFetchFn({
      errCode: 0,
      data: {
        hasMore: false, total: 1, lastVersion: "v1",
        name: "Chat", chatType: "private",
        messageList: [{
          messageInfos: [{
            sendTime: "200",
            sender: "s2",
            messageType: "image",
            content: { imageUrl: "http://img" },
          }],
        }],
      },
    });
    const result = await fetchChatMessages(config, appToken, { staff_id: "s1", fetchFn });
    expect(result.success).toBe(true);
    expect(result.messages![0].message_type).toBe("image");
  });
});