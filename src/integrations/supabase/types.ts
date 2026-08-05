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
      leads: {
        Row: {
          address: string | null
          city: string | null
          closed_at: string | null
          closed_value: number
          company: string | null
          created_at: string
          email: string | null
          estimated_value: number
          google_maps_url: string | null
          id: string
          instagram: string | null
          lat: number | null
          lon: number | null
          name: string
          next_contact_at: string | null
          niche: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          source: string | null
          state: string | null
          status: string
          trade_name: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closed_at?: string | null
          closed_value?: number
          company?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          name: string
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_id: string
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closed_at?: string | null
          closed_value?: number
          company?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          name?: string
          next_contact_at?: string | null
          niche?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          source?: string | null
          state?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "criador" | "diretor" | "rh"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "vendedor", "criador", "diretor", "rh"],
    },
  },
} as const
