import { createDbTableClient, Tables } from '../dbTableClient';
import type { QuizQuestionEntry } from './quizStore';

// DB session entry (persisted)
export type DBSessionEntry = {
  sessionId: string;
  userName?: string;
  createdAt: number;
};

// Runtime in-memory Session (used while taking a quiz)
export type Session = {
  id: string;
  ids: number[];
  optionOrders: number[][];
  answers: number[]; // -1 unanswered, 1 correct, 0 wrong
  allocation?: Record<string, number>;
};

export const sessionStore = new Map<string, Session>();
const sessionAliasIndex = new Map<string, string>();

export function registerSessionAlias(alias: string, runtimeId: string) {
  if (!alias || !runtimeId) return;
  sessionAliasIndex.set(alias, runtimeId);
}

export function resolveSessionRuntimeId(sessionOrAlias: string) {
  if (!sessionOrAlias) return sessionOrAlias;
  if (sessionStore.has(sessionOrAlias)) return sessionOrAlias;
  return sessionAliasIndex.get(sessionOrAlias) ?? sessionOrAlias;
}

const sessionTableClient = createDbTableClient<Record<string, any>, { sessionId: string }>(Tables.SESSIONS_TABLE);
const quizTableClient = createDbTableClient<Record<string, any>, { quizId: string }>(Tables.QUIZ_TABLE);

export async function allocCounter(counterName = 'ATTEMPT'): Promise<number> {
  const sessionId = 'COUNTERS_' + counterName;
  const res = await sessionTableClient.update(
    { sessionId },
    {
      UpdateExpression: 'SET #v = if_not_exists(#v, :zero) + :inc',
      ExpressionAttributeNames: { '#v': 'v' },
      ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
      ReturnValues: 'UPDATED_NEW',
    }
  );
  const val = res.Attributes?.v as number | undefined;
  return typeof val === 'number' ? val : Number(val);
}

export function formatQuizId(n: number) {
  const base = n.toString(36).toUpperCase();
  const padded = base.padStart(4, '0');
  return `QZ-${padded}`;
}

export async function allocSessionId(): Promise<string> {
  const n = await allocCounter('SESSION');
  return formatSessionId(n);
}

export function formatSessionId(n: number) {
  const base = n.toString(36).toUpperCase();
  const padded = base.padStart(4, '0');
  return `FL-${padded}`;
}

export async function saveSessionEntry(payload: any) {
  const p = payload as DBSessionEntry;
  const item: any = { sessionId: String(p.sessionId) };
  if (p && p.userName) item.userName = p.userName;
  if (p && p.createdAt) item.createdAt = p.createdAt;
  await sessionTableClient.put(item);
}

export async function getSessionEntry(sessionId: string) {
  // Read by sessionId (SessionDb minimal schema)
  return sessionTableClient.get({ sessionId });
}

// Save a quiz record keyed by `quizId`. The item will include `sessionId` when provided
export async function saveQuizRecord(quizId: string, payload: any) {
  const item: any = { quizId: String(quizId) };
  if (payload && payload.sessionId) item.sessionId = String(payload.sessionId);
  if (payload) Object.assign(item, payload);
  await quizTableClient.put(item);
}

export async function createQuizForSession(sessionId: string, metadata?: Record<string, any>) {
  const sess = sessionStore.get(sessionId);
  if (!sess) throw new Error('session not found');
  const n = await allocCounter('QUIZ');
  const quizId = formatQuizId(n);
  const startedAt = Date.now();
  const payload = { sessionId: sess.id, allocation: sess.allocation || {}, startedAt, metadata };
  await saveQuizRecord(quizId, payload);
  return quizId;
}

export async function getQuizRecord(quizId: string) {
  return quizTableClient.get({ quizId });
}

export async function finishQuizRecord(
  quizId: string,
  answers?: any,
  summary?: any,
  questions?: QuizQuestionEntry[]
) {
  const now = Date.now();
  const exprNames: Record<string, string> = {};
  const exprValues: Record<string, any> = {};
  const setParts: string[] = [];
  if (answers !== undefined) {
    exprNames['#a'] = 'answers';
    exprValues[':a'] = answers;
    setParts.push('#a = :a');
  }
  if (summary !== undefined) {
    exprNames['#s'] = 'summary';
    exprValues[':s'] = summary;
    setParts.push('#s = :s');
  }
  if (questions !== undefined) {
    exprNames['#q'] = 'questions';
    exprValues[':q'] = questions;
    setParts.push('#q = :q');
  }
  exprNames['#f'] = 'finishedAt';
  exprValues[':f'] = now;
  setParts.push('#f = :f');
  const updateExpr = 'SET ' + setParts.join(', ');
  await quizTableClient.update(
    { quizId },
    {
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }
  );
}

// Save a quiz result into a dedicated Quiz table. The table is expected to
// have partition key `sessionId` and sort key `quizId`. Other fields such as
// `quizType`, `answers` and `summary` will be stored on the item.
export async function saveQuizResult(quizId: string, sessionId: string | undefined, quizType?: string, payload?: Record<string, any>) {
  const item: any = { quizId: String(quizId) };
  if (sessionId) item.sessionId = String(sessionId);
  if (quizType) item.quizType = quizType;
  if (payload) Object.assign(item, payload);
  await quizTableClient.put(item);
}

// Convenience: write a single quiz result row keyed by `sessionId` and `quizId`.
// This stores answers, summary and any result payload on one item which makes
// querying by sessionId straightforward.
export async function saveQuizResultSingleRow(
  quizId: string,
  sessionId: string,
  quizType?: string,
  answers?: any,
  summary?: any,
  payload?: Record<string, any>
) {
  const item: any = { sessionId: String(sessionId), quizId: String(quizId) };
  if (quizType) item.quizType = quizType;
  if (answers !== undefined) item.answers = answers;
  if (summary !== undefined) item.summary = summary;
  if (payload) Object.assign(item, payload);
  // Use PutCommand to create/replace the single row for this session+quiz.
  await quizTableClient.put(item);
}

// Load All quiz records for a given sessionId
export async function getQuizRecordsForSession(sessionId: string) {
  // Try querying a GSI on sessionId (index name 'sessionId-index'). If the index
  // does not exist (table keyed by quizId), fall back to a Scan and filter by sessionId.
  try {
    return await quizTableClient.query({
      IndexName: 'sessionId-index',
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: { ':sid': sessionId },
    });
  } catch (e) {
    const items = await quizTableClient.scan();
    return items.filter((it: any) => it.sessionId === sessionId);
  }
}