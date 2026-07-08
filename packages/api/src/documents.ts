import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@wrsi/shared-types';
import { useSupabase } from './context';
import { queryKeys } from './queryKeys';

export type DocumentRow = Database['public']['Tables']['documents']['Row'];

const BUCKET = 'documents';
const ONE_HOUR = 1000 * 60 * 60;
const SIGNED_URL_TTL = 60; // seconds — long enough to open, short enough to stay private

/** Document type catalog (Transcript, Passport…), for categorizing uploads. */
export function useDocumentTypes() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.lookup('document_types'),
    staleTime: ONE_HOUR,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('id, name, required')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** A user's documents (newest first). RLS: owner / assigned counselor / admin. */
export function useDocuments(userId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.studentDocuments(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(
          'id, type_id, storage_path, original_filename, mime_type, size_bytes, created_at, document_types(name)',
        )
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export interface UploadDocumentArgs {
  /** File bytes (the caller reads + decodes the picked file; keeps this platform-agnostic). */
  data: ArrayBuffer;
  fileName: string;
  mimeType?: string | null;
  size?: number | null;
  typeId?: string | null;
}

/**
 * Upload a file to private Storage under `{userId}/…` and record a `documents`
 * row. If the metadata insert fails, the uploaded object is removed so Storage
 * doesn't accumulate orphans.
 */
export function useUploadDocument(userId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, fileName, mimeType, size, typeId }: UploadDocumentArgs) => {
      const safeName = fileName.replace(/[^\w.\-]+/g, '_');
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, data, {
        contentType: mimeType ?? 'application/octet-stream',
        upsert: false,
      });
      if (upErr) throw upErr;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from('documents').insert({
        user_id: userId,
        type_id: typeId ?? null,
        storage_path: path,
        original_filename: fileName,
        mime_type: mimeType ?? null,
        size_bytes: size ?? null,
        uploaded_by: user?.id ?? null,
      });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studentDocuments(userId) });
    },
  });
}

/** Delete a document: remove the Storage object, then the metadata row. */
export function useDeleteDocument(userId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (rmErr) throw rmErr;
      const { error: delErr } = await supabase.from('documents').delete().eq('id', id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.studentDocuments(userId) });
    },
  });
}

/** Mint a short-lived signed URL to view/download a private document object. */
export function useCreateDocumentSignedUrl() {
  const supabase = useSupabase();
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_TTL);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
