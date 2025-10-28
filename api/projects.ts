import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import fs from 'fs';
import path from 'path';
import { register } from './router';

async function loadProjects() {
  const dataPath = path.join(process.cwd(), 'public', 'projects', 'projects.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

export const listProjects = async (_event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const projects = await loadProjects();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projects) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};

export const getProject = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const projects = await loadProjects();
    const id = event.pathParameters?.id;
    if (!id) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'id required' }) };
    }
    const project = projects.find((p: any) => String(p.id) === String(id));
    if (!project) {
      return { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) };
  } catch (err: any) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};

// Register routes
register('GET', '/projects', listProjects);
register('GET', '/projects/:id', getProject);
