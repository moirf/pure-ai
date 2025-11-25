// Simulate a full quiz lifecycle: create quiz, start session, fetch question, answer, finish
import { route } from '../../api/router';

// Mock quizStore and dbClient before loading route modules
jest.mock('../../api/quizzes/quizStore', () => {
  let store: Record<string, any> = {};
  return {
    saveQuizRecord: jest.fn(async (quizId: string, payload: any) => { store[quizId] = Object.assign(store[quizId] || {}, payload); return true; }),
    getQuizRecord: jest.fn(async (quizId: string) => { return store[quizId] ?? null; }),
    finishQuizRecord: jest.fn(async () => true),
    saveQuizResultSingleRow: jest.fn(async () => true),
    saveQuizResult: jest.fn(async () => true),
    getQuizRecordsForSession: jest.fn(async (sessionId: string) => {
      return Object.entries(store)
        .filter(([_, value]) => value && value.sessionId === sessionId)
        .map(([quizId, value]) => ({ quizId, ...value }));
    }),
    __reset: () => { store = {}; }
  };
});

jest.mock('../../api/dbTableClient', () => {
  const noopClient = () => ({
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(async () => ({ Attributes: { v: 1 } })),
    delete: jest.fn(),
    query: jest.fn(async () => []),
    scan: jest.fn(async () => []),
  });
  return {
    __esModule: true,
    default: null,
    createDbTableClient: jest.fn(() => noopClient()),
    Tables: { QUIZ_TABLE: 'QuizDb', SESSIONS_TABLE: 'SessionDb' },
    QUIZ_TABLE: 'QuizDb',
    SESSIONS_TABLE: 'SessionDb',
  };
});

// Mock sessionStore so allocCounter doesn't try to use DynamoDB
jest.mock('../../api/quizzes/sessionStore', () => {
  const aliasMap = new Map<string, string>();
  return {
    allocCounter: jest.fn(async (_name?: string) => 1234),
    formatQuizId: jest.fn((n: number) => `QZ-${String(n)}`),
    allocSessionId: jest.fn(async () => 'FL-1234'),
    formatSessionId: jest.fn((n: number) => `FL-${String(n)}`),
    sessionStore: new Map<string, any>(),
    registerSessionAlias: jest.fn((alias: string, runtimeId: string) => aliasMap.set(alias, runtimeId)),
    resolveSessionRuntimeId: jest.fn((value: string) => aliasMap.get(value) ?? value),
    saveQuizRecord: jest.fn(async () => true),
    getSessionEntry: jest.fn(async () => null),
  };
});

// Now import the route modules so registrations occur with mocks in place
require('../../api');

function makeEvent(method: string, path: string, body?: any, qs?: Record<string, string>) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
    queryStringParameters: qs || undefined,
    requestContext: {}
  } as any;
}

describe('Quiz lifecycle (mocked stores)', () => {
  test('create -> start -> get question -> answer -> finish', async () => {
    // 1) create quiz with sessionId
    const createEv = makeEvent('POST', '/api/quizzes', { sessionId: 'S-ABC' });
    const createRes = await route(createEv);
    expect(createRes.statusCode).toBe(200);
    const { quizId } = JSON.parse(createRes.body as string);
    expect(typeof quizId).toBe('string');

    // calling create again with the same session should reuse the quizId
    const createResSecond = await route(makeEvent('POST', '/api/quizzes', { sessionId: 'S-ABC' }));
    expect(createResSecond.statusCode).toBe(200);
    const parsedSecond = JSON.parse(createResSecond.body as string);
    expect(parsedSecond.quizId).toBe(quizId);

    // 2) start a session (POST /api/questions/start) - server expects quizId + sessionId
    const startEv = makeEvent('POST', '/api/questions/start', { count: 1, quizId, sessionId: 'S-ABC' });
    const startRes = await route(startEv);
    expect(startRes.statusCode).toBe(200);
    const startBody = JSON.parse(startRes.body as string);
    expect(startBody.runtimeId).toBeDefined();
    expect(startBody.question).toBeDefined();

    const runtimeId = startBody.runtimeId as string;

    // 3) get session question
    const getEv = makeEvent('GET', '/api/questions', undefined, { session: runtimeId, index: '0' });
    const getRes = await route(getEv);
    expect(getRes.statusCode).toBe(200);
    const getBody = JSON.parse(getRes.body as string);
    expect(getBody.question).toBeDefined();

    // 4) answer the question (POST /api/questions/answer)
    const ansEv = makeEvent('POST', '/api/questions/answer', { sessionId: runtimeId, index: 0, selectedIndex: 0 });
    const ansRes = await route(ansEv);
    expect(ansRes.statusCode).toBe(200);
    const ansBody = JSON.parse(ansRes.body as string);
    expect(ansBody.correct).toBeDefined();

    // 5) finish quiz
    const finishEv = makeEvent('POST', `/api/quizzes/${quizId}/finish`, { answers: [1], summary: { score: 1 } });
    const finishRes = await route(finishEv);
    expect(finishRes.statusCode).toBe(200);
    const finishBody = JSON.parse(finishRes.body as string);
    expect(finishBody.ok).toBe(true);
  }, 10000);
});
