import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../../api/router';
import * as quizStore from './quizStore';
import { allocCounter, formatQuizId } from './sessionStore';
import { getSessionQuestion } from './sessions';

function getHeader(headers: Record<string, string | undefined> | null | undefined, name: string) {
  if (!headers) return undefined;
  const needle = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === needle) return value;
  }
  return undefined;
}

export const createQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, metadata } = body as { sessionId?: string; metadata?: Record<string, any> };
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId required' }) };

    try {
      const existing = await quizStore.getQuizRecordsForSession(sessionId);
      const activeQuiz = existing.find((item) => item && item.quizId);
      if (activeQuiz?.quizId) {
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: activeQuiz.quizId, ok: true, reused: true }) };
      }
    } catch (lookupErr) {
      console.warn('Failed to lookup existing quiz for session', sessionId, lookupErr);
    }

    const n = await allocCounter('ATTEMPT');
    const quizId = formatQuizId(n);
    const startedAt = Date.now();
    const payload = { sessionId: sessionId, allocation: {}, startedAt, metadata };
    await quizStore.saveQuizRecord(quizId, payload);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId, ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getQuizById = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const quizId = event.pathParameters?.quizId ?? qs.quizId;
    if (!quizId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'quizId required' }) };
    }

    const headers = event.headers as Record<string, string | undefined> | undefined;
    const headerSession = getHeader(headers, 'x-session-id') || getHeader(headers, 'session-id');
    const sessionToken = headerSession ?? qs.session;

    if (sessionToken) {
      // Reuse the question handler by passing along the resolved session token/index
      const proxyEvent: APIGatewayEvent = {
        ...event,
        queryStringParameters: {
          ...qs,
          session: sessionToken,
        },
      } as APIGatewayEvent;
      return getSessionQuestion(proxyEvent);
    }

    const item = await quizStore.getQuizRecord(quizId);
    if (!item) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Quiz not found' }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const finishQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { answers, summary, quizType } = body as { quizId?: string; answers?: any; summary?: any; quizType?: string };
    const quizId = event.pathParameters?.quizId ?? (body?.quizId as string | undefined);
    if (!quizId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'quizId required' }) };
    try {
      const quiz = await quizStore.getQuizRecord(quizId);
      const sessionId = quiz && quiz.sessionId ? String(quiz.sessionId) : undefined;
      if (sessionId) {
        try {
          await quizStore.saveQuizResultSingleRow(quizId, sessionId, quizType, answers, summary, undefined);
        } catch (err) {
          await quizStore.finishQuizRecord(quizId, answers, summary);
          try {
            let total = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            if (Array.isArray(answers)) {
              total = answers.length;
              for (const a of answers) {
                if (a === 1) correctCount++;
                else if (a === 0) incorrectCount++;
              }
            }
            const payload: any = { total, correct: correctCount, incorrect: incorrectCount, finishedAt: Date.now() };
            if (summary !== undefined) payload.summary = summary;
            await quizStore.saveQuizResult(quizId, sessionId, quizType, payload);
          } catch (e) {
            console.warn('Failed to save minimal quiz result after fallback', quizId, String(e));
          }
        }
      } else {
        await quizStore.finishQuizRecord(quizId, answers, summary);
      }
    } catch (err) {
      console.warn('Failed to finalize quiz result', quizId, String(err));
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

register('POST', '/api/quizzes', createQuiz);
register('GET', '/api/quizzes/:quizId', getQuizById);
register('POST', '/api/quizzes/:quizId/finish', finishQuiz);

export default {};
