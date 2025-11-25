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
  test('POST /api/quiz without sessionId returns 400', async () => {
    const ev = makeEvent('POST', '/api/quiz', { });
    const res = await route(ev);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBeDefined();
  });

  test('GET /api/quiz without quizId returns 400', async () => {
    const ev = makeEvent('GET', '/api/quiz');
    const res = await route(ev);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBeDefined();
  });

  test('POST /api/quiz/finish without quizId returns 400', async () => {
    const ev = makeEvent('POST', '/api/quiz/finish', { answers: [1,0,1] });
    const res = await route(ev);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBeDefined();
  });
});
