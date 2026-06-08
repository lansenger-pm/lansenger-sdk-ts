import {
  API_ENDPOINTS, MEDIA_TYPE_VIDEO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_FILE,
  MEDIA_TYPE_AUDIO, APP_MEDIA_TYPE_FILE, APP_MEDIA_TYPE_VIDEO,
  APP_MEDIA_TYPE_IMAGE, APP_MEDIA_TYPE_AUDIO, IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS, AUDIO_EXTENSIONS, MAX_MESSAGE_LENGTH,
  TOKEN_REFRESH_MARGIN, TODO_TODO_STATUS_PENDING_READ,
  TODO_TODO_STATUS_READ, TODO_TODO_STATUS_PENDING_DO, TODO_TODO_STATUS_DONE,
  TODO_TYPE_NOTIFICATION, TODO_TYPE_APPROVAL, REMINDER_TYPE_NONE,
  REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS, REMINDER_TYPE_PHONE,
  CALLBACK_EVENT_TYPES, VERSION, guessMediaType, guessAppMediaType,
} from "../src/constants";

describe("API_ENDPOINTS", () => {
  test("has auth endpoints", () => {
    expect(API_ENDPOINTS.auth.tenant_access_token).toBe("/auth/v3/tenant_access_token/internal");
  });

  test("has app_token endpoints", () => {
    expect(API_ENDPOINTS.app_token.create).toBe("/v1/apptoken/create");
  });

  test("has staffs endpoints with path vars", () => {
    expect(API_ENDPOINTS.staffs.fetch).toContain("{staff_id}");
    expect(API_ENDPOINTS.staffs.detail_fetch).toContain("{staff_id}");
    expect(API_ENDPOINTS.staffs.department_ancestors).toContain("{staff_id}");
  });

  test("has departments endpoints with path vars", () => {
    expect(API_ENDPOINTS.departments.fetch).toContain("{department_id}");
  });

  test("has groups_v2 endpoints", () => {
    expect(API_ENDPOINTS.groups_v2.create).toBe("/v2/groups/create");
    expect(API_ENDPOINTS.groups_v2.info_fetch).toContain("{group_id}");
  });

  test("has calendar endpoints with path vars", () => {
    expect(API_ENDPOINTS.calendars.schedule_create).toContain("{calendar_id}");
    expect(API_ENDPOINTS.calendars.schedule_fetch).toContain("{schedule_id}");
  });

  test("has todo endpoints", () => {
    expect(API_ENDPOINTS.todo.create).toContain("todotask/create");
    expect(API_ENDPOINTS.todo.info_fetch).toContain("todotask/info/fetch");
  });

  test("has chats endpoints", () => {
    expect(API_ENDPOINTS.chats.fetch).toBe("/v1/chats/fetch");
  });

  test("has media endpoints", () => {
    expect(API_ENDPOINTS.media.create).toBe("/v1/medias/create");
    expect(API_ENDPOINTS.media.fetch).toContain("{media_id}");
  });

  test("has oauth2 endpoints", () => {
    expect(API_ENDPOINTS.oauth2.authorize).toBe("/oauth2/authorize");
    expect(API_ENDPOINTS.oauth2.user_token_create).toBe("/v2/user_token/create");
  });
});

describe("Media type constants", () => {
  test("numeric types", () => {
    expect(MEDIA_TYPE_VIDEO).toBe(1);
    expect(MEDIA_TYPE_IMAGE).toBe(2);
    expect(MEDIA_TYPE_FILE).toBe(3);
    expect(MEDIA_TYPE_AUDIO).toBe(4);
  });

  test("app media type strings", () => {
    expect(APP_MEDIA_TYPE_FILE).toBe("file");
    expect(APP_MEDIA_TYPE_VIDEO).toBe("video");
    expect(APP_MEDIA_TYPE_IMAGE).toBe("image");
    expect(APP_MEDIA_TYPE_AUDIO).toBe("audio");
  });

  test("extension sets", () => {
    expect(IMAGE_EXTENSIONS.has(".jpg")).toBe(true);
    expect(IMAGE_EXTENSIONS.has(".png")).toBe(true);
    expect(VIDEO_EXTENSIONS.has(".mp4")).toBe(true);
    expect(AUDIO_EXTENSIONS.has(".mp3")).toBe(true);
    expect(IMAGE_EXTENSIONS.has(".mp4")).toBe(false);
  });
});

describe("guessMediaType", () => {
  test("image extensions", () => {
    expect(guessMediaType("photo.jpg")).toBe(MEDIA_TYPE_IMAGE);
    expect(guessMediaType("photo.png")).toBe(MEDIA_TYPE_IMAGE);
    expect(guessMediaType("photo.gif")).toBe(MEDIA_TYPE_IMAGE);
    expect(guessMediaType("photo.webp")).toBe(MEDIA_TYPE_IMAGE);
  });

  test("video extensions", () => {
    expect(guessMediaType("video.mp4")).toBe(MEDIA_TYPE_VIDEO);
    expect(guessMediaType("video.mov")).toBe(MEDIA_TYPE_VIDEO);
  });

  test("falls back to file", () => {
    expect(guessMediaType("doc.pdf")).toBe(MEDIA_TYPE_FILE);
    expect(guessMediaType("data.xlsx")).toBe(MEDIA_TYPE_FILE);
    expect(guessMediaType("archive.zip")).toBe(MEDIA_TYPE_FILE);
  });

  test("case insensitive", () => {
    expect(guessMediaType("photo.JPG")).toBe(MEDIA_TYPE_IMAGE);
    expect(guessMediaType("video.MP4")).toBe(MEDIA_TYPE_VIDEO);
  });
});

describe("guessAppMediaType", () => {
  test("image extensions", () => {
    expect(guessAppMediaType("photo.jpg")).toBe(APP_MEDIA_TYPE_IMAGE);
  });

  test("video extensions", () => {
    expect(guessAppMediaType("video.mp4")).toBe(APP_MEDIA_TYPE_VIDEO);
  });

  test("audio extensions", () => {
    expect(guessAppMediaType("audio.mp3")).toBe(APP_MEDIA_TYPE_AUDIO);
    expect(guessAppMediaType("audio.wav")).toBe(APP_MEDIA_TYPE_AUDIO);
  });

  test("falls back to file", () => {
    expect(guessAppMediaType("doc.pdf")).toBe(APP_MEDIA_TYPE_FILE);
  });
});

describe("Other constants", () => {
  test("MAX_MESSAGE_LENGTH", () => {
    expect(MAX_MESSAGE_LENGTH).toBe(4000);
  });

  test("TOKEN_REFRESH_MARGIN", () => {
    expect(TOKEN_REFRESH_MARGIN).toBe(300);
  });

  test("todo status constants", () => {
    expect(TODO_TODO_STATUS_PENDING_READ).toBe("11");
    expect(TODO_TODO_STATUS_READ).toBe("12");
    expect(TODO_TODO_STATUS_PENDING_DO).toBe("21");
    expect(TODO_TODO_STATUS_DONE).toBe("22");
  });

  test("todo type constants", () => {
    expect(TODO_TYPE_NOTIFICATION).toBe(1);
    expect(TODO_TYPE_APPROVAL).toBe(2);
  });

  test("reminder type constants", () => {
    expect(REMINDER_TYPE_NONE).toBe(0);
    expect(REMINDER_TYPE_POPUP).toBe(1);
    expect(REMINDER_TYPE_SMS).toBe(2);
    expect(REMINDER_TYPE_PHONE).toBe(3);
  });

  test("CALLBACK_EVENT_TYPES has entries", () => {
    expect(CALLBACK_EVENT_TYPES.bot_private_message).toBe("bot");
    expect(CALLBACK_EVENT_TYPES.account_subscribe).toBe("public_account");
    expect(CALLBACK_EVENT_TYPES.staff_modify).toBe("staff");
  });

  test("VERSION", () => {
    expect(VERSION).toBe("1.2.2");
  });
});