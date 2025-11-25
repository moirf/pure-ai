import { PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import ddbClient, { QUIZ_TABLE } from './dbClient';

export async function saveQuizRecord(quizId: string, payload: any) {
  const item: any = { quizId: String(quizId) };
  if (payload && payload.sessionId) item.sessionId = String(payload.sessionId);
  if (payload) Object.assign(item, payload);
  await ddbClient.send(new PutCommand({ TableName: QUIZ_TABLE, Item: item } as any));
}

export async function getQuizRecord(quizId: string) {
  const res = await ddbClient.send(new GetCommand({ TableName: QUIZ_TABLE, Key: { quizId } } as any));
  return res.Item;
}

export async function finishQuizRecord(quizId: string, answers?: any, summary?: any) {
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
  await ddbClient.send(new UpdateCommand({ TableName: QUIZ_TABLE, Key: { quizId }, UpdateExpression: updateExpr, ExpressionAttributeNames: exprNames, ExpressionAttributeValues: exprValues } as any));
}

export async function saveQuizResult(quizId: string, sessionId: string | undefined, quizType?: string, payload?: Record<string, any>) {
  const item: any = { quizId: String(quizId) };
  if (sessionId) item.sessionId = String(sessionId);
  if (quizType) item.quizType = quizType;
  if (payload) Object.assign(item, payload);
  await ddbClient.send(new PutCommand({ TableName: QUIZ_TABLE, Item: item } as any));
}

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
  await ddbClient.send(new PutCommand({ TableName: QUIZ_TABLE, Item: item } as any));
}

export async function getQuizRecordsForSession(sessionId: string) {
  try {
    const res = await ddbClient.send(new QueryCommand({
      TableName: QUIZ_TABLE,
      IndexName: 'sessionId-index',
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: { ':sid': sessionId }
    } as any));
    const items = res.Items || [];
    return items;
  } catch (e) {
    const scanRes = await ddbClient.send(new ScanCommand({ TableName: QUIZ_TABLE } as any));
    const items = scanRes.Items || [];
    return items.filter((it: any) => it.sessionId === sessionId);
  }
}

export default {
  saveQuizRecord,
  getQuizRecord,
  finishQuizRecord,
  saveQuizResult,
  saveQuizResultSingleRow,
  getQuizRecordsForSession,
};
