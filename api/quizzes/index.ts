import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../../api/router';
import * as quizStore from './quizStore';
import type { QuizDbRecord, QuizQuestionEntry } from './quizStore';
import { allocCounter, formatQuizId } from './sessionStore';
import { prepareQuestionSet, getSessionQuestion, initializeRuntimeSession } from './sessions';
import type { PreparedQuestionSet, RuntimeSessionInitResult } from './sessions';

function getHeader(headers: Record<string, string | undefined> | null | undefined, name: string) {
  if (!headers) return undefined;
  const needle = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === needle) return value;
  }
  return undefined;
}

function buildQuestionResults(quiz: QuizDbRecord | null, answers?: any): QuizQuestionEntry[] | undefined {
  let base: QuizQuestionEntry[] | undefined;
  if (Array.isArray(quiz?.questions) && quiz.questions.length) {
    base = quiz.questions.map((q) => ({ ...q }));
  } else if (quiz && Array.isArray((quiz as any).questionIds)) {
    const ids = (quiz as any).questionIds as string[];
    base = ids.map((questionId, idx) => ({ sno: idx + 1, questionId }));
  }
  if (!base) return undefined;
  if (Array.isArray(answers)) {
    for (let i = 0; i < base.length; i++) {
      const val = answers[i];
      if (val === 1) base[i].correct = true;
      else if (val === 0) base[i].correct = false;
      else base[i].correct = null;
    }
  }
  return base;
}

export const createQuiz = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, metadata } = body as { sessionId?: string; metadata?: Record<string, any>; count?: number; allocation?: Record<string, number> };
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId required' }) };

    const n = await allocCounter('ATTEMPT');
    const quizId = formatQuizId(n);
    const startedAt = Date.now();
    const bodyAllocation = body?.allocation && typeof body.allocation === 'object' ? body.allocation : undefined;
    const metadataAllocation = metadata && typeof metadata.allocation === 'object' ? metadata.allocation : undefined;
    const allocation = bodyAllocation || metadataAllocation;
    const countFromBody = typeof (body as any).count === 'number' ? (body as any).count : undefined;
    const countFromMetadata = typeof metadata?.totalQuestions === 'number' ? metadata.totalQuestions : undefined;

    let preparedSet: PreparedQuestionSet | null = null;
    try {
      preparedSet = await prepareQuestionSet({
        count: countFromBody ?? countFromMetadata ?? 15,
        allocation,
      });
    } catch (setErr) {
      console.warn('createQuiz: failed to prepare question set', quizId, setErr);
    }

    const payload: Record<string, any> = {
      sessionId: sessionId,
      allocation: allocation || {},
      startedAt,
      metadata,
    };
    if (preparedSet) {
      payload.questionIds = preparedSet.ids;
      payload.totalQuestions = preparedSet.ids.length;
      payload.questions = preparedSet.questionStatus;
    }

    await quizStore.saveQuizRecord(quizId, payload);

    let sessionInit: RuntimeSessionInitResult | null = null;
    if (preparedSet) {
      try {
        sessionInit = await initializeRuntimeSession({
          preparedSet,
          allocation,
          quizId,
          sessionId,
          skipQuizUpdate: true,
        });
      } catch (runtimeErr) {
        console.warn('createQuiz: failed to initialize runtime session', quizId, runtimeErr);
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, ok: true, questionSet: preparedSet ? preparedSet.questionStatus : null, session: sessionInit }),
    };
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
    const sanitized = { ...item } as Record<string, any>;
    if ('allocatedQuestions' in sanitized) delete sanitized.allocatedQuestions;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitized) };
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
      const questionResults = buildQuestionResults(quiz, answers);
      const sessionId = quiz && quiz.sessionId ? String(quiz.sessionId) : undefined;
      if (sessionId) {
        try {
          await quizStore.saveQuizResultSingleRow(
            quizId,
            sessionId,
            quizType,
            answers,
            summary,
            questionResults ? { questions: questionResults } : undefined
          );
        } catch (err) {
          await quizStore.finishQuizRecord(quizId, answers, summary, questionResults);
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
            if (questionResults) payload.questions = questionResults;
            await quizStore.saveQuizResult(quizId, sessionId, quizType, payload);
          } catch (e) {
            console.warn('Failed to save minimal quiz result after fallback', quizId, String(e));
          }
        }
      } else {
        await quizStore.finishQuizRecord(quizId, answers, summary, questionResults);
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
