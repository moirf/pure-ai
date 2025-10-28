import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from './router';

interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
}

const questions: Question[] = [
  { id: 1, text: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin'], answer: 'Paris' },
  { id: 2, text: 'What is 2 + 2?', options: ['3', '4', '5'], answer: '4' }
];

export const listQuestions = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questions) };
};

export const getQuestion = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const question = questions.find(q => q.id === Number(id));
  if (!question) {
    return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Question not found' }) };
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(question) };
};

// Register route
register('GET', '/questions', listQuestions);
register('GET', '/questions/:id', getQuestion);
