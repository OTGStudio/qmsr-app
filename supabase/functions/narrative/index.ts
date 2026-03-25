import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';
import { getCorsHeaders } from '../_shared/cors.ts';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

const DEFAULT_SYSTEM = [
  'You are a regulatory writing assistant for FDA QMSR (CP 7382.850) inspection readiness.',
  'You MUST treat the user message as the only source of facts.',
  'FORBIDDEN: inventing recalls, MDR counts, prior inspections, CAPAs, design failures, software defects, supplier failures, or any fact not explicitly present in the user message.',
  'FORBIDDEN: asserting that a signal exists unless it appears in the user message under normalized scenario signals or FDA/triangulation sections.',
  'REQUIRED: separate factual restatement from interpretive commentary; use conditional wording when evidence is incomplete.',
  'Do not use QSIT-era subsystem framing.',
].join('\n');

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(accessToken);
  if (authErr || !user) {
    const message = authErr?.message ?? 'Unauthorized';
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as {
      systemPrompt?: string;
      userContent?: string;
      prompt?: string;
    };

    const userContent =
      typeof body.userContent === 'string' && body.userContent.trim().length > 0
        ? body.userContent
        : typeof body.prompt === 'string'
          ? body.prompt
          : '';

    if (!userContent) {
      return new Response(
        JSON.stringify({ error: 'userContent or prompt is required' }),
        {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        },
      );
    }

    const system =
      typeof body.systemPrompt === 'string' && body.systemPrompt.trim().length > 0
        ? body.systemPrompt
        : DEFAULT_SYSTEM;

    // Adjudication-constrained requests need more tokens to incorporate locked findings
    const hasAdjudication = userContent.includes('## LOCKED ADJUDICATION');
    const maxTokens = hasAdjudication ? 1280 : 1024;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = message.content.find((b) => b.type === 'text')?.text ?? '';
    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
