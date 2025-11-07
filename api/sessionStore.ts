import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Table selection: prefer SESSIONS_TABLE, fall back to QUESTIONS_TABLE
const sessionsTable = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || 'SessionDb';
const tableName = sessionsTable;

let ddbDocClient: DynamoDBDocumentClient | null = null;
if (tableName) {
  const client = new DynamoDBClient({});
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

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

export async function allocCounter(counterName = 'ATTEMPT'): Promise<number> {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const sessionId = 'COUNTERS_' + counterName;
  const res = await ddbDocClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { sessionId },
    UpdateExpression: 'SET #v = if_not_exists(#v, :zero) + :inc',
    ExpressionAttributeNames: { '#v': 'v' },
    ExpressionAttributeValues: { ':inc': 1, ':zero': 0 },
    ReturnValues: 'UPDATED_NEW',
  } as any));
  const val = res.Attributes?.v as number | undefined;
  return typeof val === 'number' ? val : Number(val);
}

export function formatAttemptId(n: number) {
  const base = n.toString(36).toUpperCase();
  const padded = base.padStart(4, '0');
  return `FL-${padded}`;
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
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const p = payload as DBSessionEntry;
  const item: any = { sessionId: String(p.sessionId) };
  if (p && p.userName) item.userName = p.userName;
  if (p && p.createdAt) item.createdAt = p.createdAt;
  await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item } as any));
}

export async function getSessionEntry(sessionId: string) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  // Read by sessionId (SessionDb minimal schema)
  const res = await ddbDocClient.send(new GetCommand({ TableName: tableName, Key: { sessionId } } as any));
  return res.Item;
}

export async function saveAttemptRecord(attemptId: string, payload: any) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const item = { pk: `ATTEMPT#${attemptId}`, sk: 'META', attemptId, ...payload };
  await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item } as any));
}

export async function createAttemptForSession(sessionId: string, metadata?: Record<string, any>) {
  const sess = sessionStore.get(sessionId);
  if (!sess) throw new Error('session not found');
  const n = await allocCounter('ATTEMPT');
  const attemptId = formatAttemptId(n);
  const startedAt = Date.now();
  const payload = { sessionId: sess.id, allocation: sess.allocation || {}, startedAt, metadata };
  await saveAttemptRecord(attemptId, payload);
  return attemptId;
}

export async function getAttemptRecord(attemptId: string) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const res = await ddbDocClient.send(new GetCommand({ TableName: tableName, Key: { pk: `ATTEMPT#${attemptId}`, sk: 'META' } } as any));
  return res.Item;
}

export async function finishAttemptRecord(attemptId: string, answers?: any, summary?: any) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
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
  exprNames['#f'] = 'finishedAt';
  exprValues[':f'] = now;
  setParts.push('#f = :f');
  const updateExpr = 'SET ' + setParts.join(', ');
  await ddbDocClient.send(new UpdateCommand({ TableName: tableName, Key: { pk: `ATTEMPT#${attemptId}`, sk: 'META' }, UpdateExpression: updateExpr, ExpressionAttributeNames: exprNames, ExpressionAttributeValues: exprValues } as any));
}

// Save a quiz result into a dedicated Quiz table. The table is expected to
// have partition key `sessionId` and sort key `quizId`. Other fields such as
// `quizType`, `answers` and `summary` will be stored on the item.
export async function saveQuizResult(sessionId: string, quizId: string, quizType?: string, payload?: Record<string, any>) {
  if (!ddbDocClient) throw new Error('DynamoDB not configured');
  const quizTable = process.env.QUIZ_TABLE || 'QuizDb';
  const item: any = { sessionId: String(sessionId), quizId: String(quizId) };
  if (quizType) item.quizType = quizType;
  if (payload) Object.assign(item, payload);
  await ddbDocClient.send(new PutCommand({ TableName: quizTable, Item: item } as any));
}
