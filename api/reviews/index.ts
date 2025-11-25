import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { register } from '../router';

export const listReviews = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, reviews: [] }) };
};

register('GET', '/api/reviews', listReviews);

export default {};
