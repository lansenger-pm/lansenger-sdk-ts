import { LansengerConfig } from "../src/config";
import { API_ENDPOINTS, QUESTIONNAIRE_QUESTION_TYPES } from "../src/constants";
import {
  saveQuestionnaire,
  saveQuestionnaireQuestions,
  publishQuestionnaire,
  withdrawQuestionnaire,
  fetchQuestionnaireDetail,
  fetchQuestionnaireBrief,
  fetchQuestionnairesByCodes,
  fetchQuestionnaireOfficeAccounts,
  fetchCreatedQuestionnaires,
  fetchAnswerRecords,
  fetchQuestionnaireAnswerDetail,
  fetchQuestionnaireUploadUrl,
} from "../src/questionnaires";
import type { FetchFn } from "../src/http";

const config = new LansengerConfig("app1", "sec1");
const appToken = "test_token";

function mockFetchFn(responseData: Record<string, any>): FetchFn {
  return async () => ({ ok: true, status: 200, statusText: "OK", json: async () => responseData } as any);
}

function capturingFetch(capture: { body?: any }): FetchFn {
  return async (url, init) => {
    capture.body = JSON.parse((init?.body as string) || "{}");
    return { ok: true, status: 200, statusText: "OK", json: async () => ({ errCode: 0, data: "QN1" }) } as any;
  };
}

describe("saveQuestionnaire", () => {
  test("returns error on empty title", async () => {
    const r = await saveQuestionnaire(config, appToken, { title: "", account_code: "ACC" });
    expect(r.success).toBe(false);
    expect(r.error).toContain("title is required");
  });

  test("returns error on missing account_code", async () => {
    const r = await saveQuestionnaire(config, appToken, { title: "t", account_code: "" });
    expect(r.error).toContain("account_code is required");
  });

  test("returns success with questionnaire_code and camelCase body", async () => {
    const cap: { body?: any } = {};
    const r = await saveQuestionnaire(config, appToken, {
      title: "满意度调查", account_code: "ACC001", welcome_speech: "欢迎",
      code: "QN0", create_user_id: "U1", fetchFn: capturingFetch(cap),
    });
    expect(r.success).toBe(true);
    expect(r.questionnaire_code).toBe("QN1");
    expect(cap.body.title).toBe("满意度调查");
    expect(cap.body.accountCode).toBe("ACC001");
    expect(cap.body.welcomeSpeech).toBe("欢迎");
    expect(cap.body.createUserId).toBe("U1");
  });

  test("returns error on API error 3104", async () => {
    const r = await saveQuestionnaire(config, appToken, {
      title: "t", account_code: "BAD", fetchFn: mockFetchFn({ errCode: 3104, errMsg: "官方账号不存在！" }),
    });
    expect(r.success).toBe(false);
    expect(r.error).toContain("errCode=3104");
  });
});

describe("saveQuestionnaireQuestions", () => {
  test("returns error on empty list", async () => {
    const r = await saveQuestionnaireQuestions(config, appToken, "QN1", []);
    expect(r.error).toContain("question_list is required");
  });

  test("returns saved_count on success", async () => {
    const r = await saveQuestionnaireQuestions(config, appToken, "QN1", [{ questionName: "Q1" }], {
      fetchFn: mockFetchFn({ errCode: 0, data: 1 }),
    });
    expect(r.success).toBe(true);
    expect(r.saved_count).toBe(1);
  });
});

describe("publishQuestionnaire", () => {
  test("returns error on invalid scope_type", async () => {
    const r = await publishQuestionnaire(config, appToken, "QN1", { scope_type: 9 });
    expect(r.error).toContain("scope_type must be 1");
  });

  test("sends documented defaults and staff list", async () => {
    const cap: { body?: any } = {};
    const r = await publishQuestionnaire(config, appToken, "QN1", {
      scope_type: 1, staff_ids: ["U1", "U2"], message_flag: 1, fetchFn: capturingFetch(cap),
    });
    expect(r.success).toBe(true);
    expect(r.done).toBe(true);
    expect(cap.body.scopeType).toBe(1);
    expect(cap.body.staffIdList).toEqual(["U1", "U2"]);
    expect(cap.body.answerLimit).toBe(1);
    expect(cap.body.viewStatsFlag).toBe(1);
    expect(cap.body.anonymFlag).toBe(0);
  });
});

describe("lifecycle code-body endpoints", () => {
  test("withdraw sends questionnaireCode (+operateUserId)", async () => {
    const cap: { body?: any } = {};
    const r = await withdrawQuestionnaire(config, appToken, "QN1", {
      operate_user_id: "U1", fetchFn: capturingFetch(cap),
    });
    expect(r.success).toBe(true);
    expect(r.done).toBe(true);
    expect(cap.body).toEqual({ questionnaireCode: "QN1", operateUserId: "U1" });
  });

  test("returns error on empty code", async () => {
    const r = await withdrawQuestionnaire(config, appToken, "");
    expect(r.error).toContain("questionnaire_code is required");
  });
});

describe("detail endpoints", () => {
  test("detail extracts fields incl. questions", async () => {
    const r = await fetchQuestionnaireDetail(config, appToken, "QN1", {
      fetchFn: mockFetchFn({ errCode: 0, data: { id: 1001, code: "QN1", title: "t", status: 2, questionCount: 1, questionList: [{ code: "Q1" }] } }),
    });
    expect(r.success).toBe(true);
    expect(r.questionnaire_id).toBe(1001);
    expect(r.questions![0].code).toBe("Q1");
  });

  test("brief has no questions", async () => {
    const r = await fetchQuestionnaireBrief(config, appToken, "QN1", {
      fetchFn: mockFetchFn({ errCode: 0, data: { code: "QN1", questionCount: 3 } }),
    });
    expect(r.success).toBe(true);
    expect(r.questions).toBeNull();
    expect(r.question_count).toBe(3);
  });
});

describe("paged endpoints", () => {
  test("created-list parses PageResult", async () => {
    const r = await fetchCreatedQuestionnaires(config, appToken, "ACC001", {
      status: 2,
      fetchFn: mockFetchFn({ errCode: 0, data: { pageNo: 2, pageSize: 10, pages: 3, total: 25, result: [{ code: "QN1" }], hasNextPage: true } }),
    });
    expect(r.success).toBe(true);
    expect(r.total).toBe(25);
    expect(r.page_no).toBe(2);
    expect(r.has_more).toBe(true);
    expect(r.items![0].code).toBe("QN1");
  });

  test("returns error on missing account_code", async () => {
    const r = await fetchCreatedQuestionnaires(config, appToken, "");
    expect(r.error).toContain("account_code is required");
  });

  test("answer records parses PageResult", async () => {
    const r = await fetchAnswerRecords(config, appToken, "ACC", "QN1", {
      fetchFn: mockFetchFn({ errCode: 0, data: { total: 1, result: [{ code: "AR1", answerUserName: "张三" }], hasNextPage: false } }),
    });
    expect(r.success).toBe(true);
    expect(r.items![0].answerUserName).toBe("张三");
  });
});

describe("answer detail and accounts", () => {
  test("answer-detail exposes answerMap", async () => {
    const r = await fetchQuestionnaireAnswerDetail(config, appToken, "ACC", "AR1", {
      fetchFn: mockFetchFn({ errCode: 0, data: { answerUserName: "张三", questionnaire: { code: "QN1" }, answerMap: { Q1: { context: "非常满意" } } } }),
    });
    expect(r.success).toBe(true);
    expect(r.answers!.Q1.context).toBe("非常满意");
    expect(r.questionnaire!.code).toBe("QN1");
  });

  test("office accounts returns list", async () => {
    const r = await fetchQuestionnaireOfficeAccounts(config, appToken, {
      fetchFn: mockFetchFn({ errCode: 0, data: [{ code: "ACC001", roleName: "人事部" }] }),
    });
    expect(r.success).toBe(true);
    expect(r.total).toBe(1);
    expect(r.accounts![0].code).toBe("ACC001");
  });

  test("query-list returns error on empty codes", async () => {
    const r = await fetchQuestionnairesByCodes(config, appToken, []);
    expect(r.error).toContain("code_list is required");
  });
});

describe("upload-url", () => {
  test("returns url on success", async () => {
    const r = await fetchQuestionnaireUploadUrl(config, appToken, "a.png", "md5", 1024, {
      fetchFn: mockFetchFn({ errCode: 0, data: "https://oss.example.com/u?sign=x" }),
    });
    expect(r.success).toBe(true);
    expect(r.url).toContain("oss.example.com");
  });

  test("returns error on missing size", async () => {
    const r = await fetchQuestionnaireUploadUrl(config, appToken, "a.png", "md5", 0);
    expect(r.error).toContain("size is required");
  });
});

describe("questionnaire constants", () => {
  test("endpoint paths", () => {
    expect(API_ENDPOINTS.questionnaires.save).toBe("/xtra/questionnaire/server/openapi/v1/saveQuestionnaire");
    expect(API_ENDPOINTS.questionnaires.upload_url).toBe("/xtra/questionnaire/server/openapi/v1/upload");
  });

  test("16 question types", () => {
    expect(QUESTIONNAIRE_QUESTION_TYPES).toHaveLength(16);
  });
});
