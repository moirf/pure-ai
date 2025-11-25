import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { route } from './router';

// import all route files so they register themselves
import './projects/projects';
import './questions';
import './quizzes/index';
import './reviews/index';
import './quizzes/sessions';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return route(event);
};
