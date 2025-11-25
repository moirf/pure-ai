import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { route } from './router';

// import all route files so they register themselves
import './projects';
import './questions';
import './quiz';
import './reviews';
import './sessions';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return route(event);
};
