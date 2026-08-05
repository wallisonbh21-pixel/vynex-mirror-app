import { supabase } from "@/integrations/supabase/client";
import { Meeting, MeetingParticipant, MeetingType, MeetingStatus, ParticipantStatus } from "./types";

export const meetingMutations = {
  create: async (meeting: Omit<Meeting, "id" | "created_at" | "updated_at" | "meeting_link">, participants: { user_id: string; participant_type: string }[]) => {
    const { data: newMeeting, error: meetingError } = await supabase
      .from("meetings")
      .insert([meeting])
      .select()
      .single();

    if (meetingError) throw meetingError;

    if (participants.length > 0) {
      const participantsData = participants.map(p => ({
        meeting_id: newMeeting.id,
        user_id: p.user_id,
        participant_type: p.participant_type,
        invitation_status: 'PENDING' as ParticipantStatus
      }));

      const { error: participantsError } = await supabase
        .from("meeting_participants")
        .insert(participantsData);

      if (participantsError) throw participantsError;
    }

    return newMeeting;
  },

  update: async (id: string, updates: Partial<Meeting>) => {
    const { data, error } = await supabase
      .from("meetings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  startMeeting: async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .update({ 
        status: "LIVE" as MeetingStatus,
        started_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  completeMeeting: async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .update({ 
        status: "COMPLETED" as MeetingStatus,
        ended_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  cancel: async (id: string) => {
    const { data, error } = await supabase
      .from("meetings")
      .update({ 
        status: "CANCELLED" as MeetingStatus,
        cancelled_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateParticipantPresence: async (meetingId: string, userId: string, type: 'join' | 'leave') => {
    const updates = type === 'join' 
      ? { joined_at: new Date().toISOString() } 
      : { left_at: new Date().toISOString() };
      
    const { data, error } = await supabase
      .from("meeting_participants")
      .update(updates)
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  sendMessage: async (message: { meeting_id: string; sender_id: string; message: string }) => {
    const { data, error } = await (supabase.from("meeting_messages" as any) as any)
      .insert([message])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  saveNote: async (note: { meeting_id: string; author_id: string; content: string; is_public?: boolean }) => {
    const { data, error } = await (supabase.from("meeting_notes" as any) as any)
      .insert([note])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
