import {
  parseCallbackPayload, verifyCallbackSignature,
  CallbackEvent, AccountSubscribeData, StaffModifyData,
  BotPrivateMessageData, BotGroupMessageData,
  CALLBACK_EVENT_TYPES, getCallbackEventTypes,
} from "../src/callbacks";
import * as crypto from "crypto";

function computeSignature(token: string, timestamp: string, nonce: string, dataEncrypt: string): string {
  const params = [token, timestamp, nonce, dataEncrypt];
  params.sort();
  return crypto.createHash("sha1").update(params.join(""), "utf8").digest("hex");
}

describe("verifyCallbackSignature", () => {
  test("returns true for valid signature", () => {
    const token = "test_token";
    const timestamp = "12345";
    const nonce = "abcde";
    const dataEncrypt = "encrypted_data";
    const signature = computeSignature(token, timestamp, nonce, dataEncrypt);
    const result = verifyCallbackSignature(timestamp, nonce, signature, token, dataEncrypt);
    expect(result).toBe(true);
  });

  test("returns false for invalid signature", () => {
    const result = verifyCallbackSignature("12345", "abcde", "invalid_sig", "key", "data");
    expect(result).toBe(false);
  });

  test("uses callback_token when provided", () => {
    const encodingKey = "ek";
    const callbackToken = "custom_token";
    const timestamp = "100";
    const nonce = "n1";
    const dataEncrypt = "d1";
    const signature = computeSignature(callbackToken, timestamp, nonce, dataEncrypt);
    const result = verifyCallbackSignature(timestamp, nonce, signature, encodingKey, dataEncrypt, callbackToken);
    expect(result).toBe(true);
  });

  test("uses encodingKey when no callbackToken", () => {
    const encodingKey = "my_key";
    const timestamp = "200";
    const nonce = "n2";
    const dataEncrypt = "d2";
    const signature = computeSignature(encodingKey, timestamp, nonce, dataEncrypt);
    const result = verifyCallbackSignature(timestamp, nonce, signature, encodingKey, dataEncrypt);
    expect(result).toBe(true);
  });

  test("returns true with empty dataEncrypt", () => {
    const token = "t";
    const timestamp = "ts";
    const nonce = "n";
    const signature = computeSignature(token, timestamp, nonce, "");
    const result = verifyCallbackSignature(timestamp, nonce, signature, token, "");
    expect(result).toBe(true);
  });
});

describe("parseCallbackPayload", () => {
  test("parses plain JSON payload without encodingKey", () => {
    const payload = JSON.stringify({
      events: [
        { eventType: "staff_modify", data: { staffId: "s1", timestamp: "100" }, eventId: 1 },
      ],
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("staff_modify");
    expect(events[0].category).toBe("staff");
  });

  test("parses account_subscribe event", () => {
    const payload = JSON.stringify({
      events: [
        { eventType: "account_subscribe", data: { staffId: "s1", createTime: "100" } },
      ],
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("account_subscribe");
    expect(events[0].category).toBe("public_account");
    expect((events[0].data as any).staff_id).toBe("s1");
  });

  test("parses bot_private_message event", () => {
    const payload = JSON.stringify({
      events: [
        {
          eventType: "bot_private_message",
          data: { from: "s1", entryId: "e1", msgType: "text", msgData: { text: "hi" } },
        },
      ],
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect((events[0].data as any).from_id).toBe("s1");
    expect((events[0].data as any).msg_type).toBe("text");
  });

  test("parses bot_group_message event", () => {
    const payload = JSON.stringify({
      events: [
        {
          eventType: "bot_group_message",
          data: { from: "s1", groupId: "g1", msgId: "m1", botId: "b1", isAtMe: true, isAtAll: false },
        },
      ],
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect((events[0].data as any).group_id).toBe("g1");
    expect((events[0].data as any).is_at_me).toBe(true);
  });

  test("throws on encrypted payload without encodingKey", () => {
    const payload = JSON.stringify({ dataEncrypt: "abc123" });
    expect(() => parseCallbackPayload(payload)).toThrow("requires encodingKey");
  });

  test("parses single event (not in array)", () => {
    const payload = JSON.stringify({
      events: { eventType: "staff_delete", data: { staffId: "s1", timestamp: "200" } },
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("staff_delete");
  });

  test("inherits appId and orgId from top level", () => {
    const payload = JSON.stringify({
      appId: "app1",
      orgId: "org1",
      events: [{ eventType: "staff_modify", data: { staffId: "s1", timestamp: "100" } }],
    });
    const events = parseCallbackPayload(payload);
    expect(events[0].app_id).toBe("app1");
    expect(events[0].org_id).toBe("org1");
  });

  test("event inherits appId from entry if present", () => {
    const payload = JSON.stringify({
      events: [{ eventType: "staff_modify", appId: "app2", data: { staffId: "s1", timestamp: "100" } }],
    });
    const events = parseCallbackPayload(payload);
    expect(events[0].app_id).toBe("app2");
  });

  test("unknown event type has category unknown", () => {
    const payload = JSON.stringify({
      events: [{ eventType: "unknown_event", data: { foo: "bar" } }],
    });
    const events = parseCallbackPayload(payload);
    expect(events[0].category).toBe("unknown");
  });

  test("uses entry data when data is empty", () => {
    const payload = JSON.stringify({
      events: [{ eventType: "staff_modify", data: {}, staffId: "s1" }],
    });
    const events = parseCallbackPayload(payload);
    expect(events).toHaveLength(1);
  });

  test("parses plain JSON with encodingKey but no dataEncrypt", () => {
    const payload = JSON.stringify({
      events: [{ eventType: "staff_modify", data: { staffId: "s1", timestamp: "100" } }],
    });
    const events = parseCallbackPayload(payload, { encodingKey: "some_key" });
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("staff_modify");
  });
});

describe("CallbackEvent", () => {
  test("constructor defaults", () => {
    const e = new CallbackEvent({});
    expect(e.event_id).toBe(0);
    expect(e.event_type).toBe("");
    expect(e.category).toBe("");
    expect(e.data).toEqual({});
  });

  test("toDict", () => {
    const data = new StaffModifyData({ staff_id: "s1", timestamp: "100" });
    const e = new CallbackEvent({ event_id: 1, event_type: "staff_modify", category: "staff", data, app_id: "app1" });
    const d = e.toDict();
    expect(d.event_id).toBe(1);
    expect(d.event_type).toBe("staff_modify");
    expect(d.app_id).toBe("app1");
    expect(d.data.staff_id).toBe("s1");
  });
});

describe("getCallbackEventTypes", () => {
  test("returns event type map", () => {
    const types = getCallbackEventTypes();
    expect(types.bot_private_message).toBe("bot");
    expect(types.staff_modify).toBe("staff");
  });
});

describe("CALLBACK_EVENT_TYPES", () => {
  test("contains expected entries", () => {
    expect(CALLBACK_EVENT_TYPES.account_subscribe).toBe("public_account");
    expect(CALLBACK_EVENT_TYPES.dept_create).toBe("department");
    expect(CALLBACK_EVENT_TYPES.app_install_org).toBe("app");
    expect(CALLBACK_EVENT_TYPES.ua_cert_create).toBe("certificate");
    expect(CALLBACK_EVENT_TYPES.report_location).toBe("location");
    expect(CALLBACK_EVENT_TYPES.schedule_modify).toBe("calendar");
  });
});