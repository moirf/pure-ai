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
  // Normalize method from REST (httpMethod) or HTTP API (requestContext.http.method)
  const method = (
    (event.httpMethod as string | undefined) ||
    ((event.requestContext as any)?.http?.method as string | undefined) ||
    'GET'
  ).toUpperCase();

  // Normalize path: REST uses event.path, HTTP API v2 uses event.rawPath; API Gateway may also include stage in path
  let path: string = (event.path as string) || ((event as any).rawPath as string) || ((event.requestContext as any)?.http?.path as string) || '/';

  // If API Gateway stage is present as a prefix (e.g. /dev/...), strip it for matching
  const stage = (event.requestContext as any)?.stage as string | undefined;
  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.replace(`/${stage}`, '');
  }

  // If the API is mounted under a prefix (for example CloudFront or gateway uses `/api`),
  // allow stripping a configurable prefix so handlers register plain routes like `/projects`.
  // Set the environment variable API_PREFIX to the prefix you want stripped (e.g. '/api').
  const apiPrefix = (process.env.API_PREFIX || '').trim();
  if (apiPrefix) {
    // ensure prefix starts with '/'
    const normalizedPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
    if (path === normalizedPrefix) {
      path = '/';
    } else if (path.startsWith(normalizedPrefix + '/')) {
      path = path.slice(normalizedPrefix.length) || '/';
    }
  }

  // Normalize trailing slash (treat /foo and /foo/ as equal)
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  // Debug log to help diagnose 404s
  console.log('Router incoming:', { method, path });
  console.log('Registered routes:', routes.map(r => `${r.method} ${r.pattern}`));

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
    body: JSON.stringify({ error: '404: Route Not found' })
  };
}
