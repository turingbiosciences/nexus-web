/**
 * Same-origin reverse proxy to the internal Nexus API.
 *
 * This route is what makes the API private. The browser calls
 * /api/turing/<whatever> on this origin; this handler forwards it to
 * TURING_API_INTERNAL_URL (http://api:8080 in the compose stack), which is not
 * published to the host and therefore unreachable from the internet or the VPC.
 *
 * Three properties matter here and are easy to break:
 *
 *   1. AUTHENTICATION FIRST. Without the Logto check below this becomes an open
 *      relay that hands the whole internal API to the internet — strictly worse
 *      than the public API it replaces.
 *   2. STREAMING BOTH WAYS. The training-status endpoint is server-sent events,
 *      and uploads can be gigabytes. Buffering either would break it, so the
 *      request and response bodies are passed through as streams.
 *   3. THE TOKEN STAYS SERVER-SIDE. It is attached here and never serialized
 *      into a response.
 */

import { NextRequest, NextResponse } from 'next/server';
import LogtoClient from '@logto/next/edge';
import { logtoConfig } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getM2MToken } from '@/lib/api/m2m-token';

// Node runtime: the edge runtime cannot reach a Docker-internal hostname, and
// duplex request streaming needs undici.
export const runtime = 'nodejs';
// Never cache or statically analyse this route.
export const dynamic = 'force-dynamic';

const logto = new LogtoClient(logtoConfig);

/**
 * Headers we must not copy upstream. Hop-by-hop headers are meaningless across
 * a proxy boundary, and `authorization`/`cookie` are dropped deliberately: the
 * upstream call is authenticated by the token we attach, not by whatever the
 * browser sent. Forwarding the session cookie would let a caller smuggle
 * credentials into the internal API.
 */
const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
  'te',
  'trailer',
  'authorization',
  'cookie',
  'content-length',
  // Let undici negotiate its own encoding; a forwarded value can produce a body
  // the runtime will not decode.
  'accept-encoding',
]);

const STRIPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
  // The API sets its own CORS headers for the old cross-origin world. Same-origin
  // now, so drop them rather than emit a conflicting policy.
  'access-control-allow-origin',
  'access-control-allow-credentials',
]);

function internalBaseUrl(): string {
  const base = process.env.TURING_API_INTERNAL_URL;
  if (!base) {
    throw new Error('Missing TURING_API_INTERNAL_URL environment variable');
  }
  // Loop rather than /\/+$/: that pattern backtracks super-linearly on input
  // that is mostly slashes, and getApiBaseUrl already strips trailing slashes
  // this way.
  let url = base;
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  // --- 1. Authenticate -----------------------------------------------------
  try {
    const { isAuthenticated } = await logto.getLogtoContext(req);
    if (!isAuthenticated) {
      // Logged because this branch is otherwise invisible: it returns 401
      // without touching the API, so nothing appears in either app's logs and
      // the failure looks like it came from nowhere. Path and cookie presence
      // are enough to tell "no session" apart from "session not readable here"
      // without putting anything sensitive in the log.
      logger.warn(
        {
          path: req.nextUrl.pathname,
          method: req.method,
          hasCookie: req.headers.has('cookie'),
        },
        'API proxy rejected request: no authenticated Logto session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (err) {
    logger.error({ err }, 'API proxy authentication check failed');
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 401 }
    );
  }

  // --- 2. Build the upstream URL -------------------------------------------
  // Next 15+ delivers params as a promise.
  const { path } = await ctx.params;
  const segments = path ?? [];

  // Defence in depth. Next.js will not put '..' in a catch-all segment, but the
  // cost of being certain is one line.
  if (segments.some((s) => s === '..' || s === '.' || s.includes('\0'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const search = req.nextUrl.search;
  let upstream: string;
  try {
    upstream = `${internalBaseUrl()}/${segments.map(encodeURIComponent).join('/')}${search}`;
  } catch (err) {
    logger.error({ err }, 'API proxy misconfigured');
    return NextResponse.json({ error: 'Proxy misconfigured' }, { status: 500 });
  }

  // --- 3. Attach the server-side token -------------------------------------
  let token: string;
  try {
    token = await getM2MToken();
  } catch (err) {
    logger.error({ err }, 'API proxy could not obtain an access token');
    return NextResponse.json(
      { error: 'Upstream authentication failed' },
      { status: 502 }
    );
  }

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set('authorization', `Bearer ${token}`);
  // Give the API something useful in its logs.
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);

  // --- 4. Forward, streaming in both directions ----------------------------
  const hasBody = !['GET', 'HEAD'].includes(req.method);

  try {
    const res = await fetch(upstream, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by undici whenever body is a stream. Without it, any request
      // with a body throws before leaving the process.
      ...(hasBody ? { duplex: 'half' as const } : {}),
      redirect: 'manual',
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Server-sent events: make sure nothing downstream buffers this. Caddy is
    // already configured with flush_interval -1; this covers the Next.js side.
    if (responseHeaders.get('content-type')?.includes('text/event-stream')) {
      responseHeaders.set('cache-control', 'no-cache, no-transform');
      responseHeaders.set('x-accel-buffering', 'no');
      responseHeaders.delete('content-encoding');
    }

    // Passing res.body through un-consumed is what preserves streaming.
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    logger.error(
      { err, method: req.method },
      'API proxy upstream request failed'
    );
    return NextResponse.json(
      { error: 'Upstream request failed' },
      { status: 502 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
// OPTIONS is forwarded rather than answered locally because resumable uploads
// use it for capability discovery: tus-js-client reads Tus-Resumable,
// Tus-Version and Tus-Extension off the response. Answering here with a stock
// CORS preflight would strip those and silently push every upload onto the XHR
// fallback path.
export const OPTIONS = handle;
