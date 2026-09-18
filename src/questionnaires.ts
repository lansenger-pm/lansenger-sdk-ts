// Lansenger questionnaire API — create, publish, and analyze questionnaires (问卷系统).
//
// Endpoints: all 22 under /xtra/questionnaire/server/openapi/v1/ (POST).
// Paths carry a /server segment (production stage; dev/test environments omit it).
// Create/publish/answer endpoints require a valid accountCode (missing → errCode 3104).
// Question structures are passed through as camelCase dicts; validation errors
// may arrive concatenated without separators.

import { LansengerConfig } from "./config";
import { buildApiUrl } from "./urlHelpers";
import { doPost, parseApiResponse, FetchFn } from "./http";
import {
  QuestionnaireAccountListResult,
  QuestionnaireAnswerDetailResult,
  QuestionnaireAnswerUrlResult,
  QuestionnaireCopyResult,
  QuestionnaireDetailResult,
  QuestionnaireOpResult,
  QuestionnairePageResult,
  QuestionnaireQueryListResult,
  QuestionnaireQuestionDeleteResult,
  QuestionnaireQuestionSaveResult,
  QuestionnaireRecordResult,
  QuestionnaireSaveResult,
  QuestionnaireUploadUrlResult,
} from "./models";

type AnyDict = Record<string, any>;

export const QUESTIONNAIRE_STATUS_DRAFT = 1;
export const QUESTIONNAIRE_STATUS_ONGOING = 2;
export const QUESTIONNAIRE_STATUS_WITHDRAWN = 3;
export const QUESTIONNAIRE_STATUS_FINISHED = 4;
export const QUESTIONNAIRE_STATUS_READY_TO_PUBLISH = 5;

export const QUESTIONNAIRE_SCOPE_INTERNAL = 1;
export const QUESTIONNAIRE_SCOPE_PUBLIC = 2;

export const QUESTIONNAIRE_ANSWER_LIMIT_ONCE = 1;
export const QUESTIONNAIRE_ANSWER_LIMIT_UNLIMITED = -1;

export const QUESTIONNAIRE_QUESTION_TYPES = [
  "radio", "checkbox", "picturesVote", "fillblank", "name", "phone",
  "email", "sex", "age", "date", "dateTime", "address", "multiScore",
  "remark", "picturesUpload", "filesUpload",
];

function codeBody(questionnaireCode: string, operateUserId?: string): AnyDict {
  const body: AnyDict = { questionnaireCode };
  if (operateUserId) body.operateUserId = operateUserId;
  return body;
}

function parsePage(data: AnyDict | null) {
  const d = data || {};
  return {
    page_no: d.pageNo ?? 0,
    page_size: d.pageSize ?? 0,
    pages: d.pages ?? 0,
    total: d.total ?? 0,
    has_more: !!d.hasNextPage,
    items: d.result || [],
  };
}

export async function saveQuestionnaire(
  config: LansengerConfig,
  appToken: string,
  params: {
    title: string;
    account_code: string;
    code?: string;
    welcome_speech?: string;
    bye_speech?: string;
    cover_resource_id?: string;
    resource_ids?: string;
    app_id?: string;
    user_type?: number;
    create_mobile?: string;
    create_user_id?: string;
    user_token?: string;
    fetchFn?: FetchFn;
  },
): Promise<QuestionnaireSaveResult> {
  if (!params.title) return new QuestionnaireSaveResult({ success: false, error: "title is required" });
  if (!params.account_code) return new QuestionnaireSaveResult({ success: false, error: "account_code is required" });

  const url = buildApiUrl(config, "questionnaires", "save", appToken, { userToken: params.user_token });
  const body: AnyDict = { title: params.title, accountCode: params.account_code };
  if (params.code) body.code = params.code;
  if (params.welcome_speech) body.welcomeSpeech = params.welcome_speech;
  if (params.bye_speech) body.byeSpeech = params.bye_speech;
  if (params.cover_resource_id) body.coverResourceId = params.cover_resource_id;
  if (params.resource_ids) body.resourceIds = params.resource_ids;
  if (params.app_id) body.appId = params.app_id;
  if (params.user_type !== undefined) body.userType = params.user_type;
  if (params.create_mobile) body.createMobile = params.create_mobile;
  if (params.create_user_id) body.createUserId = params.create_user_id;

  const [data, httpErr] = await doPost(url, body, params.fetchFn);
  if (httpErr) return new QuestionnaireSaveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireSaveResult({ success: false, error: apiErr });
  return new QuestionnaireSaveResult({ success: true, questionnaire_code: data!.data ?? null, raw_response: data! });
}

export async function saveQuestionnaireQuestions(
  config: LansengerConfig,
  appToken: string,
  questionnaireCode: string,
  questionList: AnyDict[],
  opts: { create_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireQuestionSaveResult> {
  if (!questionnaireCode) return new QuestionnaireQuestionSaveResult({ success: false, error: "questionnaire_code is required" });
  if (!questionList || questionList.length === 0)
    return new QuestionnaireQuestionSaveResult({ success: false, error: "question_list is required" });

  const url = buildApiUrl(config, "questionnaires", "questions_save", appToken, { userToken: opts.user_token });
  const body: AnyDict = { questionnaireCode, questionList };
  if (opts.create_user_id) body.createUserId = opts.create_user_id;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireQuestionSaveResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireQuestionSaveResult({ success: false, error: apiErr });
  return new QuestionnaireQuestionSaveResult({ success: true, saved_count: data!.data ?? 0, raw_response: data! });
}

export async function deleteQuestionnaireQuestion(
  config: LansengerConfig,
  appToken: string,
  questionCode: string,
  opts: { create_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireQuestionDeleteResult> {
  if (!questionCode) return new QuestionnaireQuestionDeleteResult({ success: false, error: "question_code is required" });

  const url = buildApiUrl(config, "questionnaires", "question_delete", appToken, { userToken: opts.user_token });
  const body: AnyDict = { questionCode };
  if (opts.create_user_id) body.createUserId = opts.create_user_id;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireQuestionDeleteResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireQuestionDeleteResult({ success: false, error: apiErr });
  return new QuestionnaireQuestionDeleteResult({ success: true, deleted: !!data!.data, raw_response: data! });
}

export async function publishQuestionnaire(
  config: LansengerConfig,
  appToken: string,
  questionnaireCode: string,
  opts: {
    scope_type?: number;
    staff_ids?: string[];
    phones?: string[];
    answer_limit?: number;
    message_flag?: number;
    page_flag?: number;
    share_flag?: number;
    view_stats_flag?: number;
    anonym_flag?: number;
    publish_user_id?: string;
    user_token?: string;
    fetchFn?: FetchFn;
  } = {},
): Promise<QuestionnaireOpResult> {
  if (!questionnaireCode) return new QuestionnaireOpResult({ success: false, error: "questionnaire_code is required" });
  const scopeType = opts.scope_type ?? QUESTIONNAIRE_SCOPE_INTERNAL;
  const answerLimit = opts.answer_limit ?? QUESTIONNAIRE_ANSWER_LIMIT_ONCE;
  if (scopeType !== QUESTIONNAIRE_SCOPE_INTERNAL && scopeType !== QUESTIONNAIRE_SCOPE_PUBLIC)
    return new QuestionnaireOpResult({ success: false, error: "scope_type must be 1 (internal) or 2 (public)" });
  if (answerLimit !== QUESTIONNAIRE_ANSWER_LIMIT_ONCE && answerLimit !== QUESTIONNAIRE_ANSWER_LIMIT_UNLIMITED)
    return new QuestionnaireOpResult({ success: false, error: "answer_limit must be 1 (once) or -1 (unlimited)" });

  const url = buildApiUrl(config, "questionnaires", "publish", appToken, { userToken: opts.user_token });
  const body: AnyDict = {
    questionnaireCode,
    scopeType,
    answerLimit,
    messageFlag: opts.message_flag ?? 0,
    pageFlag: opts.page_flag ?? 0,
    shareFlag: opts.share_flag ?? 0,
    viewStatsFlag: opts.view_stats_flag ?? 1,
    anonymFlag: opts.anonym_flag ?? 0,
  };
  if (opts.staff_ids) body.staffIdList = opts.staff_ids;
  if (opts.phones) body.phoneList = opts.phones;
  if (opts.publish_user_id) body.publishUserId = opts.publish_user_id;

  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireOpResult({ success: false, error: apiErr });
  return new QuestionnaireOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

export async function withdrawQuestionnaire(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireOpResult> {
  if (!questionnaireCode) return new QuestionnaireOpResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "withdraw", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireOpResult({ success: false, error: apiErr });
  return new QuestionnaireOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

export async function finishQuestionnaire(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireOpResult> {
  if (!questionnaireCode) return new QuestionnaireOpResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "finish", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireOpResult({ success: false, error: apiErr });
  return new QuestionnaireOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

export async function deleteQuestionnaire(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireOpResult> {
  if (!questionnaireCode) return new QuestionnaireOpResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "delete", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireOpResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireOpResult({ success: false, error: apiErr });
  return new QuestionnaireOpResult({ success: true, done: !!data!.data, raw_response: data! });
}

function parseDetail(d: AnyDict): Record<string, any> {
  return {
    questionnaire_id: d.id ?? null,
    code: d.code ?? null,
    title: d.title ?? null,
    status: d.status ?? null,
    account_type: d.accountType ?? null,
    account_code: d.accountCode ?? null,
    answer_user_count: d.answerUserCount ?? null,
    answer_user_times: d.answerUserTimes ?? null,
    question_count: d.questionCount ?? null,
    questions: d.questionList ?? null,
    publish_time: d.publishTime ?? null,
    publish_user_name: d.publishUserName ?? null,
    create_user_name: d.createUserName ?? null,
    create_time: d.createTime ?? null,
  };
}

export async function fetchQuestionnaireDetail(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireDetailResult> {
  if (!questionnaireCode) return new QuestionnaireDetailResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "detail", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireDetailResult({ success: false, error: apiErr });
  return new QuestionnaireDetailResult({ success: true, raw_response: data!, ...parseDetail(data!.data || {}) });
}

export async function fetchQuestionnaireBrief(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireDetailResult> {
  if (!questionnaireCode) return new QuestionnaireDetailResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "detail_no_auth", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, { questionnaireCode }, opts.fetchFn);
  if (httpErr) return new QuestionnaireDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireDetailResult({ success: false, error: apiErr });
  return new QuestionnaireDetailResult({ success: true, raw_response: data!, ...parseDetail(data!.data || {}) });
}

export async function fetchQuestionnaireAnswerUrl(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireAnswerUrlResult> {
  if (!questionnaireCode) return new QuestionnaireAnswerUrlResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "answer_url", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireAnswerUrlResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireAnswerUrlResult({ success: false, error: apiErr });
  return new QuestionnaireAnswerUrlResult({ success: true, url: data!.data ?? null, raw_response: data! });
}

export async function copyQuestionnaire(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { operate_user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireCopyResult> {
  if (!questionnaireCode) return new QuestionnaireCopyResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "copy", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, codeBody(questionnaireCode, opts.operate_user_id), opts.fetchFn);
  if (httpErr) return new QuestionnaireCopyResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireCopyResult({ success: false, error: apiErr });
  return new QuestionnaireCopyResult({ success: true, new_code: data!.data ?? null, raw_response: data! });
}

export async function fetchQuestionnairesByCodes(
  config: LansengerConfig, appToken: string, codeList: string[],
  opts: { include_deleted?: number; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireQueryListResult> {
  if (!codeList || codeList.length === 0)
    return new QuestionnaireQueryListResult({ success: false, error: "code_list is required" });
  const url = buildApiUrl(config, "questionnaires", "query_list", appToken, { userToken: opts.user_token });
  const body: AnyDict = { codeList, includeDel: opts.include_deleted ?? 0 };
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireQueryListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireQueryListResult({ success: false, error: apiErr });
  const items = data!.data || [];
  return new QuestionnaireQueryListResult({ success: true, total: items.length, items, raw_response: data! });
}

export async function fetchQuestionnaireOfficeAccounts(
  config: LansengerConfig, appToken: string,
  opts: { user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireAccountListResult> {
  const url = buildApiUrl(config, "questionnaires", "user_accounts", appToken, { userToken: opts.user_token });
  const body: AnyDict = {};
  if (opts.user_id) body.userId = opts.user_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireAccountListResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireAccountListResult({ success: false, error: apiErr });
  const accounts = data!.data || [];
  return new QuestionnaireAccountListResult({ success: true, total: accounts.length, accounts, raw_response: data! });
}

interface PagedOpts { page_no?: number; page_size?: number; user_id?: string; user_token?: string; fetchFn?: FetchFn }

function buildPageBody(opts: PagedOpts, extra: AnyDict = {}): AnyDict {
  const body: AnyDict = { pageNo: opts.page_no ?? 1, pageSize: opts.page_size ?? 10, ...extra };
  if (opts.user_id) body.userId = opts.user_id;
  return body;
}

export async function fetchCreatedQuestionnaires(
  config: LansengerConfig, appToken: string, accountCode: string, opts: PagedOpts & { status?: number } = {},
): Promise<QuestionnairePageResult> {
  if (!accountCode) return new QuestionnairePageResult({ success: false, error: "account_code is required" });
  const url = buildApiUrl(config, "questionnaires", "create_list", appToken, { userToken: opts.user_token });
  const extra: AnyDict = { accountCode };
  if (opts.status !== undefined) extra.status = opts.status;
  const [data, httpErr] = await doPost(url, buildPageBody(opts, extra), opts.fetchFn);
  if (httpErr) return new QuestionnairePageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnairePageResult({ success: false, error: apiErr });
  return new QuestionnairePageResult({ success: true, raw_response: data!, ...parsePage(data!.data || {}) });
}

export async function fetchMyCreatedQuestionnaires(
  config: LansengerConfig, appToken: string, orgId: string, opts: PagedOpts & { title?: string; status?: number } = {},
): Promise<QuestionnairePageResult> {
  if (!orgId) return new QuestionnairePageResult({ success: false, error: "org_id is required" });
  const url = buildApiUrl(config, "questionnaires", "my_create_list", appToken, { userToken: opts.user_token });
  const extra: AnyDict = { orgId };
  if (opts.title) extra.title = opts.title;
  if (opts.status !== undefined) extra.status = opts.status;
  const [data, httpErr] = await doPost(url, buildPageBody(opts, extra), opts.fetchFn);
  if (httpErr) return new QuestionnairePageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnairePageResult({ success: false, error: apiErr });
  return new QuestionnairePageResult({ success: true, raw_response: data!, ...parsePage(data!.data || {}) });
}

export async function fetchParticipatedQuestionnaires(
  config: LansengerConfig, appToken: string, orgId: string, opts: PagedOpts & { status?: number } = {},
): Promise<QuestionnairePageResult> {
  if (!orgId) return new QuestionnairePageResult({ success: false, error: "org_id is required" });
  const url = buildApiUrl(config, "questionnaires", "participation_list", appToken, { userToken: opts.user_token });
  const extra: AnyDict = { orgId };
  if (opts.status !== undefined) extra.status = opts.status;
  const [data, httpErr] = await doPost(url, buildPageBody(opts, extra), opts.fetchFn);
  if (httpErr) return new QuestionnairePageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnairePageResult({ success: false, error: apiErr });
  return new QuestionnairePageResult({ success: true, raw_response: data!, ...parsePage(data!.data || {}) });
}

export async function fetchAnswerRecords(
  config: LansengerConfig, appToken: string, accountCode: string, questionnaireCode: string, opts: PagedOpts = {},
): Promise<QuestionnairePageResult> {
  if (!accountCode) return new QuestionnairePageResult({ success: false, error: "account_code is required" });
  if (!questionnaireCode) return new QuestionnairePageResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "answer_list", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, buildPageBody(opts, { accountCode, questionnaireCode }), opts.fetchFn);
  if (httpErr) return new QuestionnairePageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnairePageResult({ success: false, error: apiErr });
  return new QuestionnairePageResult({ success: true, raw_response: data!, ...parsePage(data!.data || {}) });
}

function parseAnswerDetail(d: AnyDict, fallbackCode: string | null): Record<string, any> {
  return {
    answer_code: d.code ?? fallbackCode,
    answer_user_id: d.answerUserId ?? null,
    answer_user_name: d.answerUserName ?? null,
    answer_status: d.answerStatus ?? null,
    answer_type: d.answerType ?? null,
    answer_use_time: d.answerUseTime ?? null,
    answer_question_count: d.answerQuestionCount ?? null,
    answer_commit_time: d.answerCommitTime ?? null,
    questionnaire: d.questionnaire ?? null,
    questions: d.questionList ?? null,
    answers: d.answerMap ?? null,
  };
}

export async function fetchQuestionnaireAnswerDetail(
  config: LansengerConfig, appToken: string, accountCode: string, answerCode: string,
  opts: { user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireAnswerDetailResult> {
  if (!accountCode) return new QuestionnaireAnswerDetailResult({ success: false, error: "account_code is required" });
  if (!answerCode) return new QuestionnaireAnswerDetailResult({ success: false, error: "answer_code is required" });
  const url = buildApiUrl(config, "questionnaires", "answer_detail", appToken, { userToken: opts.user_token });
  const body: AnyDict = { accountCode, answerCode };
  if (opts.user_id) body.userId = opts.user_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireAnswerDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireAnswerDetailResult({ success: false, error: apiErr });
  return new QuestionnaireAnswerDetailResult({ success: true, raw_response: data!, ...parseAnswerDetail(data!.data || {}, answerCode) });
}

export async function fetchQuestionnaireLastAnswerDetail(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { answer_record_code?: string; user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireAnswerDetailResult> {
  if (!questionnaireCode) return new QuestionnaireAnswerDetailResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "last_answer_detail", appToken, { userToken: opts.user_token });
  const body: AnyDict = { questionnaireCode };
  if (opts.answer_record_code) body.answerRecordCode = opts.answer_record_code;
  if (opts.user_id) body.userId = opts.user_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireAnswerDetailResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireAnswerDetailResult({ success: false, error: apiErr });
  return new QuestionnaireAnswerDetailResult({ success: true, raw_response: data!, ...parseAnswerDetail(data!.data || {}, null) });
}

export async function fetchAnswerData(
  config: LansengerConfig, appToken: string, accountCode: string, questionnaireCode: string, opts: PagedOpts = {},
): Promise<QuestionnairePageResult> {
  if (!accountCode) return new QuestionnairePageResult({ success: false, error: "account_code is required" });
  if (!questionnaireCode) return new QuestionnairePageResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "answer_data", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, buildPageBody(opts, { accountCode, questionnaireCode }), opts.fetchFn);
  if (httpErr) return new QuestionnairePageResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnairePageResult({ success: false, error: apiErr });
  return new QuestionnairePageResult({ success: true, raw_response: data!, ...parsePage(data!.data || {}) });
}

export async function fetchQuestionnaireLastAnswerRecord(
  config: LansengerConfig, appToken: string, questionnaireCode: string,
  opts: { answer_record_code?: string; user_id?: string; user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireRecordResult> {
  if (!questionnaireCode) return new QuestionnaireRecordResult({ success: false, error: "questionnaire_code is required" });
  const url = buildApiUrl(config, "questionnaires", "last_answer_record", appToken, { userToken: opts.user_token });
  const body: AnyDict = { questionnaireCode };
  if (opts.answer_record_code) body.answerRecordCode = opts.answer_record_code;
  if (opts.user_id) body.userId = opts.user_id;
  const [data, httpErr] = await doPost(url, body, opts.fetchFn);
  if (httpErr) return new QuestionnaireRecordResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireRecordResult({ success: false, error: apiErr });
  const d = data!.data || {};
  return new QuestionnaireRecordResult({
    success: true,
    record_id: d.id ?? null,
    record_code: d.code ?? null,
    answer_user_id: d.answerUserId ?? null,
    answer_user_name: d.answerUserName ?? null,
    answer_status: d.answerStatus ?? null,
    answer_type: d.answerType ?? null,
    answer_use_time: d.answerUseTime ?? null,
    answer_question_count: d.answerQuestionCount ?? null,
    answer_commit_time: d.answerCommitTime ?? null,
    stats_status: d.statsStatus ?? null,
    raw_response: data!,
  });
}

export async function fetchQuestionnaireUploadUrl(
  config: LansengerConfig, appToken: string, fileName: string, md5: string, size: number,
  opts: { user_token?: string; fetchFn?: FetchFn } = {},
): Promise<QuestionnaireUploadUrlResult> {
  if (!fileName) return new QuestionnaireUploadUrlResult({ success: false, error: "file_name is required" });
  if (!md5) return new QuestionnaireUploadUrlResult({ success: false, error: "md5 is required" });
  if (!size) return new QuestionnaireUploadUrlResult({ success: false, error: "size is required" });
  const url = buildApiUrl(config, "questionnaires", "upload_url", appToken, { userToken: opts.user_token });
  const [data, httpErr] = await doPost(url, { fileName, md5, size }, opts.fetchFn);
  if (httpErr) return new QuestionnaireUploadUrlResult({ success: false, error: httpErr });
  const [ok, apiErr] = parseApiResponse(data!);
  if (!ok) return new QuestionnaireUploadUrlResult({ success: false, error: apiErr });
  return new QuestionnaireUploadUrlResult({ success: true, url: data!.data ?? null, raw_response: data! });
}
