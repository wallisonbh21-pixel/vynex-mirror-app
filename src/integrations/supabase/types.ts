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
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          monthly_fee: number
          niche: string | null
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          company: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number
          niche?: string | null
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          company?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number
          niche?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          estimated_value: number
          id: string
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          commission_rate: number
          created_at: string
          full_name: string
          id: string
          phone: string | null
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          commission: number
          created_at: string
          creator_id: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string
          status: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id?: string | null
          commission?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id: string
          status?: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string | null
          commission?: number
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string
          status?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "criador"
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
      app_role: ["admin", "vendedor", "criador"],
    },
  },
} as const
