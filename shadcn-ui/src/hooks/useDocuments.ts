import { useState, useEffect } from 'react';
import { supabase, Document } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

export function useDocuments() {
  const { user } = useSupabaseAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (
    title: string,
    description: string,
    category: string,
    confidentialityLevel: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title,
          description,
          category,
          confidentiality_level: confidentialityLevel,
          owner_id: user?.id,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await logAudit('CREATE', 'DOCUMENT', data.id, {
        title,
        category,
        confidentiality_level: confidentialityLevel,
      });

      await fetchDocuments();
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { data: null, error: message };
    }
  };

  const updateDocument = async (
    documentId: string,
    updates: Partial<Document>
  ) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await logAudit('UPDATE', 'DOCUMENT', documentId, updates);

      await fetchDocuments();
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { data: null, error: message };
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Log audit
      await logAudit('DELETE', 'DOCUMENT', documentId, {});

      await fetchDocuments();
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { error: message };
    }
  };

  const logAudit = async (
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, unknown>
  ) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: '', // Will be populated by edge function
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}