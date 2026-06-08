/**
 * The QuoteDraft response shape, expressed as plain JSON Schema.
 *
 * Both providers accept JSON-Schema-shaped objects (OpenAI directly via
 * Structured Outputs; Gemini via responseSchema with a tiny SDK enum mapping).
 * Keeping the canonical schema here means we can't drift between providers —
 * a field added to OpenAI's response will also be enforced on Gemini.
 *
 * Note: matches `parseQuoteDraft` in ./parse.ts.  If you add a field here,
 * read it there too.
 */
export const QUOTE_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reasoning: { type: 'string' },
    clientName: { type: 'string' },
    projectTitle: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    clarifyingQuestions: { type: 'array', items: { type: 'string' } },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                unitPrice: { type: 'number' },
                total: { type: 'number' },
                source: { type: 'string', enum: ['my_price', 'regional_price', 'ai_estimate'] },
                regionName: { type: 'string' },
              },
              required: ['name', 'quantity', 'unit', 'unitPrice', 'total', 'source'],
            },
          },
        },
        required: ['name', 'items'],
      },
    },
    grandTotal: { type: 'number' },
  },
  required: ['projectTitle', 'confidence', 'categories', 'grandTotal'],
} as const;

export const QUOTE_RESPONSE_SCHEMA_NAME = 'quote_draft';
