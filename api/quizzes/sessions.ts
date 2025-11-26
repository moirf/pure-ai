import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../router';
import { createDbTableClient, Tables } from '../dbTableClient';
import { loadQuestions, QuestionRecord } from '../questions/questionStore';
import {
  allocSessionId,
  saveSessionEntry,
  getSessionEntry,
  sessionStore as inMemorySessionStore,
  registerSessionAlias,
  resolveSessionRuntimeId,
} from './sessionStore';
import * as quizStore from './quizStore';
import type { QuizDbRecord, QuizQuestionEntry } from './quizStore';

const sessionTableClient = createDbTableClient<Record<string, any>, { sessionId: string }>(Tables.SESSIONS_TABLE);

function shuffleArray<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildClientQuestion(question: QuestionRecord, optionOrder: number[]) {
  const options = optionOrder.map((idx) => question.options[idx]);
  return { id: questionIdentifier(question), text: question.text, options, optionOrder };
}

export interface PreparedQuestionSet {
  selected: QuestionRecord[];
  ids: string[];
  questionStatus: QuizQuestionEntry[];
}

function questionIdentifier(question: QuestionRecord): string {
  return String(question.id ?? question.sk ?? question.pk);
}

function selectQuestionsByAllocation(all: QuestionRecord[], total: number, allocation?: Record<string, number>) {
  if (allocation && Object.keys(allocation).length > 0) {
    const byPk = new Map<string, QuestionRecord[]>();
    for (const q of all) {
      const key = q.pk ?? 'Unknown';
      if (!byPk.has(key)) byPk.set(key, []);
      byPk.get(key)!.push(q);
    }

    const vals = Object.values(allocation);
    const sumVals = vals.reduce((s, v) => s + Number(v), 0);
    const isPercent = sumVals <= 100;
    const pkCounts: Record<string, number> = {};
    if (isPercent) {
      for (const [pk, pct] of Object.entries(allocation)) {
        pkCounts[pk] = Math.floor((Number(pct) / 100) * total);
      }
      let assigned = Object.values(pkCounts).reduce((s, v) => s + v, 0);
      const remaining = total - assigned;
      if (remaining > 0) {
        const pks = Object.keys(allocation);
        for (let i = 0; i < remaining; i++) {
          const pick = pks[i % pks.length];
          pkCounts[pick] = (pkCounts[pick] || 0) + 1;
        }
      }
    } else {
      for (const [pk, v] of Object.entries(allocation)) pkCounts[pk] = Math.max(0, Math.floor(Number(v)));
    }

    const selected: QuestionRecord[] = [];
    for (const [pk, cnt] of Object.entries(pkCounts)) {
      const poolForPk = byPk.get(pk) || [];
      const pick = shuffleArray(poolForPk).slice(0, Math.min(cnt, poolForPk.length));
      selected.push(...pick);
    }

    if (selected.length < total) {
      const selectedIds = new Set(selected.map((q) => questionIdentifier(q)));
      const remainingPool = all.filter((q) => !selectedIds.has(questionIdentifier(q)));
      selected.push(...shuffleArray(remainingPool).slice(0, total - selected.length));
    }
    return shuffleArray(selected).slice(0, Math.min(total, selected.length));
  }

  return shuffleArray(all).slice(0, Math.min(total, all.length));
}

export async function prepareQuestionSet(params: {
  count: number;
  allocation?: Record<string, number>;
  questionIds?: string[];
  questionStatus?: QuizQuestionEntry[] | null;
}): Promise<PreparedQuestionSet> {
  const { count, allocation, questionIds, questionStatus } = params;
  const all = await loadQuestions();
  const target = Math.max(1, Math.min(Number(count) || all.length, all.length));

  let selected: QuestionRecord[] | null = null;
  if (questionIds && questionIds.length) {
    const byId = new Map<string, QuestionRecord>();
    for (const q of all) byId.set(questionIdentifier(q), q);
    const mapped = questionIds
      .map((id) => byId.get(String(id)))
      .filter((q): q is QuestionRecord => Boolean(q));
    if (mapped.length === questionIds.length) {
      selected = mapped.slice(0, Math.min(mapped.length, target));
    } else {
      console.warn('prepareQuestionSet: stored question ids missing, regenerating allocation');
    }
  }

  if (!selected) {
    selected = selectQuestionsByAllocation(all, target, allocation);
  }

  const ids = selected.map(questionIdentifier);
  const statusMap = new Map<string, QuizQuestionEntry>();
  if (Array.isArray(questionStatus)) {
    for (const entry of questionStatus) {
      if (!entry || entry.questionId === undefined) continue;
      statusMap.set(String(entry.questionId), entry);
    }
  }

  const normalizedStatus = ids.map((questionId, idx) => {
    const existing = statusMap.get(questionId);
    return {
      sno: idx + 1,
      questionId,
      correct: existing ? existing.correct ?? null : null,
    };
  });

  return { selected, ids, questionStatus: normalizedStatus };
}

export const allocateSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { userName } = body as { userName?: string };
    if (!userName || String(userName).trim().length === 0) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'userName is required' }) };
    }
    const sessionId = await allocSessionId();
    const payload: any = { sessionId: String(sessionId), userName: String(userName), createdAt: Date.now().toString() };
    await saveSessionEntry(payload);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionId = qs.sessionId;
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId required' }) };
    const item = await getSessionEntry(sessionId);
    if (!item) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Session not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionsByUser = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const userName = qs.userName;
    if (!userName) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'userName required' }) };
    const items = await sessionTableClient.scan({
      FilterExpression: 'begins_with(pk, :s) AND #u = :u',
      ExpressionAttributeNames: { '#u': 'userName' },
      ExpressionAttributeValues: { ':s': 'SESSION#', ':u': userName },
    });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionRecords = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionId = qs.sessionId;
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId required' }) };
    const items = await quizStore.getQuizRecordsForSession(sessionId);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const startSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { count = 15, allocation, quizId, sessionId } = body as { count?: number; allocation?: Record<string, number>; quizId?: string; sessionId?: string };
    let existingQuiz: QuizDbRecord | null = null;
    if (quizId) {
      try {
        existingQuiz = await quizStore.getQuizRecord(quizId);
      } catch (lookupErr) {
        console.warn('startSession: failed to load quiz record', quizId, lookupErr);
      }
    }

    const storedQuestionIds = existingQuiz?.questions?.map((q) => q.questionId).filter(Boolean) as string[] | undefined;
    const targetCount = Number(count) || existingQuiz?.totalQuestions || 15;
    const setResult = await prepareQuestionSet({
      count: targetCount,
      allocation,
      questionIds: storedQuestionIds,
      questionStatus: existingQuiz?.questions ?? null,
    });
    const { selected, ids, questionStatus } = setResult;
    if (!selected.length) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to allocate questions for session' }) };
    }
    const optionOrders = selected.map((q) => shuffleArray(q.options.map((_, i) => i)));
    const runtimeId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: any = { id: runtimeId, ids, optionOrders, answers: new Array(ids.length).fill(-1), allocation };
    inMemorySessionStore.set(runtimeId, sess);
    if (sessionId) registerSessionAlias(String(sessionId), runtimeId);

    if (quizId) {
      const quizSnapshot = {
        allocation: sess.allocation || allocation || {},
        questionIds: ids,
        totalQuestions: ids.length,
        questions: questionStatus,
      };
      try {
        if (sessionId) {
          await quizStore.saveQuizRecord(quizId, { sessionId: sessionId, ...quizSnapshot });
        } else {
          const existing = await quizStore.getQuizRecord(quizId).catch(() => null);
          if (!existing || !existing.sessionId) {
            await quizStore.saveQuizRecord(quizId, quizSnapshot);
          }
        }
      } catch (e) {
        console.warn('Failed to attach session to quiz', quizId, e);
      }
    }

    const firstQuestion = selected[0];
    if (!firstQuestion) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load first question' }) };
    }
    const firstOrder = optionOrders[0];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runtimeId, index: 0, question: buildClientQuestion(firstQuestion, firstOrder) })
    };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionToken = qs.session;
    const index = qs.index ? Number(qs.index) : 0;
    if (!sessionToken) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const runtimeId = resolveSessionRuntimeId(sessionToken);
    const sess = inMemorySessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid index' }) };
    const qid = sess.ids[index];
    const all = await loadQuestions();
    const q = all.find((x) => String(x.id ?? x.sk) === String(qid));
    if (!q) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load question' }) };
    const order = sess.optionOrders[index];
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, index, question: buildClientQuestion(q, order) }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionSummary = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionToken = qs.session;
    if (!sessionToken) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const runtimeId = resolveSessionRuntimeId(sessionToken);
    const sess = inMemorySessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    const all = await loadQuestions();
    const stats: Record<string, { total: number; correct: number; wrong: number; unanswered: number }> = {};
    for (let i = 0; i < sess.ids.length; i++) {
      const qid = sess.ids[i];
      const q = all.find((x) => String(x.id ?? x.sk) === String(qid));
      const pk = q?.pk ?? 'Unknown';
      if (!stats[pk]) stats[pk] = { total: 0, correct: 0, wrong: 0, unanswered: 0 };
      stats[pk].total += 1;
      const ans = sess.answers[i];
      if (ans === 1) stats[pk].correct += 1;
      else if (ans === 0) stats[pk].wrong += 1;
      else stats[pk].unanswered += 1;
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, stats, allocation: sess.allocation || {} }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/sessions/allocate', allocateSession);
register('GET', '/api/sessions', getSession);
register('GET', '/api/sessions/by-user', getSessionsByUser);
register('GET', '/api/sessions/records', getSessionRecords);
register('POST', '/api/questions/start', startSession);
register('GET', '/api/questions/summary', getSessionSummary);

export default {};
