/**
 * Unit tests for the provider-agnostic AI facade.
 *
 * We never hit a real provider — `setProviderChainForTests` injects fakes
 * that implement the AIProvider interface.  This covers the failover state
 * machine end-to-end without burning a single token.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateQuote } from './index.js';
import { setProviderChainForTests } from './factory.js';
import { AIProviderError, type AIProvider, type ProviderName, type BuiltPrompt } from './types.js';

class FakeProvider implements AIProvider {
  public callCount = 0;
  constructor(
    private readonly _name: ProviderName,
    private readonly impl: (prompt: BuiltPrompt, signal: AbortSignal) => Promise<string>,
  ) {}
  name(): ProviderName {
    return this._name;
  }
  async healthCheck(): Promise<boolean> {
    return true;
  }
  generate(prompt: BuiltPrompt, signal: AbortSignal): Promise<string> {
    this.callCount++;
    return this.impl(prompt, signal);
  }
}

const validQuoteJson = JSON.stringify({
  projectTitle: 'Test Wiring Job',
  confidence: 'high',
  reasoning: 'Standard 3-bedroom wiring',
  clarifyingQuestions: [],
  grandTotal: 1500000,
  categories: [
    {
      name: 'Materials',
      items: [
        {
          name: '2.5mm cable coil',
          quantity: 3,
          unit: 'coil',
          unitPrice: 5500,
          total: 16500,
          source: 'ai_estimate',
        },
      ],
    },
    {
      name: 'Labour',
      items: [
        {
          name: 'Electrician',
          quantity: 6,
          unit: 'day',
          unitPrice: 12000,
          total: 72000,
          source: 'ai_estimate',
        },
      ],
    },
  ],
});

const baseInput = {
  userMessage: 'Wire a 3-bedroom flat',
  userTrade: 'electrician',
  userLocation: 'Lagos',
};

beforeEach(() => {
  // Silence pino during tests — failover paths intentionally log warn/error.
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  setProviderChainForTests(null);
  vi.restoreAllMocks();
});

describe('AI facade — failover state machine', () => {
  it('returns OpenAI result on success without invoking fallback', async () => {
    const openai = new FakeProvider('openai', async () => validQuoteJson);
    const gemini = new FakeProvider('gemini', async () => {
      throw new Error('gemini must not be called on primary success');
    });
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('openai');
    expect(result.failovers).toEqual([]);
    expect(openai.callCount).toBe(1);
    expect(gemini.callCount).toBe(0);
    expect(result.draft.groups).toHaveLength(2);
    expect(result.draft.grandTotal).toBe(88500);
  });

  it('fails over to Gemini on OpenAI timeout', async () => {
    const openai = new FakeProvider('openai', async () => {
      throw new AIProviderError('openai', 'timeout', 'request aborted');
    });
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(result.failovers).toHaveLength(1);
    expect(result.failovers[0]).toMatchObject({ provider: 'openai', reason: 'timeout' });
  });

  it('fails over to Gemini on OpenAI 429 rate limit', async () => {
    const openai = new FakeProvider('openai', async () => {
      throw new AIProviderError('openai', 'rate_limit', '429 Too Many Requests');
    });
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(result.failovers[0].reason).toBe('rate_limit');
  });

  it('fails over to Gemini on OpenAI 5xx server error', async () => {
    const openai = new FakeProvider('openai', async () => {
      throw new AIProviderError('openai', 'server_error', '503 Service Unavailable');
    });
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
  });

  it('fails over to Gemini when OpenAI returns invalid JSON', async () => {
    const openai = new FakeProvider('openai', async () => 'not valid json {{{');
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(result.failovers).toHaveLength(1);
    expect(result.failovers[0].reason).toBe('malformed_response');
    expect(openai.callCount).toBe(1);
    expect(gemini.callCount).toBe(1);
  });

  it('returns 503 when both providers fail with retryable errors', async () => {
    const openai = new FakeProvider('openai', async () => {
      throw new AIProviderError('openai', 'rate_limit', '429');
    });
    const gemini = new FakeProvider('gemini', async () => {
      throw new AIProviderError('gemini', 'server_error', '503');
    });
    setProviderChainForTests([openai, gemini]);

    await expect(generateQuote(baseInput)).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(openai.callCount).toBe(1);
    expect(gemini.callCount).toBe(1);
  });

  it('fails over to Gemini when OpenAI auth/config fails', async () => {
    const openai = new FakeProvider('openai', async () => {
      throw new AIProviderError('openai', 'auth', '401 Unauthorized');
    });
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(result.failovers[0]).toMatchObject({ provider: 'openai', reason: 'auth' });
    expect(gemini.callCount).toBe(1);
  });

  it('fails over to Gemini when OpenAI returns an empty quotation', async () => {
    const openai = new FakeProvider(
      'openai',
      async () =>
        JSON.stringify({
          projectTitle: 'Empty quote',
          confidence: 'low',
          categories: [],
          grandTotal: 0,
        }),
    );
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(result.failovers[0].reason).toBe('malformed_response');
  });

  it('normalises item totals and grand total from validated provider output', async () => {
    const openai = new FakeProvider(
      'openai',
      async () =>
        JSON.stringify({
          projectTitle: 'Math check',
          confidence: 'high',
          categories: [
            {
              name: 'Materials',
              items: [
                {
                  name: 'Cable',
                  quantity: 2,
                  unit: 'coil',
                  unitPrice: 5000,
                  total: 999999,
                  source: 'ai_estimate',
                },
              ],
            },
          ],
          grandTotal: 999999,
        }),
    );
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    setProviderChainForTests([openai, gemini]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('openai');
    expect(result.draft.groups[0].items[0].total).toBe(10000);
    expect(result.draft.grandTotal).toBe(10000);
  });

  it('honours env-driven provider order — Gemini primary, OpenAI fallback', async () => {
    // Simulate the "switch back to Gemini" config by reversing the chain
    // directly (real switch happens via AI_PROVIDER_PRIMARY env at boot).
    const gemini = new FakeProvider('gemini', async () => validQuoteJson);
    const openai = new FakeProvider('openai', async () => {
      throw new Error('must not be called');
    });
    setProviderChainForTests([gemini, openai]);

    const result = await generateQuote(baseInput);

    expect(result.providerUsed).toBe('gemini');
    expect(gemini.callCount).toBe(1);
    expect(openai.callCount).toBe(0);
  });
});

describe('AIProviderError', () => {
  it('classifies retryable reasons', () => {
    expect(new AIProviderError('openai', 'timeout', 'x').isRetryable()).toBe(true);
    expect(new AIProviderError('openai', 'rate_limit', 'x').isRetryable()).toBe(true);
    expect(new AIProviderError('openai', 'server_error', 'x').isRetryable()).toBe(true);
    expect(new AIProviderError('openai', 'network', 'x').isRetryable()).toBe(true);
    expect(new AIProviderError('openai', 'malformed_response', 'x').isRetryable()).toBe(true);
  });

  it('keeps same-provider retry classification separate from failover eligibility', () => {
    expect(new AIProviderError('openai', 'auth', 'x').isRetryable()).toBe(false);
    expect(new AIProviderError('openai', 'bad_request', 'x').isRetryable()).toBe(false);
    expect(new AIProviderError('openai', 'unknown', 'x').isRetryable()).toBe(false);
    expect(new AIProviderError('openai', 'auth', 'x').isFailoverEligible()).toBe(true);
    expect(new AIProviderError('openai', 'bad_request', 'x').isFailoverEligible()).toBe(true);
  });
});
