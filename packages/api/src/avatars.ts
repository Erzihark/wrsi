import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

const BUCKET = 'avatars';

export interface UploadAvatarFile {
  /** Image bytes (caller reads + decodes the picked image; keeps this platform-agnostic). */
  data: ArrayBuffer;
  /** e.g. 'image/jpeg' */
  contentType: string;
  /** File extension without the dot, e.g. 'jpg'. */
  ext: string;
}

/**
 * Upload an avatar object to the public bucket under the owner's
 * `{userId}/avatar-{timestamp}.{ext}` key (timestamp doubles as a
 * cache-buster) and return its public URL. Storage RLS: own folder or admin.
 */
async function uploadAvatarObject(
  supabase: ReturnType<typeof useSupabase>,
  userId: string,
  file: UploadAvatarFile,
): Promise<string> {
  const path = `${userId}/avatar-${Date.now()}.${file.ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.data, {
    contentType: file.contentType,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Set the signed-in student's profile photo: upload to Storage, then persist
 * the public URL on `students.photo_url` (RLS: self-update; the column is not
 * guard-restricted). If the row update fails, the uploaded object is removed
 * so Storage doesn't accumulate orphans.
 */
export function useUploadMyAvatar() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: UploadAvatarFile }) => {
      const publicUrl = await uploadAvatarObject(supabase, userId, file);
      const { error } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);
      if (error) {
        const path = publicUrl.split(`/${BUCKET}/`)[1];
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
      return publicUrl;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myStudent });
    },
  });
}

/**
 * Admin: set a counselor's photo. Uploads into the counselor's own
 * `{counselorUserId}/…` folder (allowed for admins by the bucket policy) and
 * persists the URL on `counselors.photo_url` (RLS: admin write). Invalidates
 * the shared counselors lookup base so the admin list/detail and dropdowns
 * refresh, plus the student-facing counselor card.
 */
export function useUploadCounselorPhoto() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      counselorId,
      counselorUserId,
      file,
    }: {
      counselorId: string;
      counselorUserId: string;
      file: UploadAvatarFile;
    }) => {
      const publicUrl = await uploadAvatarObject(supabase, counselorUserId, file);
      const { error } = await supabase
        .from('counselors')
        .update({ photo_url: publicUrl })
        .eq('id', counselorId);
      if (error) {
        const path = publicUrl.split(`/${BUCKET}/`)[1];
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
      return publicUrl;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.lookup('counselors') });
      void qc.invalidateQueries({ queryKey: queryKeys.myCounselor });
    },
  });
}
