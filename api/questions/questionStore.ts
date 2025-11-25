import { createDbTableClient } from '../dbTableClient';
import questions from './questionsData';

export type QuestionRecord = {
	id?: string | number;
	pk?: string;
	sk?: string;
	text: string;
	options: string[];
	answerIndex: number;
	explanation?: string;
	[key: string]: any;
};

const questionTableName = process.env.QUESTIONS_TABLE || process.env.DDB_TABLE;
type QuestionKey = { pk: string; sk: string };
const questionsTableClient = questionTableName ? createDbTableClient<QuestionRecord, QuestionKey>(questionTableName) : null;

let dbQuestionsCache: QuestionRecord[] | null = null;

export async function loadQuestions(): Promise<QuestionRecord[]> {
	if (!questionsTableClient || !questionTableName) {
		return questions as QuestionRecord[];
	}
	if (dbQuestionsCache) return dbQuestionsCache;
	try {
		const items = await questionsTableClient.scan();
		dbQuestionsCache = (items as QuestionRecord[]) ?? [];
		return dbQuestionsCache;
	} catch (err) {
		console.warn('Failed to load questions from DynamoDB, falling back to static list', err);
		dbQuestionsCache = questions as QuestionRecord[];
		return dbQuestionsCache;
	}
}

export function invalidateQuestionsCache() {
	dbQuestionsCache = null;
}

export function ensureQuestionsTable() {
	if (!questionsTableClient) {
		throw new Error('Questions table not configured');
	}
	return questionsTableClient;
}

export async function findQuestionById(id: string) {
	const all = await loadQuestions();
	return all.find((q) => String(q.id ?? q.sk) === String(id));
}

export function getQuestionKey(question: QuestionRecord, fallbackId: string) {
	const pk = question.pk ?? question.Category ?? 'Unknown';
	const sk = question.sk ?? String(question.id ?? fallbackId);
	return { pk, sk };
}

export function buildQuestionItem(payload: QuestionRecord): QuestionRecord {
	const id = String(payload.id ?? Date.now());
	const pk = payload.pk ?? payload.Category ?? 'General';
	const sk = payload.sk ?? String(id);
	return { ...payload, id, pk, sk };
}

export const isQuestionTableConfigured = Boolean(questionsTableClient);