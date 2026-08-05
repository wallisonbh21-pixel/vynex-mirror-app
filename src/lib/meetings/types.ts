import { Database } from "@/integrations/supabase/types";

export type MeetingType = Database["public"]["Enums"]["meeting_type"];
export type MeetingStatus = Database["public"]["Enums"]["meeting_status"];
export type ParticipantStatus = Database["public"]["Enums"]["meeting_participant_status"];

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingParticipant = Database["public"]["Tables"]["meeting_participants"]["Row"];

export type MeetingWithParticipants = Meeting & {
  participants: MeetingParticipant[];
};
