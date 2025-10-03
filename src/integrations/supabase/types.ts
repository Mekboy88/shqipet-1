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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          id: string
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string | null
          read: boolean
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          read?: boolean
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          read?: boolean
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          linked_module: string | null
          linked_scan_id: string | null
          metadata: Json | null
          priority: string
          source: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          linked_module?: string | null
          linked_scan_id?: string | null
          metadata?: Json | null
          priority?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          linked_module?: string | null
          linked_scan_id?: string | null
          metadata?: Json | null
          priority?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_method: string
          accessed_at: string | null
          id: string
          viewed_profile_id: string
          viewer_id: string | null
        }
        Insert: {
          access_method: string
          accessed_at?: string | null
          id?: string
          viewed_profile_id: string
          viewer_id?: string | null
        }
        Update: {
          access_method?: string
          accessed_at?: string | null
          id?: string
          viewed_profile_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          cover_gradient: string | null
          cover_position: string | null
          cover_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          gender: string | null
          id: string
          is_hidden: boolean | null
          last_name: string | null
          phone_number: string | null
          phone_verified: boolean | null
          primary_role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_gradient?: string | null
          cover_position?: string | null
          cover_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          gender?: string | null
          id: string
          is_hidden?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          primary_role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_gradient?: string | null
          cover_position?: string | null
          cover_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          gender?: string | null
          id?: string
          is_hidden?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          primary_role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_value: Json | null
          recorded_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: Json | null
          recorded_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: Json | null
          recorded_at?: string
        }
        Relationships: []
      }
      upload_configuration: {
        Row: {
          configuration_data: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          configuration_data?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          configuration_data?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      upload_configuration_status: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          content_type: string | null
          created_at: string
          file_size: number | null
          id: string
          is_current: boolean
          original_filename: string | null
          photo_key: string
          photo_type: string
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          is_current?: boolean
          original_filename?: string | null
          photo_key: string
          photo_type: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          is_current?: boolean
          original_filename?: string | null
          photo_key?: string
          photo_type?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          gender: string | null
          id: string | null
          is_hidden: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          is_hidden?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string | null
          is_hidden?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      can_view_sensitive_profile_data: {
        Args: { profile_id: string }
        Returns: boolean
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_user_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_full_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cover_url: string
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          gender: string
          id: string
          is_hidden: boolean
          last_name: string
          phone_number: string
          primary_role: string
          updated_at: string
          username: string
        }[]
      }
      get_profile_field_access_info: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_public_profiles: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          avatar_url: string
          bio: string
          cover_url: string
          created_at: string
          gender: string
          id: string
          is_hidden: boolean
          updated_at: string
          username: string
        }[]
      }
      get_safe_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cover_url: string
          created_at: string
          gender: string
          id: string
          is_hidden: boolean
          updated_at: string
          username: string
        }[]
      }
      get_upload_analytics: {
        Args: { p_time_window?: string }
        Returns: Json
      }
      get_upload_configuration: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_primary_role: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_roles_admin: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
      sync_phone_verification_status: {
        Args: {
          is_verified: boolean
          phone_number_param: string
          user_uuid: string
        }
        Returns: undefined
      }
      sync_user_verification_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_upload_configuration: {
        Args: { config_data: Json }
        Returns: Json
      }
      update_upload_configuration_status: {
        Args: {
          p_error_details?: Json
          p_metadata?: Json
          p_response_time_ms?: number
          p_service_name: string
          p_status: string
        }
        Returns: undefined
      }
      validate_admin_access: {
        Args: { required_action?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
