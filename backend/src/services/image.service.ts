/**
 * Chat image uploads → Supabase Storage.
 *
 * We use the service-role client to upload so we can stream the request
 * directly without an extra round-trip through PostgREST. RLS on the bucket
 * still applies because the path includes the caller's userId — but more
 * importantly, this route only runs after requireAuth, so the userId is
 * server-verified before we touch storage.
 *
 * Path convention:  <user_id>/<session_id>/<random-uuid>.<ext>
 * Public URL form:  <SUPABASE_URL>/storage/v1/object/public/chat-images/<path>
 */

import { supabaseService } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BUCKET = 'chat-images';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export interface UploadedImage {
  path: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadChatImage(opts: {
  userId: string;
  sessionId: string | null;
  mimeType: string;
  bytes: Buffer;
}): Promise<UploadedImage> {
  const ext = MIME_TO_EXT[opts.mimeType.toLowerCase()];
  if (!ext) {
    throw new ApiError(415, `Unsupported image type: ${opts.mimeType}`);
  }
  // Defense-in-depth — the bucket itself also has a 5 MB cap.
  if (opts.bytes.length > 5 * 1024 * 1024) {
    throw new ApiError(413, 'Image too large (max 5 MB)');
  }

  // The first folder segment must equal auth.uid() for the storage RLS
  // policy to accept the upload. Session id is the second segment so we
  // can later prune images per session if we want to.
  const session = opts.sessionId ?? 'no-session';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${opts.userId}/${session}/${filename}`;

  const { error } = await supabaseService.storage
    .from(BUCKET)
    .upload(path, opts.bytes, {
      contentType: opts.mimeType,
      cacheControl: '31536000', // 1 year — content is immutable per uuid path
      upsert: false,
    });

  if (error) {
    logger.error({ userId: opts.userId, err: error.message }, 'image upload failed');
    throw new ApiError(500, `upload failed: ${error.message}`);
  }

  // Bucket is public-read, so the public URL is stable + cache-friendly.
  const { data } = supabaseService.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  logger.info(
    { userId: opts.userId, path, sizeBytes: opts.bytes.length },
    'chat image uploaded',
  );

  return {
    path,
    url,
    mimeType: opts.mimeType,
    sizeBytes: opts.bytes.length,
  };
}

/**
 * Soft-deletes by path. Currently unused; useful when we add chat deletion.
 */
export async function deleteChatImage(path: string): Promise<void> {
  const { error } = await supabaseService.storage.from(BUCKET).remove([path]);
  if (error) logger.warn({ err: error.message, path }, 'image delete failed');
}

// Re-export for tests / callers that want to know the bucket name without
// touching the env or hard-coding.
export const CHAT_IMAGES_BUCKET = BUCKET;
export const CHAT_IMAGES_PUBLIC_PREFIX = `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
