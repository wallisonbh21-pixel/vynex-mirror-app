import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudioData, StudioSection, StudioDesignSystem } from '@/types/studio';
import { LibraryItem } from '@/types/studio-v2';

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

export function useStudioData(projectId: string, clientToken?: string) {
  return useQuery({
    queryKey: ['studio-data', projectId, clientToken],
    queryFn: async () => {
      if (clientToken) {
        // Use stateless RPC for public access
        const { data, error } = await supabase
          .rpc('get_project_studio_data_public', { 
            p_project_id: projectId, 
            p_client_token: clientToken 
          });
        
        if (error) throw error;
        if (!data || !Array.isArray(data) || data.length === 0) return DEFAULT_DATA;
        
        const first = data[0];
        if (!first) return DEFAULT_DATA;
        
        return {
          design_system: (first.design_system as unknown as StudioDesignSystem) || DEFAULT_DATA.design_system,
          sections: (first.sections as unknown as StudioSection[]) || DEFAULT_DATA.sections
        };
      }

      // Standard authenticated access
      const { data, error } = await supabase
        .from('project_studio_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return DEFAULT_DATA;
      
      return {
        design_system: (data.design_system as unknown as StudioDesignSystem) || DEFAULT_DATA.design_system,
        sections: (data.sections as unknown as StudioSection[]) || DEFAULT_DATA.sections
      };
    }
  });
}

export function useSaveStudioData() {
  const queryCliente = useQueryClient();
  
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
      return data;
    },
    onSuccess: (data, variables) => {
      queryCliente.setQueryData(['studio-data', variables.projectId], data);
    }
  });
}

// Favorites Hooks
export function useStudioFavorites() {
  return useQuery({
    queryKey: ['studio-favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_favorites')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });
}

export function useToggleFavorite() {
  const queryCliente = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, itemType, isFavorite }: { itemId: string; itemType: string; isFavorite: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      if (isFavorite) {
        const { error } = await supabase
          .from('studio_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('studio_favorites')
          .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ['studio-favorites'] });
    }
  });
}

// User Templates Hooks
export function useUserTemplates() {
  return useQuery({
    queryKey: ['studio-user-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_user_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useSaveUserTemplate() {
  const queryCliente = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<LibraryItem, 'id' | 'type'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('studio_user_templates')
        .insert({
          creator_id: user.id,
          name: template.name,
          description: template.description || null,
          category: template.category,
          niche: template.niche || null,
          structure: template.structure as any,
          preview_url: template.preview || null,
          tags: template.tags || null

        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryCliente.invalidateQueries({ queryKey: ['studio-user-templates'] });
    }
  });
}

// ===== Publicação versionada =====
export function useProjectSite(projectId: string) {
  return useQuery({
    queryKey: ['project-site', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_sites')
        .select('id, slug, status, current_version_id, project_site_versions!project_site_versions_site_id_fkey(version_number, published_at)')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePublishSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, slug }: { projectId: string; slug: string }) => {
      const { data, error } = await supabase.rpc('publish_project_site', { p_project_id: projectId, p_slug: slug });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { slug: string; version_number: number; version_id: string };
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['project-site', v.projectId] }),
  });
}

export function slugify(input: string) {
  return input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
