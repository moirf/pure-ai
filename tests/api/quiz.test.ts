jest.mock('../../api/quizzes/quizStore', () => {
  return {
    saveQuizRecord: jest.fn(async () => true),
    getQuizRecord: jest.fn(async () => null),
    finishQuizRecord: jest.fn(async () => true),
    saveQuizResultSingleRow: jest.fn(async () => true),
    saveQuizResult: jest.fn(async () => true),
    getQuizRecordsForSession: jest.fn(async () => []),
  };
});

jest.mock('../../api/quizzes/sessionStore', () => {
  return {
    allocCounter: jest.fn(async () => 1234),
    formatQuizId: jest.fn((n: number) => `QZ-${String(n)}`),
    sessionStore: new Map<string, any>(),
    registerSessionAlias: jest.fn(),
    resolveSessionRuntimeId: jest.fn((value: string) => value),
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

import { route } from '../../api/router';
// Ensure routes are registered
import '../../api';

function makeEvent(method: string, path: string, body?: any) {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
    requestContext: {}
  } as any;
}

describe('Quiz API basic routes', () => {
  test('POST /api/quizzes without sessionId returns 400', async () => {
    const ev = makeEvent('POST', '/api/quizzes', { });
    const res = await route(ev);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBeDefined();
  });

  test('GET /api/quizzes/:quizId returns 404 when quiz not found', async () => {
    const ev = makeEvent('GET', '/api/quizzes/QZ-NOT-FOUND');
    const res = await route(ev);
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBeDefined();
  });

  test('POST /api/quizzes/:quizId/finish works even if quiz missing', async () => {
    const ev = makeEvent('POST', '/api/quizzes/QZ-1234/finish', { answers: [1,0,1] });
    const res = await route(ev);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.ok).toBe(true);
  });
});
