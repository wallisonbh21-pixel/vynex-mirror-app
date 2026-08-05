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

  updateParticipantStatus: async (meetingId: string, userId: string, status: ParticipantStatus) => {
    const { data, error } = await supabase
      .from("meeting_participants")
      .update({ invitation_status: status })
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
