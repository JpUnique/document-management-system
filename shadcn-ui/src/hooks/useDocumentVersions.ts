import { useState, useEffect } from 'react';
import { supabase, DocumentVersion } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

export function useDocumentVersions(documentId: string) {
  const { user } = useSupabaseAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadVersion = async (file: File) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Get next version number
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Upload file to Supabase Storage
      const filePath = `${documentId}/${nextVersion}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create version record
      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update document's current_version_id
      await supabase
        .from('documents')
        .update({ current_version_id: data.id })
        .eq('id', documentId);

      await fetchVersions();
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { data: null, error: message };
    }
  };

  const downloadVersion = async (versionId: string) => {
    try {
      const version = versions.find((v) => v.id === versionId);
      if (!version) throw new Error('Version not found');

      const { data, error } = await supabase.storage
        .from('documents')
        .download(version.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { error: message };
    }
  };

  return {
    versions,
    loading,
    uploadVersion,
    downloadVersion,
    refreshVersions: fetchVersions,
  };
}