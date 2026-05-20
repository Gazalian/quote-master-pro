/**
 * Provider factory.  Reads AI_PROVIDER_PRIMARY / AI_PROVIDER_FALLBACK at
 * import time and returns the ordered provider chain.
 *
 * Test seam: getProviderChain() can be overridden with setProviderChainForTests
 * so unit tests can inject fakes without hitting real SDKs.  Production paths
 * never touch the override.
 */

import { env } from '../../config/env.js';
import { OpenAIProvider } from './openai.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import type { AIProvider, ProviderName } from './types.js';

function build(name: ProviderName): AIProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
  }
}

let cachedChain: AIProvider[] | null = null;
let testOverride: AIProvider[] | null = null;

export function getProviderChain(): AIProvider[] {
  if (testOverride) return testOverride;
  if (cachedChain) return cachedChain;
  // The env superRefine guarantees PRIMARY !== FALLBACK and both keys exist.
  cachedChain = [build(env.AI_PROVIDER_PRIMARY), build(env.AI_PROVIDER_FALLBACK)];
  return cachedChain;
}

/** Tests only. Pass `null` to restore the real chain. */
export function setProviderChainForTests(chain: AIProvider[] | null): void {
  testOverride = chain;
}
