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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (body && typeof body === 'object' && 'error' in body && (body as any).error) || res.statusText;
    const code = (body && typeof body === 'object' && 'code' in body && (body as any).code) || undefined;
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

export const api = {
  async get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await fetch(buildUrl(path, opts.query), {
      method: 'GET',
      headers: { 'Accept': 'application/json', ...(await authHeader()) },
      signal: opts.signal,
    });
    return parseResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const res = await fetch(buildUrl(path, opts.query), {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const res = await fetch(buildUrl(path, opts.query), {
      method: 'PUT',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    const res = await fetch(buildUrl(path, opts.query), {
      method: 'PATCH',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
    });
    return parseResponse<T>(res);
  },

  async delete<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await fetch(buildUrl(path, opts.query), {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', ...(await authHeader()) },
      signal: opts.signal,
    });
    return parseResponse<T>(res);
  },
};
