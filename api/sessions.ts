import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { allocSessionId, saveSessionEntry, getSessionEntry, sessionStore as inMemorySessionStore } from './sessionStore';

// DynamoDB setup (optional). Read table name from env `SESSIONS_TABLE` or `SESSIONS_DDB_TABLE`.
const sessionsTable = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || '';
let ddbDocClient: DynamoDBDocumentClient | null = null;
if (sessionsTable) {
  const client = new DynamoDBClient({});
  ddbDocClient = DynamoDBDocumentClient.from(client);
}

export const allocateSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { userName } = body as { userName?: string };
    if (!userName || String(userName).trim().length === 0) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'userName is required' }) };
    }
    const sessionId = await allocSessionId();
    const payload: any = { sessionId: String(sessionId), userName: String(userName) };
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
    if (!ddbDocClient && !sessionsTable) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured' }) };
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
    if (!ddbDocClient || !sessionsTable) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured' }) };
    const res = await ddbDocClient.send(new ScanCommand({ TableName: sessionsTable, FilterExpression: 'begins_with(pk, :s) AND #u = :u', ExpressionAttributeNames: { '#u': 'userName' }, ExpressionAttributeValues: { ':s': 'SESSION#', ':u': userName } } as any));
    const items = res.Items || [];
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
    if (!ddbDocClient || !sessionsTable) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'DynamoDB not configured' }) };
    const res = await ddbDocClient.send(new ScanCommand({ TableName: sessionsTable, FilterExpression: '#s = :sid AND begins_with(pk, :a)', ExpressionAttributeNames: { '#s': 'sessionId' }, ExpressionAttributeValues: { ':sid': sessionId, ':a': 'ATTEMPT#' } } as any));
    const items = res.Items || [];
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/sessions/allocate', allocateSession);
register('GET', '/api/sessions', getSession);
register('GET', '/api/sessions/by-user', getSessionsByUser);
register('GET', '/api/sessions/records', getSessionRecords);

export default {};
