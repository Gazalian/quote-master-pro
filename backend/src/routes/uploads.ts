/**
 * Image upload routes. Multipart for direct file upload; JSON base64 fallback
 * for clients that find multipart awkward (notably the existing chat flow
 * which already compresses to base64 in the browser).
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { uploadChatImage } from '../services/image.service.js';
import { ApiError } from '../middleware/error.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// ── JSON variant: { mimeType, dataBase64, sessionId? } ───────────────────────
// Used by the chat composer which already runs compression in a canvas and
// has the base64 bytes in hand. One extra round-trip avoided vs. multipart.
const jsonBody = z.object({
  mimeType: z.string().min(3).max(64),
  dataBase64: z.string().min(16),
  sessionId: z.string().uuid().nullable().optional(),
});

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart only for this route group so the rest of the API keeps
  // the standard 12 MB JSON limit.
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  });

  // ── JSON upload (preferred for chat compressor flow) ──────────────────────
  app.post('/api/uploads/chat-image', { preHandler: requireAuth }, async (req) => {
    const body = jsonBody.parse(req.body);
    const bytes = Buffer.from(body.dataBase64, 'base64');
    if (bytes.length === 0) throw new ApiError(400, 'empty image payload');
    if (bytes.length > MAX_UPLOAD_BYTES) throw new ApiError(413, 'image too large');

    return await uploadChatImage({
      userId: req.user!.id,
      sessionId: body.sessionId ?? null,
      mimeType: body.mimeType,
      bytes,
    });
  });

  // ── Multipart upload (file from <input type=file>, mobile camera capture) ─
  app.post('/api/uploads/chat-image/multipart', { preHandler: requireAuth }, async (req) => {
    const part = await req.file();
    if (!part) throw new ApiError(400, 'no file in request');

    // Stream the file into memory. The multipart plugin enforces fileSize.
    const chunks: Buffer[] = [];
    for await (const chunk of part.file) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);

    if (part.file.truncated) throw new ApiError(413, 'image too large');
    if (bytes.length === 0) throw new ApiError(400, 'empty upload');

    const sessionIdRaw =
      typeof (part.fields?.sessionId as any)?.value === 'string'
        ? (part.fields!.sessionId as any).value
        : null;
    const sessionId = sessionIdRaw && /^[0-9a-f-]{36}$/i.test(sessionIdRaw) ? sessionIdRaw : null;

    return await uploadChatImage({
      userId: req.user!.id,
      sessionId,
      mimeType: part.mimetype,
      bytes,
    });
  });
}
