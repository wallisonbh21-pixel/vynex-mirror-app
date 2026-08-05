import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingParticipant, MeetingWithParticipants, MeetingMessage, MeetingNote } from "./types";

export const meetingQueries = {
  list: async () => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(
          *,
          profiles:profiles!meeting_participants_user_id_fkey(full_name, avatar_url)
        )
      `)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data as any[] as MeetingWithParticipants[];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        participants:meeting_participants(
          *,
          profiles:profiles!meeting_participants_user_id_fkey(full_name, avatar_url)
        ),
        project:projects!meetings_project_id_fkey(title),
        client:clients!meetings_client_id_fkey(name:company)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as any as MeetingWithParticipants & { 
      project?: { title: string }, 
      client?: { name: string } 
    };
  },

  getMessages: async (meetingId: string) => {
    const { data, error } = await (supabase.from("meeting_messages" as any) as any)
      .select(`
        *,
        sender:profiles!meeting_messages_sender_id_fkey(full_name, avatar_url)
      `)
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as MeetingMessage[];
  },

  getNotes: async (meetingId: string) => {
    const { data, error } = await (supabase.from("meeting_notes" as any) as any)
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as MeetingNote[];
  }
};
