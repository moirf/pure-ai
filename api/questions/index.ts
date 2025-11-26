import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../router';
import {
	loadQuestions,
	ensureQuestionsTable,
	findQuestionById,
	invalidateQuestionsCache,
	buildQuestionItem,
	getQuestionKey,
	isQuestionTableConfigured,
	QuestionRecord,
} from './questionStore';
import { getSessionQuestion } from '../quizzes/sessions';

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const qs = (event.queryStringParameters || {}) as Record<string, string>;
  if (qs.session) {
    return getSessionQuestion(event);
  }

  const index = qs.index ? Number(qs.index) : undefined;
  const count = qs.count ? Math.min(50, Math.max(1, Number(qs.count))) : undefined;
  const random = qs.random === 'true' || false;

  const allQuestions = await loadQuestions();
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

const parseBody = (event: APIGatewayEvent) => (event.body ? JSON.parse(event.body) : {});

function validateQuestionPayload(payload: any, partial = false) {
	const errors: string[] = [];
	const result: Partial<QuestionRecord> = {};

	if (!partial || payload.text !== undefined) {
		if (typeof payload.text !== 'string' || !payload.text.trim()) {
			errors.push('text is required');
		} else {
			result.text = payload.text.trim();
		}
	}

	if (!partial || payload.options !== undefined) {
		if (!Array.isArray(payload.options) || payload.options.length < 2) {
			errors.push('options must be an array with at least two entries');
		} else {
			result.options = payload.options.map((opt: any) => String(opt));
		}
	}

	if (!partial || payload.answerIndex !== undefined) {
		if (typeof payload.answerIndex !== 'number' || Number.isNaN(payload.answerIndex)) {
			errors.push('answerIndex must be a number');
		} else {
			result.answerIndex = payload.answerIndex;
		}
	}

	if (payload.explanation !== undefined) {
		result.explanation = String(payload.explanation);
	}
	if (payload.pk !== undefined) result.pk = String(payload.pk);
	if (payload.sk !== undefined) result.sk = String(payload.sk);
	if (payload.id !== undefined) result.id = String(payload.id);

	return { errors, value: result };
}

export const getQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	const id = event.pathParameters?.id;
	if (!id) {
		return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'id required' }) };
	}
	const question = await findQuestionById(id);
	if (!question) {
		return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };
	}
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(question) };
};

export const addQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	try {
		if (!isQuestionTableConfigured) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Questions table not configured for writes' }) };
		}
		const payload = parseBody(event);
		const { errors, value } = validateQuestionPayload(payload);
		if (errors.length) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: errors.join(', ') }) };
		}
		const question = buildQuestionItem({ ...value } as QuestionRecord);
		if (question.answerIndex < 0 || question.answerIndex >= (question.options?.length ?? 0)) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'answerIndex must point to an option index' }) };
		}
		const table = ensureQuestionsTable();
		await table.put(question as QuestionRecord);
		invalidateQuestionsCache();
		return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, question }) };
	} catch (err: any) {
		return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
	}
};

export const updateQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	try {
		if (!isQuestionTableConfigured) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Questions table not configured for writes' }) };
		}
		const id = event.pathParameters?.id;
		if (!id) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'id required' }) };
		}
		const existing = await findQuestionById(id);
		if (!existing) {
			return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };
		}
		const payload = parseBody(event);
		const { errors, value } = validateQuestionPayload(payload, true);
		if (errors.length) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: errors.join(', ') }) };
		}

		const updates: Record<string, any> = {};
		if (value.text !== undefined) updates.text = value.text;
		if (value.options) updates.options = value.options;
		const optionsToValidate = updates.options ?? existing.options;
		if (value.answerIndex !== undefined) updates.answerIndex = value.answerIndex;
		const answerIndexToValidate = updates.answerIndex ?? existing.answerIndex;
		if (answerIndexToValidate < 0 || answerIndexToValidate >= (optionsToValidate?.length ?? 0)) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'answerIndex must point to an option index' }) };
		}
		if (value.explanation !== undefined) updates.explanation = value.explanation;
		if (!Object.keys(updates).length) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'No valid fields to update' }) };
		}
		const table = ensureQuestionsTable();
		await table.update(getQuestionKey(existing, id), updates);
		invalidateQuestionsCache();
		return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
	} catch (err: any) {
		return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
	}
};

export const validateQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	try {
		const id = event.pathParameters?.id;
    // get the answerIndex from body and match against stored question
   if (!id) {
			return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'id required' }) };
		}
		const question = await findQuestionById(id);
		if (!question) {
			return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };
		}
		const payload = parseBody(event);
		const answerIndex = typeof payload.answerIndex === 'number' ? payload.answerIndex : null;
		const correct = answerIndex === question.answerIndex;
		return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, correct }) };
	} catch (err: any) {
		return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err?.message || err) }) };
	}
};

register('GET', '/api/questions', listQuestions);
register('GET', '/api/questions/:id', getQuestion);
register('POST', '/api/questions/:id/validate', validateQuestion);
register('POST', '/api/questions', addQuestion);
register('PUT', '/api/questions/:id', updateQuestion);
register('POST', '/api/questions/seed', seedQuestions);

export default {};
