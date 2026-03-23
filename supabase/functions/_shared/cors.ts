/**
 * CORS for browser → Edge Function requests (e.g. narrative).
 * - Adds Access-Control-Allow-Methods so OPTIONS preflight succeeds.
 * - When APP_URL is set, still reflects localhost, 127.0.0.1, and *.vercel.app
 *   so dev and preview deployments match Access-Control-Allow-Origin.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get('APP_URL') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.get('Origin');

  let allowOrigin: string;
  if (configured.length === 0) {
    allowOrigin = '*';
  } else if (!requestOrigin) {
    allowOrigin = configured[0];
  } else if (
    configured.includes(requestOrigin) ||
    requestOrigin.startsWith('http://localhost:') ||
    requestOrigin.startsWith('http://127.0.0.1:') ||
    requestOrigin.endsWith('.vercel.app')
  ) {
    allowOrigin = requestOrigin;
  } else {
    allowOrigin = configured[0];
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  };
}
