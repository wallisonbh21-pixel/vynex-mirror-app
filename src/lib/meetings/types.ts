import { Database } from "@/integrations/supabase/types";

export type MeetingType = Database["public"]["Enums"]["meeting_type"];
export type MeetingStatus = Database["public"]["Enums"]["meeting_status"];
export type ParticipantStatus = Database["public"]["Enums"]["meeting_participant_status"];

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingParticipant = Database["public"]["Tables"]["meeting_participants"]["Row"] & {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type MeetingMessage = {
  id: string;
  meeting_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type MeetingNote = {
  id: string;
  meeting_id: string;
  author_id: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type MeetingWithParticipants = Meeting & {
  participants: MeetingParticipant[];
};
