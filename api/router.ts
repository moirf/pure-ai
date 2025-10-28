import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

type RouteHandler = (event: APIGatewayEvent) => Promise<APIGatewayProxyResult> | APIGatewayProxyResult;

type Route = {
  method: string;
  pattern: string;
  regex: RegExp;
  keys: string[];
  handler: RouteHandler;
};

const routes: Route[] = [];

function compilePattern(pattern: string) {
  const keys: string[] = [];
  const regexSource = pattern.replace(/:([^/]+)/g, (_m, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexSource}$`);
  return { regex, keys };
}

export function register(method: string, pattern: string, handler: RouteHandler) {
  const { regex, keys } = compilePattern(pattern);
  routes.push({ method: method.toUpperCase(), pattern, regex, keys, handler });
}

export async function route(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  const method = (event.httpMethod || (event.requestContext && (event.requestContext as any).http?.method) || 'GET').toUpperCase();
  const path = event.path || '/';

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.regex.exec(path);
    if (!m) continue;

    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(m[i + 1] || '');
    });

    const enriched: APIGatewayEvent = {
      ...event,
      pathParameters: { ...(event.pathParameters || {}), ...params }
    } as APIGatewayEvent;

    try {
      const res = await r.handler(enriched);
      return res;
    } catch (err: any) {
      console.error('Route handler error', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: String(err?.message ?? err) })
      };
    }
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not found' })
  };
}
