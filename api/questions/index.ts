import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../router';
import { sessionStore as inMemorySessionStore } from '../sessionStore';
import * as quizStore from '../quizStore';
import ddbClient from '../dbClient';
import { ScanCommand, GetCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import questions from '../questionsData';

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

export default {};
