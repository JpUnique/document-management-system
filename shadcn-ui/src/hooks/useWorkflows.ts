import { useState, useEffect } from 'react';
import { supabase, Workflow, WorkflowStep } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

export function useWorkflows(documentId: string) {
  const { user } = useSupabaseAuth();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchWorkflow();
    }
  }, [documentId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      
      // Fetch workflow
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (workflowError && workflowError.code !== 'PGRST116') throw workflowError;
      
      setWorkflow(workflowData);

      // Fetch workflow steps if workflow exists
      if (workflowData) {
        const { data: stepsData, error: stepsError } = await supabase
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', workflowData.id)
          .order('step_order', { ascending: true });

        if (stepsError) throw stepsError;
        setSteps(stepsData || []);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflowSteps: Array<{
    assigned_role: string;
    action_required: string;
  }>) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Create workflow
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          document_id: documentId,
          current_step: 1,
          status: 'PENDING',
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Create workflow steps
      const stepsToInsert = workflowSteps.map((step, index) => ({
        workflow_id: workflowData.id,
        step_order: index + 1,
        assigned_role: step.assigned_role,
        action_required: step.action_required,
        status: index === 0 ? 'PENDING' : 'WAITING',
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      await fetchWorkflow();
      return { data: workflowData, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { data: null, error: message };
    }
  };

  const approveStep = async (stepId: string, comments?: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Update step
      const { error: stepError } = await supabase
        .from('workflow_steps')
        .update({
          status: 'APPROVED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          comments,
        })
        .eq('id', stepId);

      if (stepError) throw stepError;

      // Check if this was the last step
      const currentStep = steps.find((s) => s.id === stepId);
      if (currentStep && workflow) {
        const isLastStep = currentStep.step_order === steps.length;

        if (isLastStep) {
          // Mark workflow as completed
          await supabase
            .from('workflows')
            .update({ status: 'COMPLETED' })
            .eq('id', workflow.id);

          // Update document status
          await supabase
            .from('documents')
            .update({ status: 'APPROVED' })
            .eq('id', documentId);
        } else {
          // Move to next step
          await supabase
            .from('workflows')
            .update({ current_step: currentStep.step_order + 1 })
            .eq('id', workflow.id);

          // Update next step status
          const nextStep = steps.find(
            (s) => s.step_order === currentStep.step_order + 1
          );
          if (nextStep) {
            await supabase
              .from('workflow_steps')
              .update({ status: 'PENDING' })
              .eq('id', nextStep.id);
          }
        }
      }

      await fetchWorkflow();
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { error: message };
    }
  };

  const rejectStep = async (stepId: string, comments: string) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Update step
      const { error: stepError } = await supabase
        .from('workflow_steps')
        .update({
          status: 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          comments,
        })
        .eq('id', stepId);

      if (stepError) throw stepError;

      // Mark workflow as rejected
      if (workflow) {
        await supabase
          .from('workflows')
          .update({ status: 'REJECTED' })
          .eq('id', workflow.id);

        // Update document status
        await supabase
          .from('documents')
          .update({ status: 'REJECTED' })
          .eq('id', documentId);
      }

      await fetchWorkflow();
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return { error: message };
    }
  };

  return {
    workflow,
    steps,
    loading,
    createWorkflow,
    approveStep,
    rejectStep,
    refreshWorkflow: fetchWorkflow,
  };
}