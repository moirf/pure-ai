import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';

// Optional DynamoDB support (AWS SDK v3)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { sessionStore as inMemorySessionStore, Session as SessionType, createQuizForSession, getQuizRecord, finishQuizRecord, saveQuizResult, saveQuizResultSingleRow } from './sessionStore';
import { allocCounter, formatQuizId, saveQuizRecord } from './sessionStore';
import { allocSessionId, formatSessionId, saveSessionEntry, getSessionEntry } from './sessionStore';

interface Question {
  id: number;
  pk: string;
  sk: string;
  text: string;
  options: string[];
  // store answer as numeric index (server-side only)
  answerIndex: number;
  explanation?: string;
  timepresented?: number;
  timeanswered?: number;
  timeunanswered?: number;
  timecorrect?: number;
  timeincorrect?: number;
}

// Expanded sample question bank
import questions from './questionsData';

// Ensure each local question has `pk` and `sk` fields (normalize Category -> pk, id -> sk)
const normalizedQuestions: Question[] = questions.map((q) => {
  const id = typeof (q as any).id === 'number' ? (q as any).id : Number((q as any).id) || 0;
  const pk = (q as any).pk ?? (q as any).Category ?? 'Unknown';
  const sk = (q as any).sk ?? String(id);
  return {
    id,
    pk,
    sk,
    text: (q as any).text ?? '',
    options: Array.isArray((q as any).options) ? (q as any).options : [],
    answerIndex: typeof (q as any).answerIndex === 'number' ? (q as any).answerIndex : 0,
    explanation: (q as any).explanation,
    timepresented: (q as any).timepresented,
    timeanswered: (q as any).timeanswered,
    timeunanswered: (q as any).timeunanswered,
    timecorrect: (q as any).timecorrect,
    timeincorrect: (q as any).timeincorrect,
  } as Question;
});

// Backfill the original `questions` array so every item has explicit `pk` and `sk` fields
for (const q of questions as any[]) {
  if (!q.pk) q.pk = q.Category ?? 'Unknown';
  if (!q.sk) q.sk = String(q.id ?? '');
}

// DynamoDB setup (optional). Read table name from env `QUESTIONS_TABLE` or `DDB_TABLE`.
const ddbTable = process.env.QUESTIONS_TABLE || process.env.DDB_TABLE || 'QuestionBank';
// Optional separate table for sessions/quizzes. If set, counters and quizzes will be stored here.
const sessionsTable = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || '';
let ddbDocClient: DynamoDBDocumentClient | null = null;
if (ddbTable) {
  const client = new DynamoDBClient({});
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

// Simple in-memory cache to avoid scanning DynamoDB on every request
let dbQuestionsCache: Question[] | null = null;

// Use sessionStore helpers from `api/sessionStore.ts`
const sessionStore = inMemorySessionStore;
type Session = SessionType;

async function loadQuestionsFromDB(): Promise<Question[]> {
  if (!ddbDocClient || !ddbTable) return normalizedQuestions;
  if (dbQuestionsCache) return dbQuestionsCache;
  try {
    const res = await ddbDocClient.send(new ScanCommand({ TableName: ddbTable }));
    const items = res.Items || [];
    const mapped: Question[] = items.map((it: any, idx: number) => {
      // Support both numeric and string id representations
      const idVal = it.id ?? it.ID ?? it.pk ?? idx + 1;
      const id = typeof idVal === 'string' ? Number(idVal) : idVal;
      return {
        id,
        pk: it.pk ?? it.Category ?? (it.CategoryName) ?? 'Unknown',
        sk: it.sk ?? String(it.sk ?? id),
        text: it.text || it.question || it.title || '',
        options: Array.isArray(it.options) ? it.options : (it.options_list || it.choices || []),
        answerIndex: typeof it.answerIndex === 'number' ? it.answerIndex : (typeof it.answer === 'number' ? it.answer : 0),
        explanation: it.explanation,
      } as Question;
    });
    dbQuestionsCache = mapped;
    return mapped;
  } catch (err) {
    console.warn('Failed to load questions from DynamoDB, falling back to in-file list', String(err));
    dbQuestionsCache = normalizedQuestions;
    return normalizedQuestions;
  }
}

async function getQuestionById(id: number): Promise<Question | undefined> {
  if (!ddbDocClient || !ddbTable) {
    return normalizedQuestions.find((q) => q.id === id);
  }
  try {
    // Use PK/SK schema: pk = `QUESTION#<id>`, sk = `META`
    const pk = `QUESTION#${id}`;
    const res = await ddbDocClient.send(new GetCommand({ TableName: ddbTable, Key: { pk, sk: 'META' } } as any));
    const it = res.Item;
    if (!it) {
      const all = await loadQuestionsFromDB();
      return all.find((q) => q.id === id);
    }
    const idVal = it.id ?? it.ID ?? it.questionId ?? id;
    const realId = typeof idVal === 'string' ? Number(idVal) : idVal;
    return {
      id: realId,
      pk: it.pk ?? it.Category ?? `QUESTION#${realId}`,
      sk: it.sk ?? String(it.sk ?? realId),
      text: it.text || it.question || it.title || '',
      options: Array.isArray(it.options) ? it.options : (it.options_list || it.choices || []),
      answerIndex: typeof it.answerIndex === 'number' ? it.answerIndex : (typeof it.answer === 'number' ? it.answer : 0),
      explanation: it.explanation,
    } as Question;
  } catch (err) {
    const all = await loadQuestionsFromDB();
    return all.find((q) => q.id === id);
  }
}

function stripAnswer(q: Question) {
  const { answerIndex, explanation, ...rest } = q;
  return rest;
}

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  // Support query params: index=<n> returns single question at index (0-based),
  // count=<m> returns m random questions, random=true returns randomized set
  const qs = (event.queryStringParameters || {}) as Record<string, string>;
  const index = qs.index ? Number(qs.index) : undefined;
  const count = qs.count ? Math.min(50, Math.max(1, Number(qs.count))) : undefined;
  const random = qs.random === 'true' || false;

  const allQuestions = await loadQuestionsFromDB();

  if (typeof index === 'number' && !isNaN(index)) {
    const q = allQuestions[index % allQuestions.length];
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stripAnswer(q)) };
  }

  let pool = [...allQuestions];
  if (random) {
    // simple shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  if (count) {
    pool = pool.slice(0, count);
  }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pool.map(stripAnswer)) };
};

export const validateAnswer = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, index, selectedIndex } = body as { sessionId?: string; index?: number; selectedIndex?: number };
    if (!sessionId || typeof index !== 'number' || typeof selectedIndex !== 'number') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId, index and selectedIndex are required' }) };
    }

    const sess = sessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid index' }) };

    const qid = sess.ids[index];
    const q = await getQuestionById(qid);
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };

    // Map selectedIndex (client-ordered) back to original index
    const order = sess.optionOrders[index];
    const mapped = order[selectedIndex];
    const correct = q.answerIndex === mapped;

    // Optionally record the answer in session
    sess.answers[index] = correct ? 1 : 0;

    // Update question stats in the question table if DynamoDB is configured
    try {
      if (ddbDocClient && ddbTable) {
        const questionPk = q.pk ?? `QUESTION#${q.id}`;
        // increment answeredCount and correctCount/incorrectCount accordingly
        const exprNames: any = { '#a': 'answeredCount' };
        const exprValues: any = { ':inc': 1 };
        let updateExpr = 'SET #a = if_not_exists(#a, :zero) + :inc';
        exprValues[':zero'] = 0;
        if (correct) {
          exprNames['#c'] = 'correctCount';
          exprValues[':incC'] = 1;
          updateExpr += ', #c = if_not_exists(#c, :zero) + :incC';
        } else {
          exprNames['#w'] = 'incorrectCount';
          exprValues[':incW'] = 1;
          updateExpr += ', #w = if_not_exists(#w, :zero) + :incW';
        }
        await ddbDocClient.send(new UpdateCommand({ TableName: ddbTable, Key: { pk: questionPk, sk: q.sk ?? String(q.id) }, UpdateExpression: updateExpr, ExpressionAttributeNames: exprNames, ExpressionAttributeValues: exprValues } as any));
      }
    } catch (e) {
      console.warn('Failed to update question stats', q.id, String(e));
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correct }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Simple in-memory session store (ephemeral)
// sessionStore and Session are provided by `api/sessionStore.ts`

function shuffle<T>(arr: T[]) {
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
    // Require both quizId and sessionId so the server can persist the mapping quizId -> sessionId
    if (!quizId || !sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'quizId and sessionId are required' }) };
    const all = await loadQuestionsFromDB();

    // allocation: either percentages that sum to <=100, or counts. We'll treat values <=100 and sum<=100 as percentages.
    let selected: Question[] = [];
    if (allocation && Object.keys(allocation).length > 0) {
      // group questions by pk
      const byPk = new Map<string, Question[]>();
      for (const q of all) {
        const key = q.pk ?? 'Unknown';
        if (!byPk.has(key)) byPk.set(key, []);
        byPk.get(key)!.push(q);
      }

      const total = Number(count) || 15;
      // determine if allocation values are percentages (sum <= 100) or absolute counts
      const vals = Object.values(allocation);
      const sumVals = vals.reduce((s, v) => s + Number(v), 0);
      const isPercent = sumVals <= 100;
      const pkCounts: Record<string, number> = {};
      if (isPercent) {
        // percentage-based allocation
        for (const [pk, pct] of Object.entries(allocation)) {
          pkCounts[pk] = Math.floor((Number(pct) / 100) * total);
        }
        // adjust for rounding: fill remaining slots from largest buckets
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
        // absolute counts
        for (const [pk, v] of Object.entries(allocation)) pkCounts[pk] = Math.max(0, Math.floor(Number(v)));
      }

      // select per-pk questions
      for (const [pk, cnt] of Object.entries(pkCounts)) {
        const poolForPk = byPk.get(pk) || [];
        const pick = shuffle(poolForPk).slice(0, Math.min(cnt, poolForPk.length));
        selected.push(...pick);
      }

      // if we under-selected (not enough available or allocation small), fill from remaining random pool
      if (selected.length < total) {
        const remainingPool = all.filter((q) => !selected.some((s) => s.id === q.id));
        selected.push(...shuffle(remainingPool).slice(0, total - selected.length));
      }
      // limit to requested count
      selected = shuffle(selected).slice(0, Math.min(total, selected.length));
    } else {
      const pool = shuffle(all).slice(0, Math.min(count, all.length));
      selected = pool;
    }

    const pool = selected;
    const ids = pool.map((q) => q.id);
    const optionOrders = pool.map((q) => shuffle(q.options.map((_, i) => i)));
    // Create a short-lived runtime id (ephemeral) and store the runtime session in-memory
    const runtimeId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: Session = { id: runtimeId, ids, optionOrders, answers: new Array(ids.length).fill(-1), allocation };
    sessionStore.set(runtimeId, sess);

    // If a persistent quizId was provided, attach the runtime session's sessionId to it
    // Persist mapping quizId -> sessionId if a persistent sessionId is provided
    if (quizId) {
      try {
        if (sessionId) {
          await saveQuizRecord(quizId, { sessionId: sessionId, allocation: sess.allocation || {} });
        } else {
          // If no sessionId provided in body, attempt to preserve any existing sessionId on quiz record
          const existing = await getQuizRecord(quizId).catch(() => null);
          if (existing && existing.sessionId) {
            // nothing to do; mapping already exists
          } else {
            // persist without sessionId for now; callers should pass sessionId when available
            await saveQuizRecord(quizId, { allocation: sess.allocation || {} });
          }
        }
      } catch (e) {
        console.warn('Failed to attach session to quiz', quizId, e);
      }
    }

    // return first question with shuffled options
    const first = await getQuestionById(ids[0]);
    if (!first) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load first question' }) };
    }
    const order = optionOrders[0];
    const clientOptions = order.map((oi) => first.options[oi]);

    // Return the ephemeral runtime id for client-side use in subsequent in-quiz calls
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, index: 0, question: { id: first.id, text: first.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    // Here `session` is the ephemeral runtimeId produced by /api/questions/start
    const runtimeId = qs.session;
    const index = qs.index ? Number(qs.index) : 0;
    if (!runtimeId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const sess = sessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid index' }) };

    const qid = sess.ids[index];
    const q = await getQuestionById(qid);
    if (!q) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to load question' }) };
    const order = sess.optionOrders[index];
    const clientOptions = order.map((oi) => q.options[oi]);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runtimeId, index, question: { id: q.id, text: q.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Register route
register('POST', '/api/questions/start', startSession);
register('GET', '/api/questions', getSessionQuestion);
register('POST', '/api/questions/answer', validateAnswer);

export const getSessionSummary = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const runtimeId = qs.session;
    if (!runtimeId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'runtime session required' }) };
    const sess = sessionStore.get(runtimeId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };

    // Build per-pk stats
    const stats: Record<string, { total: number; correct: number; wrong: number; unanswered: number }> = {};
    for (let i = 0; i < sess.ids.length; i++) {
      const qid = sess.ids[i];
      const q = await getQuestionById(qid);
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

register('GET', '/api/questions/summary', getSessionSummary);

export const createQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, metadata } = body as { sessionId?: string; metadata?: Record<string, any> };
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId required' }) };

    // Allocate a quizId and persist a quiz record linked to the provided persistent sessionId.
    const n = await allocCounter('ATTEMPT');
    const quizId = formatQuizId(n);
    const startedAt = Date.now();
    const payload = { sessionId: sessionId, allocation: {}, startedAt, metadata };
    await saveQuizRecord(quizId, payload);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId, ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/questions/quiz', createQuiz);

export const allocateQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Optional metadata in body
    const body = event.body ? JSON.parse(event.body) : {};
    const { metadata } = body as { metadata?: Record<string, any> };
    // Allocate numeric counter and format as FL-XXXX
    const n = await allocCounter('ATTEMPT');
    const quizId = formatQuizId(n);
    const payload = { startedAt: Date.now(), metadata };
    await saveQuizRecord(quizId, payload);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId, ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/questions/quiz/allocate', allocateQuiz);

// Session-related endpoints moved to `api/sessions.ts`

export const getQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const quizId = qs.quizId;
    if (!quizId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'quizId required' }) };
    if (!ddbDocClient || (!ddbTable && !sessionsTable)) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured' }) };
    const item = await getQuizRecord(quizId);
    if (!item) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Quiz not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const finishQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { quizId, answers, summary, quizType } = body as { quizId?: string; answers?: any; summary?: any; quizType?: string };
    if (!quizId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'quizId required' }) };
    if (!ddbDocClient || (!ddbTable && !sessionsTable)) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured' }) };
    // Attempt to write answers + summary as a single row keyed by sessionId + quizId.
    // This simplifies querying by session. If that fails, fall back to the
    // legacy two-step approach (update quiz record + write result row).
    try {
      const quiz = await getQuizRecord(quizId);
      const sessionId = quiz && quiz.sessionId ? String(quiz.sessionId) : undefined;
      if (sessionId) {
        try {
          await saveQuizResultSingleRow(quizId, sessionId, quizType, answers, summary, undefined);
        } catch (err) {
          // fallback
          await finishQuizRecord(quizId, answers, summary);
          try {
            let total = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            if (Array.isArray(answers)) {
              total = answers.length;
              for (const a of answers) {
                if (a === 1) correctCount++;
                else if (a === 0) incorrectCount++;
              }
            }
            const payload: any = { total, correct: correctCount, incorrect: incorrectCount, finishedAt: Date.now() };
            if (summary !== undefined) payload.summary = summary;
            await saveQuizResult(quizId, sessionId, quizType, payload);
          } catch (e) {
            console.warn('Failed to save minimal quiz result after fallback', quizId, String(e));
          }
        }
      } else {
        // No sessionId available: fall back to updating the quiz record only
        await finishQuizRecord(quizId, answers, summary);
      }
    } catch (err) {
      console.warn('Failed to finalize quiz result', quizId, String(err));
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('GET', '/api/questions/quiz', getQuiz);
register('POST', '/api/questions/quiz/finish', finishQuiz);

// Seed endpoint: writes the in-file `questions` array into DynamoDB when called.
// Protection: Either set ALLOW_DB_SEED=true in the environment (convenient but unsafe),
// or set SEED_SECRET and provide it in the request body as { secret: '...' }.
export const seedQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Basic protection
    const allow = process.env.ALLOW_DB_SEED === 'true';
    const expected = process.env.SEED_SECRET;
    let ok = allow;
    const body = event.body ? JSON.parse(event.body) : {};
    if (!ok && expected) {
      ok = body && body.secret === expected;
    }
    if (!ok) {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Seeding not allowed. Set ALLOW_DB_SEED=true or provide SEED_SECRET.' }) };
    }

    if (!ddbDocClient || !ddbTable) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured. Set QUESTIONS_TABLE env var.' }) };
    }

    // Deduplicate normalized local questions by id
    const byId = new Map<number, Question>();
    for (const q of normalizedQuestions) byId.set(q.id, q);
    const items = Array.from(byId.values());

    // Scan existing question PKs to avoid writing duplicates
    const existingIds = new Set<number>();
    try {
      const scanRes = await ddbDocClient.send(new ScanCommand({ TableName: ddbTable, ProjectionExpression: 'pk, id' } as any));
      const its = scanRes.Items || [];
      for (const it of its) {
        const pk = it.pk as string | undefined;
        if (pk && pk.startsWith('QUESTION#')) {
          const idPart = pk.split('#')[1];
          const n = Number(idPart);
          if (!isNaN(n)) existingIds.add(n);
        } else if (it.id) {
          const n = typeof it.id === 'string' ? Number(it.id) : it.id;
          if (!isNaN(n)) existingIds.add(n);
        }
      }
    } catch (err) {
      console.warn('Seed: failed to scan table for existing ids', String(err));
    }

    const toWrite = items.filter((q) => !existingIds.has(q.id));

    // Prepare BatchWrite with PK/SK schema, 25 items per batch
    const batches: any[] = [];
    for (let i = 0; i < toWrite.length; i += 25) batches.push(toWrite.slice(i, i + 25));

    let totalWritten = 0;
    for (const batch of batches) {
      const putRequests = batch.map((item: Question) => ({ PutRequest: { Item: { pk: item.pk ?? `QUESTION#${item.id}`, sk: item.sk ?? String(item.id), id: item.id, text: item.text, options: item.options, answerIndex: item.answerIndex, explanation: item.explanation } } }));
      let params = { RequestItems: { [ddbTable]: putRequests } };
      let resp = await ddbDocClient.send(new BatchWriteCommand(params));
      let tries = 0;
      while (resp && resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length > 0 && tries < 5) {
        await new Promise((r) => setTimeout(r, 500 * (tries + 1)));
        resp = await ddbDocClient.send(new BatchWriteCommand({ RequestItems: resp.UnprocessedItems }));
        tries++;
      }
      if (resp && resp.UnprocessedItems && Object.keys(resp.UnprocessedItems).length > 0) {
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Some items were not processed', details: resp.UnprocessedItems }) };
      }
      totalWritten += batch.length;
    }

    dbQuestionsCache = null;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, written: totalWritten, skipped: items.length - toWrite.length }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/questions/seed', seedQuestions);
