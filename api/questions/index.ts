import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../router';
import { sessionStore as inMemorySessionStore } from '../quizzes/sessionStore';
import * as quizStore from '../quizzes/quizStore';
import ddbClient from '../dbTableClient';
import { ScanCommand, GetCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import questions from './questionsData';

type Question = any;

let dbQuestionsCache: Question[] | null = null;

async function loadQuestionsFromDB(): Promise<Question[]> {
  const ddbTable = process.env.QUESTIONS_TABLE || process.env.DDB_TABLE || 'QuestionBank';
  if (!ddbClient || !ddbTable) return questions as any[];
  if (dbQuestionsCache) return dbQuestionsCache;
  try {
    const res = await ddbClient.send(new ScanCommand({ TableName: ddbTable } as any));
    const items = res.Items || [];
    dbQuestionsCache = items as any[];
    return dbQuestionsCache;
  } catch (err) {
    console.warn('Failed to load questions from DB', String(err));
    dbQuestionsCache = questions as any[];
    return dbQuestionsCache;
  }
}

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const qs = (event.queryStringParameters || {}) as Record<string, string>;
  // If a `session` query param is present, treat this as a session-scoped request
  // and route to the session question handler which returns a single question.
  if (qs.session) {
    return getSessionQuestion(event);
  }
  const index = qs.index ? Number(qs.index) : undefined;
  const count = qs.count ? Math.min(50, Math.max(1, Number(qs.count))) : undefined;
  const random = qs.random === 'true' || false;

  const allQuestions = await loadQuestionsFromDB();
  if (typeof index === 'number' && !isNaN(index)) {
    const q = allQuestions[index % allQuestions.length];
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) };
  }

  let pool = [...allQuestions];
  if (random) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  if (count) pool = pool.slice(0, count);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pool) };
};

// minimal seed endpoint
export const seedQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, note: 'seed endpoint moved; implement if needed' }) };
};

register('GET', '/api/questions', listQuestions);
register('POST', '/api/questions/seed', seedQuestions);

// --- Session-based handlers (previously in api/quiz.ts) ---
function shuffleArray<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const startSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { count = 15, allocation, quizId, sessionId } = body as { count?: number; allocation?: Record<string, number>; quizId?: string; sessionId?: string };
    const all = await loadQuestionsFromDB();

    let selected: Question[] = [];
    if (allocation && Object.keys(allocation).length > 0) {
      const byPk = new Map<string, Question[]>();
      for (const q of all) {
        const key = q.pk ?? 'Unknown';
        if (!byPk.has(key)) byPk.set(key, []);
        byPk.get(key)!.push(q);
      }

      const total = Number(count) || 15;
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

      for (const [pk, cnt] of Object.entries(pkCounts)) {
        const poolForPk = byPk.get(pk) || [];
        const pick = shuffleArray(poolForPk).slice(0, Math.min(cnt, poolForPk.length));
        selected.push(...pick);
      }

      if (selected.length < total) {
        const remainingPool = all.filter((q) => !selected.some((s) => s.id === q.id));
        selected.push(...shuffleArray(remainingPool).slice(0, total - selected.length));
      }
      selected = shuffleArray(selected).slice(0, Math.min(total, selected.length));
    } else {
      const pool = shuffleArray(all).slice(0, Math.min(count, all.length));
      selected = pool;
    }

    const pool = selected;
    const ids = pool.map((q) => q.id);
    const optionOrders = pool.map((q) => shuffleArray(q.options.map((_: any, i: number) => i)));
    const runtimeId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: any = { id: runtimeId, ids, optionOrders, answers: new Array(ids.length).fill(-1), allocation };
    inMemorySessionStore.set(runtimeId, sess);

    if (quizId) {
      try {
        if (sessionId) {
          await quizStore.saveQuizRecord(quizId, { sessionId: sessionId, allocation: sess.allocation || {} });
        } else {
          const existing = await quizStore.getQuizRecord(quizId).catch(() => null);
          if (existing && existing.sessionId) {
          } else {
            await quizStore.saveQuizRecord(quizId, { allocation: sess.allocation || {} });
          }
        }
      } catch (e) {
        console.warn('Failed to attach session to quiz', quizId, e);
      }
    }

    const first = await (async () => {
      const q = await loadQuestionsFromDB();
      return q.find((x) => x.id === ids[0]) || q[0];
    })();
    if (!first) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load first question' }) };
    const order = optionOrders[0];
    const clientOptions = order.map((oi: any) => (first as any).options[oi]);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, index: 0, question: { id: first.id, text: first.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const runtimeId = qs.session;
    const index = qs.index ? Number(qs.index) : 0;
    if (!runtimeId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const sess = inMemorySessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid index' }) };
    const qid = sess.ids[index];
    const q = (await loadQuestionsFromDB()).find((x) => x.id === qid) as any;
    if (!q) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load question' }) };
    const order = sess.optionOrders[index];
    const clientOptions = order.map((oi: number) => (q as any).options[oi]);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, index, question: { id: q.id, text: q.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const validateAnswer = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, index, selectedIndex } = body as { sessionId?: string; index?: number; selectedIndex?: number };
    if (!sessionId || typeof index !== 'number' || typeof selectedIndex !== 'number') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId, index and selectedIndex are required' }) };
    }
    const sess = inMemorySessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid index' }) };
    const qid = sess.ids[index];
    const q = (await loadQuestionsFromDB()).find((x) => x.id === qid) as any;
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };
    const order = sess.optionOrders[index];
    const mapped = order[selectedIndex];
    const correct = q.answerIndex === mapped;
    sess.answers[index] = correct ? 1 : 0;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correct }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionSummary = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const runtimeId = qs.session;
    if (!runtimeId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const sess = inMemorySessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    const stats: Record<string, { total: number; correct: number; wrong: number; unanswered: number }> = {};
    for (let i = 0; i < sess.ids.length; i++) {
      const qid = sess.ids[i];
      const q = (await loadQuestionsFromDB()).find((x) => x.id === qid) as any;
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

register('POST', '/api/questions/start', startSession);
register('POST', '/api/questions/answer', validateAnswer);
register('GET', '/api/questions/summary', getSessionSummary);

// no default export — module registers routes on import

export default {};
