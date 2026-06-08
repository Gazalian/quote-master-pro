/**
 * Thin typed fetch wrapper around the backend API.
 *
 * All requests go through here so we have ONE place that:
 *  - reads the base URL from env
 *  - attaches the current Supabase JWT
 *  - normalises error responses into thrown Error objects
 *  - handles JSON parsing
 */

import { supabase } from './supabase';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_DEV_PORT = '3001';

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local');
}

function resolveBaseUrl(rawBaseUrl?: string, location?: Location): string {
  const fallback = `http://localhost:${API_DEV_PORT}`;
  const configured = rawBaseUrl || fallback;

  if (!location || !import.meta.env.DEV) return configured;

  const pageHost = location.hostname;
  if (isLoopbackHost(pageHost)) return configured;

  try {
    const apiUrl = new URL(configured);
    if (!isLoopbackHost(apiUrl.hostname)) return configured;

    // Vite exposes LAN URLs like http://192.168.x.x:8080. In that case a
    // browser-side call to localhost:3001 points at the browser's device, not
    // this dev machine. Keep the backend port, but follow the page host.
    apiUrl.hostname = pageHost;
    apiUrl.port = apiUrl.port || API_DEV_PORT;
    apiUrl.protocol = location.protocol;
    return apiUrl.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

const BASE_URL = resolveBaseUrl(RAW_BASE_URL, typeof window !== 'undefined' ? window.location : undefined);

type ApiErrorBody = {
  error?: unknown;
  code?: string;
};

type OtoquoteDiagResult = {
  baseUrl: string;
  whoami?: unknown;
  counts?: unknown;
  error?: string;
};

declare global {
  interface Window {
    __otoquoteDiag?: () => Promise<OtoquoteDiagResult>;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Boot-time guardrail.
//
// The number-one cause of "users see no data after deploy" in this codebase
// has been forgetting to set VITE_API_BASE_URL in the production environment.
// The bundle then ships with `http://localhost:3001` baked in, every
// `/api/*` call fails, and every page renders its empty state.
//
// Print a LOUD console error when:
//   - the env var is unset, AND
//   - the page is being served from a non-local origin
// so it's obvious in DevTools rather than silently broken.
// ────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (!RAW_BASE_URL && !isLocal) {
    console.error(
      '%c[apiClient] VITE_API_BASE_URL is not set.\n' +
        `Page is at ${window.location.origin}, but API calls will go to ${BASE_URL}, which is unreachable from this origin.\n` +
        'Set VITE_API_BASE_URL in the deployment environment and rebuild.',
      'color:#b91c1c;font-weight:bold;font-size:13px;',
    );
  }
}

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Network-level (not HTTP-level) failure: DNS, CORS preflight, server down.
 * Carries the attempted URL so the user can see in DevTools where the call
 * was going when it failed.
 */
export class ApiNetworkError extends Error {
  constructor(public url: string, public cause: unknown) {
    super(
      `Network error calling ${url}: ${(cause as Error)?.message ?? cause}. ` +
        `If you just deployed, check that VITE_API_BASE_URL is correct and the backend is reachable.`,
    );
    this.name = 'ApiNetworkError';
  }
}

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response, url: string): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const errorBody = body && typeof body === 'object' ? (body as ApiErrorBody) : null;
    const msg =
      errorBody?.error ||
      res.statusText;
    const code =
      errorBody?.code || undefined;
    console.warn(`[apiClient] ${res.status} ${url} —`, msg);
    throw new ApiClientError(res.status, String(msg), code);
  }
  return body as T;
}

export interface RequestOptions {
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    // Network-level (CORS preflight rejected, DNS, server unreachable).
    // The original error doesn't carry the URL — rewrap so consumers see it.
    console.error(`[apiClient] network error → ${url}`, err);
    throw new ApiNetworkError(url, err);
  }
}

export const api = {
  async get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const res = await doFetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', ...(await authHeader()) },
      signal: opts.signal,
    });
    return parseResponse<T>(res, url);
  },

  async post<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const res = await doFetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res, url);
  },

  async put<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const res = await doFetch(url, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res, url);
  },

  async patch<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const res = await doFetch(url, {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res, url);
  },

  async delete<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const res = await doFetch(url, {
      method: 'DELETE',
      headers: { Accept: 'application/json', ...(await authHeader()) },
      signal: opts.signal,
    });
    return parseResponse<T>(res, url);
  },
};

/**
 * Diagnostic helper exposed on `window.__otoquoteDiag` for production
 * runbook use. Run from DevTools:
 *
 *   await window.__otoquoteDiag()
 *
 * Returns whoami + per-table counts visible under the current JWT.
 */
if (typeof window !== 'undefined') {
  window.__otoquoteDiag = async () => {
    try {
      const [whoami, counts] = await Promise.all([
        api.get('/api/debug/whoami'),
        api.get('/api/debug/counts'),
      ]);
      console.log('[otoquote-diag]', { baseUrl: BASE_URL, whoami, counts });
      return { baseUrl: BASE_URL, whoami, counts };
    } catch (err) {
      console.error('[otoquote-diag] failed', err);
      return { baseUrl: BASE_URL, error: (err as Error).message };
    }
  };
}
