import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Centralized DynamoDB document client for API modules to share.
const ddbClient = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const QUIZ_TABLE = process.env.QUIZ_TABLE || 'QuizDb';
export const SESSIONS_TABLE = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || 'SessionDb';

export default ddbDocClient;
