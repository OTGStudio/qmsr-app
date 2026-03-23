import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  return new Response(JSON.stringify({ message: 'received' }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
