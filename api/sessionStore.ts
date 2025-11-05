import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Table selection: prefer SESSIONS_TABLE, fall back to QUESTIONS_TABLE
const ddbTable = process.env.QUESTIONS_TABLE || process.env.DDB_TABLE || 'QuestionBank';
const sessionsTable = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || 'SessionsDb';
const tableName = sessionsTable || ddbTable;

let ddbDocClient: DynamoDBDocumentClient | null = null;
if (tableName) {
  const client = new DynamoDBClient({});
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

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
  const pk = 'COUNTERS';
  const sk = counterName;
  const res = await ddbDocClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { pk, sk },
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

export async function saveSessionEntry(sessionId: string, payload: any) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const item = { pk: `SESSION#${sessionId}`, sk: 'META', sessionId, ...payload };
  await ddbDocClient.send(new PutCommand({ TableName: tableName, Item: item } as any));
}

export async function getSessionEntry(sessionId: string) {
  if (!ddbDocClient || !tableName) throw new Error('DynamoDB not configured');
  const res = await ddbDocClient.send(new GetCommand({ TableName: tableName, Key: { pk: `SESSION#${sessionId}`, sk: 'META' } } as any));
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
