export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      client_charge_events: {
        Row: {
          actor_id: string | null
          amount: number | null
          charge_id: string
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json | null
          to_status: string | null
        }
        Insert: {
          actor_id?: string | null
          amount?: number | null
          charge_id: string
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status?: string | null
        }
        Update: {
          actor_id?: string | null
          amount?: number | null
          charge_id?: string
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_charge_events_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "client_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      client_charges: {
        Row: {
          amount: number
          charge_type: string
          checkout_url: string | null
          client_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_provider: string | null
          pix_code: string | null
          pix_qr_code: string | null
          project_id: string | null
          provider_charge_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          charge_type?: string
          checkout_url?: string | null
          client_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          project_id?: string | null
          provider_charge_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          charge_type?: string
          checkout_url?: string | null
          client_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          pix_code?: string | null
          pix_qr_code?: string | null
          project_id?: string | null
          provider_charge_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_charges_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_charges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          company: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          monthly_fee: number
          niche: string | null
          notes: string | null
          owner_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          company: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          niche?: string | null
          notes?: string | null
          owner_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          company?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          niche?: string | null
          notes?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          monthly_fee: number
          notes: string | null
          owner_id: string
          proposal_id: string | null
          signed_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          notes?: string | null
          owner_id: string
          proposal_id?: string | null
          signed_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          notes?: string | null
          owner_id?: string
          proposal_id?: string | null
          signed_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          month: string
          revenue_target: number
          sales_target: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          revenue_target?: number
          sales_target?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          revenue_target?: number
          sales_target?: number
          user_id?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          description: string
          happened_at: string
          id: string
          lead_id: string
          next_contact_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          happened_at?: string
          id?: string
          lead_id: string
          next_contact_at?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          happened_at?: string
          id?: string
          lead_id?: string
          next_contact_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attribution: {
        Row: {
          attributed_at: string
          current_responsible_id: string | null
          id: string
          lead_id: string
          originator_id: string | null
          referral_token_id: string | null
          updated_at: string
        }
        Insert: {
          attributed_at?: string
          current_responsible_id?: string | null
          id?: string
          lead_id: string
          originator_id?: string | null
          referral_token_id?: string | null
          updated_at?: string
        }
        Update: {
          attributed_at?: string
          current_responsible_id?: string | null
          id?: string
          lead_id?: string
          originator_id?: string | null
          referral_token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attribution_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_referral_token_id_fkey"
            columns: ["referral_token_id"]
            isOneToOne: false
            referencedRelation: "referral_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          closed_at: string | null
          closed_value: number | null
          company: string | null
          created_at: string | null
          email: string | null
          estimated_value: number | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          lat: number | null
          lon: number | null
          name: string | null
          next_contact_at: string | null
          niche: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          source: string | null
          state: string | null
          status: string | null
          trade_name: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closed_at?: string | null
          closed_value?: number | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          name?: string | null
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closed_at?: string | null
          closed_value?: number | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          name?: string | null
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      meeting_messages: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          message: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          message: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          message?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_public: boolean | null
          meeting_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          meeting_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          meeting_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          invitation_status: Database["public"]["Enums"]["meeting_participant_status"]
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          participant_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["meeting_participant_status"]
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          participant_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["meeting_participant_status"]
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          participant_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          cancelled_at: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          meeting_action_items: Json | null
          meeting_link: string | null
          meeting_notes: string | null
          meeting_summary: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          project_id: string | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          meeting_action_items?: Json | null
          meeting_link?: string | null
          meeting_notes?: string | null
          meeting_summary?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          project_id?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          meeting_action_items?: Json | null
          meeting_link?: string | null
          meeting_notes?: string | null
          meeting_summary?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          project_id?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexusbuild_build_operations: {
        Row: {
          conversation_id: string | null
          created_at: string
          detail: string | null
          duration_ms: number | null
          id: string
          operation_type: string
          params: Json
          project_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          detail?: string | null
          duration_ms?: number | null
          id?: string
          operation_type: string
          params?: Json
          project_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          detail?: string | null
          duration_ms?: number | null
          id?: string
          operation_type?: string
          params?: Json
          project_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      nexusbuild_conversations: {
        Row: {
          archived: boolean
          context: Json
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          context?: Json
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          context?: Json
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nexusbuild_memories: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          kind: string
          project_id: string | null
          relevance: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          kind?: string
          project_id?: string | null
          relevance?: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          project_id?: string | null
          relevance?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexusbuild_memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nexusbuild_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexusbuild_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nexusbuild_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexusbuild_tool_runs: {
        Row: {
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          id: string
          status: string
          summary: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          status?: string
          summary?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          status?: string
          summary?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexusbuild_tool_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nexusbuild_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nexusbuild_web_researches: {
        Row: {
          conversation_id: string
          created_at: string
          duration_ms: number
          id: string
          objective: string
          project_id: string | null
          query: string
          result_summary: string | null
          sources: Json
          status: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          duration_ms?: number
          id?: string
          objective: string
          project_id?: string | null
          query: string
          result_summary?: string | null
          sources?: Json
          status?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          duration_ms?: number
          id?: string
          objective?: string
          project_id?: string | null
          query?: string
          result_summary?: string | null
          sources?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexusbuild_web_researches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nexusbuild_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexusbuild_web_researches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          project_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          project_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          project_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          commission_rate: number
          created_at: string
          full_name: string
          id: string
          nickname: string | null
          phone: string | null
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number
          created_at?: string
          full_name?: string
          id: string
          nickname?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number
          created_at?: string
          full_name?: string
          id?: string
          nickname?: string | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_approval_events: {
        Row: {
          actor_id: string | null
          actor_label: string
          created_at: string
          event_type: string
          id: string
          message: string | null
          new_status: string | null
          previous_status: string | null
          project_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          new_status?: string | null
          previous_status?: string | null
          project_id: string
        }
        Update: {
          actor_id?: string | null
          actor_label?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          new_status?: string | null
          previous_status?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_approval_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          project_id: string | null
          size: number | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          project_id?: string | null
          size?: number | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          project_id?: string | null
          size?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_briefings: {
        Row: {
          created_at: string
          data: Json
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_checklist_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          project_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          project_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          project_id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          project_id: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          project_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_document_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_document_events: {
        Row: {
          actor_id: string | null
          created_at: string
          detail: Json
          document_id: string | null
          event: string
          id: string
          project_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          document_id?: string | null
          event: string
          id?: string
          project_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          document_id?: string | null
          event?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_document_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          category: string
          checksum: string | null
          created_at: string
          error_message: string | null
          extension: string | null
          extracted_text: string | null
          extraction_status: string
          file_path: string
          id: string
          mime_type: string | null
          name: string
          original_name: string | null
          processed_at: string | null
          project_id: string
          safe_name: string | null
          size_bytes: number | null
          status: string
          updated_at: string
          uploaded_by: string
          version: number
        }
        Insert: {
          category?: string
          checksum?: string | null
          created_at?: string
          error_message?: string | null
          extension?: string | null
          extracted_text?: string | null
          extraction_status?: string
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          original_name?: string | null
          processed_at?: string | null
          project_id: string
          safe_name?: string | null
          size_bytes?: number | null
          status?: string
          updated_at?: string
          uploaded_by: string
          version?: number
        }
        Update: {
          category?: string
          checksum?: string | null
          created_at?: string
          error_message?: string | null
          extension?: string | null
          extracted_text?: string | null
          extraction_status?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          original_name?: string | null
          processed_at?: string | null
          project_id?: string
          safe_name?: string | null
          size_bytes?: number | null
          status?: string
          updated_at?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_site_plans: {
        Row: {
          completion: number | null
          created_at: string
          id: string
          primary_cta: string | null
          project_id: string
          sections: Json
          status: string | null
          strategy: Json
          updated_at: string
          visual_direction: string | null
        }
        Insert: {
          completion?: number | null
          created_at?: string
          id?: string
          primary_cta?: string | null
          project_id: string
          sections?: Json
          status?: string | null
          strategy?: Json
          updated_at?: string
          visual_direction?: string | null
        }
        Update: {
          completion?: number | null
          created_at?: string
          id?: string
          primary_cta?: string | null
          project_id?: string
          sections?: Json
          status?: string | null
          strategy?: Json
          updated_at?: string
          visual_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_site_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_site_versions: {
        Row: {
          design_system: Json
          id: string
          project_id: string
          published_at: string
          published_by: string
          sections: Json
          site_id: string
          site_title: string | null
          status: string
          version_number: number
        }
        Insert: {
          design_system: Json
          id?: string
          project_id: string
          published_at?: string
          published_by: string
          sections: Json
          site_id: string
          site_title?: string | null
          status?: string
          version_number: number
        }
        Update: {
          design_system?: Json
          id?: string
          project_id?: string
          published_at?: string
          published_by?: string
          sections?: Json
          site_id?: string
          site_title?: string | null
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_site_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_site_versions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sites: {
        Row: {
          created_at: string
          created_by: string
          current_version_id: string | null
          id: string
          project_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_version_id?: string | null
          id?: string
          project_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          id?: string
          project_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sites_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "project_site_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_studio_data: {
        Row: {
          created_at: string | null
          design_system: Json | null
          history: Json | null
          id: string
          last_saved_at: string | null
          project_id: string
          sections: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          design_system?: Json | null
          history?: Json | null
          id?: string
          last_saved_at?: string | null
          project_id: string
          sections?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          design_system?: Json | null
          history?: Json | null
          id?: string
          last_saved_at?: string | null
          project_id?: string
          sections?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_studio_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_visual_assets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          conversation_id: string | null
          created_at: string
          created_by: string
          delegated_by: string | null
          document_id: string | null
          file_path: string
          generation_id: string | null
          id: string
          kind: string
          mime_type: string
          origin: string
          parent_asset_id: string | null
          project_id: string
          prompt: string | null
          purpose: string
          size_bytes: number | null
          specialist_id: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
          use_in_builder: boolean
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by: string
          delegated_by?: string | null
          document_id?: string | null
          file_path: string
          generation_id?: string | null
          id?: string
          kind?: string
          mime_type?: string
          origin?: string
          parent_asset_id?: string | null
          project_id: string
          prompt?: string | null
          purpose?: string
          size_bytes?: number | null
          specialist_id?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
          use_in_builder?: boolean
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string
          delegated_by?: string | null
          document_id?: string | null
          file_path?: string
          generation_id?: string | null
          id?: string
          kind?: string
          mime_type?: string
          origin?: string
          parent_asset_id?: string | null
          project_id?: string
          prompt?: string | null
          purpose?: string
          size_bytes?: number | null
          specialist_id?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          use_in_builder?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_visual_assets_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_assets_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "project_visual_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "project_visual_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_visual_generations: {
        Row: {
          aspect_ratio: string
          conversation_id: string | null
          created_at: string
          delegated_by: string | null
          error_message: string | null
          estimated_cost: number | null
          external_id: string | null
          generated_count: number
          id: string
          model: string
          parent_asset_id: string | null
          project_id: string
          prompt: string
          provider: string
          purpose: string
          reference_asset_id: string | null
          requested_count: number
          specialist_id: string | null
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          conversation_id?: string | null
          created_at?: string
          delegated_by?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          external_id?: string | null
          generated_count?: number
          id?: string
          model: string
          parent_asset_id?: string | null
          project_id: string
          prompt: string
          provider?: string
          purpose?: string
          reference_asset_id?: string | null
          requested_count?: number
          specialist_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          conversation_id?: string | null
          created_at?: string
          delegated_by?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          external_id?: string | null
          generated_count?: number
          id?: string
          model?: string
          parent_asset_id?: string | null
          project_id?: string
          prompt?: string
          provider?: string
          purpose?: string
          reference_asset_id?: string | null
          requested_count?: number
          specialist_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_visual_generations_parent_fk"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "project_visual_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_visual_generations_reference_fk"
            columns: ["reference_asset_id"]
            isOneToOne: false
            referencedRelation: "project_visual_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approved_to_client_at: string | null
          approved_to_client_by: string | null
          assigned_at: string | null
          client_approved_at: string | null
          client_id: string | null
          client_token: string | null
          client_token_expires_at: string | null
          commission: number
          commission_rate: number
          commission_status: string
          contract_id: string | null
          created_at: string
          creator_id: string | null
          delivered_at: string | null
          delivery_link: string | null
          delivery_notes: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string
          site_type: string | null
          status: string
          submitted_at: string | null
          template_id: string | null
          template_selected_at: string | null
          template_selected_by: string | null
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          approved_to_client_at?: string | null
          approved_to_client_by?: string | null
          assigned_at?: string | null
          client_approved_at?: string | null
          client_id?: string | null
          client_token?: string | null
          client_token_expires_at?: string | null
          commission?: number
          commission_rate?: number
          commission_status?: string
          contract_id?: string | null
          created_at?: string
          creator_id?: string | null
          delivered_at?: string | null
          delivery_link?: string | null
          delivery_notes?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id: string
          site_type?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          template_selected_at?: string | null
          template_selected_by?: string | null
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          approved_to_client_at?: string | null
          approved_to_client_by?: string | null
          assigned_at?: string | null
          client_approved_at?: string | null
          client_id?: string | null
          client_token?: string | null
          client_token_expires_at?: string | null
          commission?: number
          commission_rate?: number
          commission_status?: string
          contract_id?: string | null
          created_at?: string
          creator_id?: string | null
          delivered_at?: string | null
          delivery_link?: string | null
          delivery_notes?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string
          site_type?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          template_selected_at?: string | null
          template_selected_by?: string | null
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          amount: number
          created_at: string
          deadline_days: number
          description: string | null
          id: string
          lead_id: string | null
          monthly_fee: number
          notes: string | null
          owner_id: string
          sent_at: string | null
          services: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          deadline_days?: number
          description?: string | null
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          notes?: string | null
          owner_id: string
          sent_at?: string | null
          services?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deadline_days?: number
          description?: string | null
          id?: string
          lead_id?: string | null
          monthly_fee?: number
          notes?: string | null
          owner_id?: string
          sent_at?: string | null
          services?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_opportunities: {
        Row: {
          address: string | null
          assigned_to: string | null
          business_name: string
          category: string | null
          city: string | null
          created_at: string
          created_by: string
          email: string | null
          facebook: string | null
          google_maps_url: string | null
          has_social_media: boolean
          has_website: boolean
          id: string
          instagram: string | null
          lat: number | null
          lead_id: string | null
          lon: number | null
          notes: string | null
          opportunity_level: string
          phone: string | null
          place_id: string | null
          rating: number | null
          removed_at: string | null
          review_count: number
          source: string
          state: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          business_name: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          has_social_media?: boolean
          has_website?: boolean
          id?: string
          instagram?: string | null
          lat?: number | null
          lead_id?: string | null
          lon?: number | null
          notes?: string | null
          opportunity_level?: string
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          removed_at?: string | null
          review_count?: number
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          business_name?: string
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          has_social_media?: boolean
          has_website?: boolean
          id?: string
          instagram?: string | null
          lat?: number | null
          lead_id?: string | null
          lon?: number | null
          notes?: string | null
          opportunity_level?: string
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          removed_at?: string | null
          review_count?: number
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string | null
          new_status: string
          opportunity_id: string
          previous_status: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          new_status: string
          opportunity_id: string
          previous_status?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          new_status?: string
          opportunity_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_status_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "prospecting_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_institutional: boolean | null
          seller_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_institutional?: boolean | null
          seller_id?: string | null
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_institutional?: boolean | null
          seller_id?: string | null
          token?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          additional_config: Json | null
          billing_cycle: string | null
          briefing_questions: Json | null
          category: string
          created_at: string
          creation_price: number | null
          creator_remuneration: number | null
          description: string | null
          id: string
          is_active: boolean | null
          monthly_price: number | null
          name: string
          seller_commission_rate: number | null
          setup_price: number | null
          traffic_manager_remuneration: number | null
          updated_at: string
        }
        Insert: {
          additional_config?: Json | null
          billing_cycle?: string | null
          briefing_questions?: Json | null
          category: string
          created_at?: string
          creation_price?: number | null
          creator_remuneration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          name: string
          seller_commission_rate?: number | null
          setup_price?: number | null
          traffic_manager_remuneration?: number | null
          updated_at?: string
        }
        Update: {
          additional_config?: Json | null
          billing_cycle?: string | null
          briefing_questions?: Json | null
          category?: string
          created_at?: string
          creation_price?: number | null
          creator_remuneration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number | null
          name?: string
          seller_commission_rate?: number | null
          setup_price?: number | null
          traffic_manager_remuneration?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_template_settings: {
        Row: {
          available_for_clients: boolean
          available_for_creators: boolean
          display_order: number
          featured: boolean
          status: string
          template_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_for_clients?: boolean
          available_for_creators?: boolean
          display_order?: number
          featured?: boolean
          status?: string
          template_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_for_clients?: boolean
          available_for_creators?: boolean
          display_order?: number
          featured?: boolean
          status?: string
          template_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      studio_favorites: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      studio_user_templates: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          name: string
          niche: string | null
          preview_url: string | null
          structure: Json
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          name: string
          niche?: string | null
          preview_url?: string | null
          structure: Json
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          niche?: string | null
          preview_url?: string | null
          structure?: Json
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          occurred_at: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          external_message_id: string | null
          id: string
          message: string
          notification_type: string
          phone: string
          project_id: string | null
          send_status: string
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          message: string
          notification_type?: string
          phone: string
          project_id?: string | null
          send_status?: string
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          message?: string
          notification_type?: string
          phone?: string
          project_id?: string | null
          send_status?: string
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          pix_key: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      project_document_usage: {
        Row: {
          file_count: number | null
          project_id: string | null
          total_bytes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      can_use_nexusbuild: { Args: { _user_id: string }; Returns: boolean }
      claim_project: {
        Args: { _project_id: string }
        Returns: {
          approved_to_client_at: string | null
          approved_to_client_by: string | null
          assigned_at: string | null
          client_approved_at: string | null
          client_id: string | null
          client_token: string | null
          client_token_expires_at: string | null
          commission: number
          commission_rate: number
          commission_status: string
          contract_id: string | null
          created_at: string
          creator_id: string | null
          delivered_at: string | null
          delivery_link: string | null
          delivery_notes: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string
          site_type: string | null
          status: string
          submitted_at: string | null
          template_id: string | null
          template_selected_at: string | null
          template_selected_by: string | null
          title: string
          updated_at: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_project_assets_public: {
        Args: { p_client_token: string; p_project_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          project_id: string
          size: number
          type: string
          url: string
        }[]
      }
      get_project_public_data: {
        Args: { p_client_token: string; p_project_id: string }
        Returns: {
          client_company: string
          client_contact_name: string
          client_id: string
          client_token_expires_at: string
          delivery_link: string
          id: string
          site_type: string
          status: string
          submitted_at: string
          title: string
        }[]
      }
      get_project_public_data_by_token: {
        Args: { p_client_token: string }
        Returns: {
          client_company: string
          client_contact_name: string
          client_id: string
          client_token_expires_at: string
          creator_id: string
          delivery_link: string
          id: string
          owner_id: string
          site_type: string
          status: string
          submitted_at: string
          title: string
        }[]
      }
      get_project_studio_data_public: {
        Args: { p_client_token: string; p_project_id: string }
        Returns: {
          design_system: Json
          id: string
          project_id: string
          sections: Json
          updated_at: string
        }[]
      }
      get_published_site: {
        Args: { p_slug: string }
        Returns: {
          design_system: Json
          published_at: string
          sections: Json
          site_title: string
          version_number: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_meeting_participant: {
        Args: { _meeting_id: string; _user_id: string }
        Returns: boolean
      }
      publish_project_site: {
        Args: { p_project_id: string; p_slug: string }
        Returns: {
          slug: string
          version_id: string
          version_number: number
        }[]
      }
      set_client_token: { Args: { token: string }; Returns: undefined }
      sn_admin_referral_stats: { Args: never; Returns: Json }
      sn_approval_view: { Args: { p_token: string }; Returns: Json }
      sn_client_approval_action: {
        Args: { p_action: string; p_message?: string; p_token: string }
        Returns: Json
      }
      sn_client_last_access: { Args: { p_client_id: string }; Returns: Json }
      sn_delete_client: { Args: { p_client_id: string }; Returns: Json }
      sn_get_referral_token: { Args: never; Returns: Json }
      sn_referral_leads: { Args: never; Returns: Json }
      sn_referral_metrics: { Args: never; Returns: Json }
      sn_register_client: {
        Args: {
          p_company?: string
          p_contact_email: string
          p_contact_name?: string
          p_contact_phone?: string
          p_notes?: string
        }
        Returns: {
          city: string | null
          company: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          monthly_fee: number
          niche: string | null
          notes: string | null
          owner_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sn_release_to_client: {
        Args: { p_project_id: string; p_whatsapp_message?: string }
        Returns: Json
      }
      sn_submit_public_lead: {
        Args: {
          p_city: string
          p_company: string
          p_details?: Json
          p_email: string
          p_name: string
          p_referral_token?: string
          p_segment: string
          p_service_id: string
          p_state: string
          p_whatsapp: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "criador" | "diretor" | "rh" | "cliente"
      meeting_participant_status:
        | "PENDING"
        | "ACCEPTED"
        | "DECLINED"
        | "REMOVED"
      meeting_status:
        | "SCHEDULED"
        | "LIVE"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      meeting_type:
        | "CLIENT"
        | "SELLER"
        | "CREATOR"
        | "TRAFFIC_MANAGER"
        | "TEAM"
        | "GENERAL"
        | "PROJECT"
        | "INTERNAL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vendedor", "criador", "diretor", "rh", "cliente"],
      meeting_participant_status: [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "REMOVED",
      ],
      meeting_status: [
        "SCHEDULED",
        "LIVE",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      meeting_type: [
        "CLIENT",
        "SELLER",
        "CREATOR",
        "TRAFFIC_MANAGER",
        "TEAM",
        "GENERAL",
        "PROJECT",
        "INTERNAL",
      ],
    },
  },
} as const
