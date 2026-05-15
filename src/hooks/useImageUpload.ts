import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface UploadedImage {
  path: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Upload a compressed chat image to the backend and get back a permanent
 * Supabase Storage URL. The chat composer already runs canvas compression
 * before calling this, so the payload is tens of KB rather than MBs.
 */
export function useUploadChatImage() {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      sessionId: string | null;
    }): Promise<UploadedImage> => {
      const dataBase64 = await fileToBase64(input.file);
      return api.post<UploadedImage>('/api/uploads/chat-image', {
        mimeType: input.file.type,
        dataBase64,
        sessionId: input.sessionId,
      });
    },
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      // Strip the `data:image/jpeg;base64,` prefix; backend expects raw base64
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
