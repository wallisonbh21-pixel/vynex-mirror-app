import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingParticipant, MeetingWithParticipants } from "./types";

export const meetingQueries = {
  list: async () => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(*)
      `)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data as MeetingWithParticipants[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as MeetingWithParticipants;
  },

  listByProject: async (projectId: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(*)
      `)
      .eq("project_id", projectId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data as MeetingWithParticipants[];
  },

  listByClient: async (clientId: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(*)
      `)
      .eq("client_id", clientId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data as MeetingWithParticipants[];
  }
};
