import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import fs from 'fs';
import path from 'path';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'projects', 'projects.json');
    const raw = fs.readFileSync(dataPath, 'utf8');
    const projects = JSON.parse(raw);

    const id = event.pathParameters?.id;
    if (id) {
      const project = projects.find((p: any) => String(p.id) === String(id));
      if (!project) {
        return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projects) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};
