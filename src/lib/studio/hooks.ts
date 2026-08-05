import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudioData } from '@/types/studio';
import { toast } from 'sonner';

export function useStudioData(projectId: string) {
  return useQuery({
    queryKey: ['studio-data', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_studio_data')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Default initial data
        return {
          design_system: {
            colors: {
              primary: '#3B82F6',
              secondary: '#64748B',
              accent: '#10B981',
              background: '#FFFFFF',
              text: '#0F172A'
            },
            fonts: {
              heading: 'Inter',
              body: 'Inter'
            },
            spacing: 'normal',
            borderRadius: '0.75rem'
          },
          sections: []
        } as StudioData;
      }

      return data as unknown as StudioData;
    }
  });
}

export function useSaveStudioData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: StudioData }) => {
      const { error } = await supabase
        .from('project_studio_data')
        .upsert({
          project_id: projectId,
          design_system: data.design_system as any,
          sections: data.sections as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studio-data', variables.projectId] });
      toast.success('Alterações salvas!');
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar: ' + err.message);
    }
  });
}
