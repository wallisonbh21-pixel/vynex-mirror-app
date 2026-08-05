import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudioData, StudioSection, StudioDesignSystem } from '@/types/studio';

const DEFAULT_DATA: StudioData = {
  design_system: {
    colors: {
      primary: '#3B82F6',
      secondary: '#1E293B',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      border: '#E2E8F0',
      text: '#0F172A',
      textSecondary: '#64748B'
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      headingWeight: '700',
      bodyWeight: '400'
    },
    buttons: {
      style: 'solid',
      borderRadius: '0.5rem',
      shadow: 'sm',
      size: 'md'
    },
    cards: {
      borderRadius: '0.75rem',
      shadow: 'sm',
      border: true
    }
  },
  sections: []
};

export function useStudioData(projectId: string) {
  return useQuery({
    queryKey: ['studio-data', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_studio_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return DEFAULT_DATA;
      
      // Map database flat structure to StudioData object
      return {
        design_system: (data.design_system as unknown as StudioDesignSystem) || DEFAULT_DATA.design_system,
        sections: (data.sections as unknown as StudioSection[]) || DEFAULT_DATA.sections
      };
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
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['studio-data', variables.projectId], data);
    }
  });
}
