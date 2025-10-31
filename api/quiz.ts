import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';

interface Question {
  id: number;
  text: string;
  options: string[];
  // store answer as numeric index (server-side only)
  answerIndex: number;
  explanation?: string;
}

// Expanded sample question bank
const questions: Question[] = [
  { id: 1, text: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin'], answerIndex: 0 },
  { id: 2, text: 'What is 2 + 2?', options: ['3', '4', '5'], answerIndex: 1 },
  { id: 3, text: 'Which language runs in a web browser?', options: ['Java', 'C', 'JavaScript'], answerIndex: 2 },
  { id: 4, text: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System'], answerIndex: 0 },
  { id: 5, text: 'Which company developed the React library?', options: ['Google', 'Facebook', 'Microsoft'], answerIndex: 1 },
  { id: 6, text: 'Which of these is a NoSQL database?', options: ['MySQL', 'MongoDB', 'Postgres'], answerIndex: 1 },
  { id: 7, text: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'Hyperlink Transfer Protocol', 'HyperText Transmission Program'], answerIndex: 0 },
  { id: 8, text: 'Which keyword declares a constant in JavaScript?', options: ['var', 'let', 'const'], answerIndex: 2 },
  { id: 9, text: 'Which HTML element is used for the largest heading?', options: ['<h1>', '<head>', '<heading>'], answerIndex: 0 },
  { id: 10, text: 'Which built-in method removes the last element from an array in JavaScript?', options: ['pop()', 'push()', 'shift()'], answerIndex: 0 },
  { id: 11, text: 'Which operator is used for strict equality in JavaScript?', options: ['==', '=', '==='], answerIndex: 2 },
  { id: 12, text: 'What is the output type of JSON.parse?', options: ['string', 'object', 'number'], answerIndex: 1 },
  { id: 13, text: 'Which CSS property controls layout flow?', options: ['display', 'color', 'font-size'], answerIndex: 0 },
  { id: 14, text: 'Which tag is used to include a JavaScript file?', options: ['<script>', '<js>', '<include>'], answerIndex: 0 },
  { id: 15, text: 'Which HTTP status code means "Not Found"?', options: ['200', '301', '404'], answerIndex: 2 },
];

function stripAnswer(q: Question) {
  const { answerIndex, explanation, ...rest } = q;
  return rest;
}

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  // Support query params: index=<n> returns single question at index (0-based),
  // count=<m> returns m random questions, random=true returns randomized set
  const qs = (event.queryStringParameters || {}) as Record<string, string>;
  const index = qs.index ? Number(qs.index) : undefined;
  const count = qs.count ? Math.min(50, Math.max(1, Number(qs.count))) : undefined;
  const random = qs.random === 'true' || false;

  if (typeof index === 'number' && !isNaN(index)) {
    const q = questions[index % questions.length];
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stripAnswer(q)) };
  }

  let pool = [...questions];
  if (random) {
    // simple shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  if (count) {
    pool = pool.slice(0, count);
  }

  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pool.map(stripAnswer)) };
};

export const validateAnswer = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { sessionId, index, selectedIndex } = body as { sessionId?: string; index?: number; selectedIndex?: number };
    if (!sessionId || typeof index !== 'number' || typeof selectedIndex !== 'number') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'sessionId, index and selectedIndex are required' }) };
    }

    const sess = sessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid index' }) };

    const qid = sess.ids[index];
    const q = questions.find((x) => x.id === qid);
    if (!q) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };

    // Map selectedIndex (client-ordered) back to original index
    const order = sess.optionOrders[index];
    const mapped = order[selectedIndex];
    const correct = q.answerIndex === mapped;

    // Optionally record the answer in session
    sess.answers[index] = correct ? 1 : 0;

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correct }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Simple in-memory session store (ephemeral)
type Session = {
  id: string;
  ids: number[]; // question ids in order for this session
  optionOrders: number[][]; // per-question mapping: client index -> original option index
  answers: number[]; // -1 unanswered, 1 correct, 0 wrong
};

const sessionStore = new Map<string, Session>();

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const startSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { count = 15 } = body as { count?: number };
    const pool = shuffle(questions).slice(0, Math.min(count, questions.length));
    const ids = pool.map((q) => q.id);
    const optionOrders = pool.map((q) => shuffle(q.options.map((_, i) => i)));
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const sess: Session = { id: sessionId, ids, optionOrders, answers: new Array(ids.length).fill(-1) };
    sessionStore.set(sessionId, sess);

    // return first question with shuffled options
    const first = questions.find((x) => x.id === ids[0])!;
    const order = optionOrders[0];
    const clientOptions = order.map((oi) => first.options[oi]);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, index: 0, question: { id: first.id, text: first.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

export const getSessionQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const qs = (event.queryStringParameters || {}) as Record<string, string>;
    const sessionId = qs.session;
    const index = qs.index ? Number(qs.index) : 0;
    if (!sessionId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session required' }) };
    const sess = sessionStore.get(sessionId);
    if (!sess) return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'session not found' }) };
    if (index < 0 || index >= sess.ids.length) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid index' }) };

    const qid = sess.ids[index];
    const q = questions.find((x) => x.id === qid)!;
    const order = sess.optionOrders[index];
    const clientOptions = order.map((oi) => q.options[oi]);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, index, question: { id: q.id, text: q.text, options: clientOptions } }) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};

// Register route
register('POST', '/api/questions/start', startSession);
register('GET', '/api/questions', getSessionQuestion);
register('POST', '/api/questions/answer', validateAnswer);
