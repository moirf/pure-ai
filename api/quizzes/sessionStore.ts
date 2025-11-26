import { createDbTableClient, Tables } from '../dbTableClient';

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

// (legacy helpers for quiz persistence moved to api/quizzes/quizStore.ts)