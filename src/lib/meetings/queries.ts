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
          profiles:user_id(full_name, avatar_url)
        )
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
        participants:meeting_participants(
          *,
          profiles:user_id(full_name, avatar_url)
        ),
        project:project_id(title),
        client:client_id(name)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as MeetingWithParticipants & { 
      project?: { title: string }, 
      client?: { name: string } 
    };
  },

  getMessages: async (meetingId: string) => {
    const { data, error } = await supabase
      .from("meeting_messages")
      .select(`
        *,
        sender:sender_id(full_name, avatar_url)
      `)
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as MeetingMessage[];
  },

  getNotes: async (meetingId: string) => {
    const { data, error } = await supabase
      .from("meeting_notes")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as MeetingNote[];
  }
};
