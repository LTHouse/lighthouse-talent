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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          admin_internal_status: string | null
          admin_notes: string | null
          batch_id: string | null
          created_at: string
          current_company: string | null
          current_location: string | null
          current_role_title: string | null
          date_applied: string | null
          declined: boolean
          education: Json
          email: string | null
          first_name: string | null
          has_startup_experience: boolean | null
          has_tech_experience: boolean | null
          id: string
          intake_source: string
          intro_requests: number
          is_demo: boolean
          last_activity: string | null
          last_name: string | null
          linkedin_data: Json | null
          linkedin_data_last_updated: string | null
          linkedin_data_source: string | null
          linkedin_id: string | null
          linkedin_refresh_priority: string
          linkedin_url: string | null
          linkedin_verified: boolean
          location: string | null
          phone: string | null
          photo_seed: number | null
          primary_role: string | null
          ranked_motivations: string[]
          relocation_status: string | null
          role_types: string[]
          startup_size: string | null
          startup_stage: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          tag: string | null
          top_motivation: string | null
          updated_at: string
          user_id: string | null
          vetted_at: string | null
          vetted_by: string | null
          vetted_in_person: boolean
          work_history: Json
          work_mode: string | null
          years_experience: number | null
        }
        Insert: {
          admin_internal_status?: string | null
          admin_notes?: string | null
          batch_id?: string | null
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role_title?: string | null
          date_applied?: string | null
          declined?: boolean
          education?: Json
          email?: string | null
          first_name?: string | null
          has_startup_experience?: boolean | null
          has_tech_experience?: boolean | null
          id?: string
          intake_source?: string
          intro_requests?: number
          is_demo?: boolean
          last_activity?: string | null
          last_name?: string | null
          linkedin_data?: Json | null
          linkedin_data_last_updated?: string | null
          linkedin_data_source?: string | null
          linkedin_id?: string | null
          linkedin_refresh_priority?: string
          linkedin_url?: string | null
          linkedin_verified?: boolean
          location?: string | null
          phone?: string | null
          photo_seed?: number | null
          primary_role?: string | null
          ranked_motivations?: string[]
          relocation_status?: string | null
          role_types?: string[]
          startup_size?: string | null
          startup_stage?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          tag?: string | null
          top_motivation?: string | null
          updated_at?: string
          user_id?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          vetted_in_person?: boolean
          work_history?: Json
          work_mode?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_internal_status?: string | null
          admin_notes?: string | null
          batch_id?: string | null
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role_title?: string | null
          date_applied?: string | null
          declined?: boolean
          education?: Json
          email?: string | null
          first_name?: string | null
          has_startup_experience?: boolean | null
          has_tech_experience?: boolean | null
          id?: string
          intake_source?: string
          intro_requests?: number
          is_demo?: boolean
          last_activity?: string | null
          last_name?: string | null
          linkedin_data?: Json | null
          linkedin_data_last_updated?: string | null
          linkedin_data_source?: string | null
          linkedin_id?: string | null
          linkedin_refresh_priority?: string
          linkedin_url?: string | null
          linkedin_verified?: boolean
          location?: string | null
          phone?: string | null
          photo_seed?: number | null
          primary_role?: string | null
          ranked_motivations?: string[]
          relocation_status?: string | null
          role_types?: string[]
          startup_size?: string | null
          startup_stage?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          tag?: string | null
          top_motivation?: string | null
          updated_at?: string
          user_id?: string | null
          vetted_at?: string | null
          vetted_by?: string | null
          vetted_in_person?: boolean
          work_history?: Json
          work_mode?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          stage: string | null
          team: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          stage?: string | null
          team?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          stage?: string | null
          team?: number | null
        }
        Relationships: []
      }
      featured_candidates: {
        Row: {
          candidate_id: string
          curator_note: string | null
          week_starting: string
        }
        Insert: {
          candidate_id: string
          curator_note?: string | null
          week_starting: string
        }
        Update: {
          candidate_id?: string
          curator_note?: string | null
          week_starting?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_candidates_week_starting_fkey"
            columns: ["week_starting"]
            isOneToOne: false
            referencedRelation: "featured_talent_weeks"
            referencedColumns: ["week_starting"]
          },
        ]
      }
      featured_talent_weeks: {
        Row: {
          created_at: string
          week_starting: string
          weekly_note: string | null
        }
        Insert: {
          created_at?: string
          week_starting: string
          weekly_note?: string | null
        }
        Update: {
          created_at?: string
          week_starting?: string
          weekly_note?: string | null
        }
        Relationships: []
      }
      intro_requests: {
        Row: {
          candidate_id: string | null
          company_id: string | null
          created_at: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intro_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_portcos: {
        Row: {
          company_name: string
          id: string
          investor_id: string | null
        }
        Insert: {
          company_name: string
          id?: string
          investor_id?: string | null
        }
        Update: {
          company_name?: string
          id?: string
          investor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_portcos_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          created_at: string
          email: string | null
          firm_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          firm_name: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          firm_name?: string
          id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          candidate_id: string | null
          id: number
          viewed_at: string
          viewer_company_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          id?: number
          viewed_at?: string
          viewer_company_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          id?: number
          viewed_at?: string
          viewer_company_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_company_id_fkey"
            columns: ["viewer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          published: boolean
          storage_path: string | null
          title: string
          type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          published?: boolean
          storage_path?: string | null
          title: string
          type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          published?: boolean
          storage_path?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          company_id: string | null
          created_at: string
          filters: Json
          id: string
          investor_portco: string | null
          kind: string | null
          name: string | null
          results: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          investor_portco?: string | null
          kind?: string | null
          name?: string | null
          results?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          investor_portco?: string | null
          kind?: string | null
          name?: string | null
          results?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_for_review: {
        Row: {
          candidate_id: string | null
          created_at: string
          id: string
          responded_at: string | null
          response_reason: string | null
          sent_by: string | null
          sent_to_company_id: string | null
          status: string
          zap_note: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          responded_at?: string | null
          response_reason?: string | null
          sent_by?: string | null
          sent_to_company_id?: string | null
          status?: string
          zap_note?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          responded_at?: string | null
          response_reason?: string | null
          sent_by?: string | null
          sent_to_company_id?: string | null
          status?: string
          zap_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_for_review_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_for_review_sent_to_company_id_fkey"
            columns: ["sent_to_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          candidate_ids: string[]
          company_id: string | null
          created_at: string
          id: string
          investor_portco: string | null
          name: string | null
        }
        Insert: {
          candidate_ids?: string[]
          company_id?: string | null
          created_at?: string
          id?: string
          investor_portco?: string | null
          name?: string | null
        }
        Update: {
          candidate_ids?: string[]
          company_id?: string | null
          created_at?: string
          id?: string
          investor_portco?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          candidate_id: string | null
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_company_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      candidate_status:
        | "applied"
        | "reviewing"
        | "vetting_scheduled"
        | "active"
        | "pre_onboard"
        | "hidden"
        | "archived"
      user_role: "talent" | "company" | "admin" | "investor"
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
      candidate_status: [
        "applied",
        "reviewing",
        "vetting_scheduled",
        "active",
        "pre_onboard",
        "hidden",
        "archived",
      ],
      user_role: ["talent", "company", "admin", "investor"],
    },
  },
} as const
