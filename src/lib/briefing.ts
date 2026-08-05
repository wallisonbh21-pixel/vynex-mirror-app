import { supabase } from "@/integrations/supabase/client";

export type BriefingData = {
  businessName: string;
  niche: string;
  description: string;
  objectives: string[];
  audience: {
    target: string;
    age: string;
    location: string;
    profile: string;
    needs: string;
    problems: string;
    feeling: string;
  };
  differentiators: string[];
  contentAssets: string[];
  brandIdentity: {
    hasIdentity: boolean;
    logo: boolean;
    colors: string;
    secondaryColors: string;
    font: string;
    references: string;
    manualUrl: string;
  };
  visualStyle: string[];
  references: {
    links: string;
    avoid: string;
    requirements: string;
    notes: string;
  };
};

export async function saveBriefing(projectId: string, data: BriefingData) {
  const { error } = await supabase
    .from('project_briefings')
    .upsert({
      project_id: projectId,
      data: data as any
    });
  if (error) throw error;
}

export async function getBriefing(projectId: string) {
  const { data, error } = await supabase
    .from('project_briefings')
    .select('data')
    .eq('project_id', projectId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data?.data as BriefingData | null;
}
