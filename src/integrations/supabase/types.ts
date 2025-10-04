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
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      brute_force_alerts: {
        Row: {
          alert_type: string
          attempt_count: number | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          attempt_count?: number | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          attempt_count?: number | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brute_force_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          post_type: string
          shares_count: number | null
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          comments_count?: number | null
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          post_type?: string
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          comments_count?: number | null
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          post_type?: string
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_presentations: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          created_at: string | null
          cv_url: string | null
          email: string | null
          entry: string | null
          id: string
          layout: Json | null
          name: string | null
          nav_labels: Json | null
          phone: string | null
          quick: string | null
          role: string | null
          sections: Json | null
          seo: Json | null
          socials: Json | null
          styles: Json | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          entry?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
          nav_labels?: Json | null
          phone?: string | null
          quick?: string | null
          role?: string | null
          sections?: Json | null
          seo?: Json | null
          socials?: Json | null
          styles?: Json | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          entry?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
          nav_labels?: Json | null
          phone?: string | null
          quick?: string | null
          role?: string | null
          sections?: Json | null
          seo?: Json | null
          socials?: Json | null
          styles?: Json | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_presentations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      security_events: {
        Row: {
          created_at: string
          event_description: string | null
          event_type: string
          id: string
          metadata: Json | null
          risk_level: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      system_issues: {
        Row: {
          created_at: string
          id: string
          issue_description: string | null
          issue_type: string
          metadata: Json | null
          resolved_at: string | null
          severity: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          issue_description?: string | null
          issue_type: string
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          issue_description?: string | null
          issue_type?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
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
      upload_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          post_id: string | null
          progress: number | null
          started_at: string | null
          upload_status: string
          upload_url: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          post_id?: string | null
          progress?: number | null
          started_at?: string | null
          upload_status?: string
          upload_url?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          post_id?: string | null
          progress?: number | null
          started_at?: string | null
          upload_status?: string
          upload_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
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
      create_post_safe: {
        Args: {
          content_param: Json
          is_sponsored_param?: boolean
          post_type_param?: string
          visibility_param?: string
        }
        Returns: string
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
      restore_post: {
        Args: { post_id_param: string }
        Returns: undefined
      }
      soft_delete_post: {
        Args: { post_id_param: string }
        Returns: undefined
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
