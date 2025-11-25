import { createDbTableClient, Tables } from '../dbTableClient';


export interface QuizQuestionEntry {
  sno: number;
  questionId: string;
  correct?: boolean | null;
}

export interface QuizDbRecord {
  quizId: string;
  sessionId?: string;
  quizType?: string;
  questions?: QuizQuestionEntry[];
  answers?: any;
  result?: any;
  startedAt?: number;
  finishedAt?: number;
  [key: string]: any;
}

type QuizPrimaryKey = { quizId: string };
type QuizItem = QuizDbRecord;
type QuizRecordUpdate = Partial<Omit<QuizDbRecord, 'quizId'>>;

const quizTableClient = createDbTableClient<QuizItem, QuizPrimaryKey>(Tables.QUIZ_TABLE);

export async function saveQuizRecord(quizId: string, payload: QuizRecordUpdate = {}) {
  const existing = await quizTableClient.get({ quizId }).catch(() => null);
  const base: QuizDbRecord = existing ? { ...existing } : { quizId: String(quizId) };
  if (payload.sessionId) base.sessionId = String(payload.sessionId);
  Object.assign(base, payload);
  await quizTableClient.put(base);
}

export async function getQuizRecord(quizId: string): Promise<QuizDbRecord | null> {
  return quizTableClient.get({ quizId });
}

export async function finishQuizRecord(
  quizId: string,
  answers?: QuizDbRecord['answers'],
  summary?: QuizDbRecord['summary'],
  questions?: QuizDbRecord['questions']
) {
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
  if (questions !== undefined) {
    exprNames['#q'] = 'questions';
    exprValues[':q'] = questions;
    setParts.push('#q = :q');
  }
  exprNames['#f'] = 'finishedAt';
  exprValues[':f'] = now;
  setParts.push('#f = :f');
  const updateExpr = 'SET ' + setParts.join(', ');
  await quizTableClient.update(
    { quizId },
    {
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }
  );
}

export async function saveQuizResult(
  quizId: string,
  sessionId: string | undefined,
  quizType?: string,
  payload?: QuizRecordUpdate
) {
  const item: QuizDbRecord = { quizId: String(quizId) };
  if (sessionId) item.sessionId = String(sessionId);
  if (quizType) item.quizType = quizType;
  if (payload) Object.assign(item, payload);
  await quizTableClient.put(item);
}

export async function saveQuizResultSingleRow(
  quizId: string,
  sessionId: string,
  quizType?: string,
  answers?: any,
  summary?: any,
  payload?: QuizRecordUpdate
) {
  const item: QuizDbRecord = { sessionId: String(sessionId), quizId: String(quizId) };
  if (quizType) item.quizType = quizType;
  if (answers !== undefined) item.answers = answers;
  if (summary !== undefined) item.summary = summary;
  if (payload) Object.assign(item, payload);
  await quizTableClient.put(item);
}

export async function getQuizRecordsForSession(sessionId: string): Promise<QuizDbRecord[]> {
  try {
    return await quizTableClient.query({
      IndexName: 'sessionId-index',
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: { ':sid': sessionId },
    });
  } catch (e) {
    const items = await quizTableClient.scan();
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
