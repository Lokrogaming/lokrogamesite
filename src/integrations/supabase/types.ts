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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          credits_won: number | null
          current_mood: Database["public"]["Enums"]["mood_type"]
          id: string
          is_complete: boolean
          messages: Json
          target_mood: Database["public"]["Enums"]["mood_type"]
          updated_at: string
          user_id: string
          won: boolean | null
        }
        Insert: {
          created_at?: string
          credits_won?: number | null
          current_mood?: Database["public"]["Enums"]["mood_type"]
          id?: string
          is_complete?: boolean
          messages?: Json
          target_mood: Database["public"]["Enums"]["mood_type"]
          updated_at?: string
          user_id: string
          won?: boolean | null
        }
        Update: {
          created_at?: string
          credits_won?: number | null
          current_mood?: Database["public"]["Enums"]["mood_type"]
          id?: string
          is_complete?: boolean
          messages?: Json
          target_mood?: Database["public"]["Enums"]["mood_type"]
          updated_at?: string
          user_id?: string
          won?: boolean | null
        }
        Relationships: []
      }
      automod_logs: {
        Row: {
          action_taken: string
          created_at: string | null
          flagged_reason: string
          id: string
          message_id: string | null
          original_content: string
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          flagged_reason: string
          id?: string
          message_id?: string | null
          original_content: string
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          flagged_reason?: string
          id?: string
          message_id?: string | null
          original_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automod_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "global_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_vouchers: {
        Row: {
          amount: number
          code: string
          created_at: string | null
          creator_id: string
          id: string
          is_redeemed: boolean | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          amount: number
          code: string
          created_at?: string | null
          creator_id: string
          id?: string
          is_redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          is_redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          description: string
          game_id: string | null
          id: string
          reward_credits: number
          target_score: number | null
          title: string
        }
        Insert: {
          challenge_date?: string
          created_at?: string
          description: string
          game_id?: string | null
          id?: string
          reward_credits?: number
          target_score?: number | null
          title: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          description?: string
          game_id?: string | null
          id?: string
          reward_credits?: number
          target_score?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_submissions: {
        Row: {
          category: Database["public"]["Enums"]["game_category"]
          created_at: string
          description: string | null
          game_code: string
          game_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["game_category"]
          created_at?: string
          description?: string | null
          game_code: string
          game_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["game_category"]
          created_at?: string
          description?: string | null
          game_code?: string
          game_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          approved_by: string | null
          category: Database["public"]["Enums"]["game_category"]
          cost_per_play: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_community: boolean
          name: string
          path: string
          submitted_by: string | null
        }
        Insert: {
          approved_by?: string | null
          category?: Database["public"]["Enums"]["game_category"]
          cost_per_play?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_community?: boolean
          name: string
          path: string
          submitted_by?: string | null
        }
        Update: {
          approved_by?: string | null
          category?: Database["public"]["Enums"]["game_category"]
          cost_per_play?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_community?: boolean
          name?: string
          path?: string
          submitted_by?: string | null
        }
        Relationships: []
      }
      global_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "global_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          created_at: string
          game_id: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_sessions: {
        Row: {
          created_at: string
          game_id: string
          game_state: Json | null
          guest_id: string | null
          host_id: string
          id: string
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          game_state?: Json | null
          guest_id?: string | null
          host_id: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          game_state?: Json | null
          guest_id?: string | null
          host_id?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_expires_at: string | null
          ban_reason: string | null
          created_at: string
          credits: number
          daily_challenges_completed: number
          description: string | null
          favorite_game: string | null
          id: string
          is_banned: boolean
          last_challenge_reset: string | null
          last_credit_refill: string | null
          rank: Database["public"]["Enums"]["user_rank"] | null
          social_link: string | null
          tag: string | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          created_at?: string
          credits?: number
          daily_challenges_completed?: number
          description?: string | null
          favorite_game?: string | null
          id?: string
          is_banned?: boolean
          last_challenge_reset?: string | null
          last_credit_refill?: string | null
          rank?: Database["public"]["Enums"]["user_rank"] | null
          social_link?: string | null
          tag?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          created_at?: string
          credits?: number
          daily_challenges_completed?: number
          description?: string | null
          favorite_game?: string | null
          id?: string
          is_banned?: boolean
          last_challenge_reset?: string | null
          last_credit_refill?: string | null
          rank?: Database["public"]["Enums"]["user_rank"] | null
          social_link?: string | null
          tag?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      rank_configs: {
        Row: {
          color_class: string
          created_at: string
          display_name: string
          icon_name: string
          id: string
          rank_key: string
          sort_order: number
          updated_at: string
          xp_threshold: number
        }
        Insert: {
          color_class?: string
          created_at?: string
          display_name: string
          icon_name?: string
          id?: string
          rank_key: string
          sort_order?: number
          updated_at?: string
          xp_threshold: number
        }
        Update: {
          color_class?: string
          created_at?: string
          display_name?: string
          icon_name?: string
          id?: string
          rank_key?: string
          sort_order?: number
          updated_at?: string
          xp_threshold?: number
        }
        Relationships: []
      }
      special_voucher_redemptions: {
        Row: {
          id: string
          redeemed_at: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "special_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      special_vouchers: {
        Row: {
          code: string
          created_at: string | null
          creator_id: string
          credits_amount: number
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          one_use_per_user: boolean
          xp_amount: number
        }
        Insert: {
          code: string
          created_at?: string | null
          creator_id: string
          credits_amount?: number
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          one_use_per_user?: boolean
          xp_amount?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          creator_id?: string
          credits_amount?: number
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          one_use_per_user?: boolean
          xp_amount?: number
        }
        Relationships: []
      }
      staff_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_moderation_logs: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at: string
          duration_minutes: number | null
          expires_at: string | null
          id: string
          moderator_id: string
          reason: string
          target_user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at?: string
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          moderator_id: string
          reason: string
          target_user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          created_at?: string
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          moderator_id?: string
          reason?: string
          target_user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      voucher_redemption_attempts: {
        Row: {
          attempt_time: string
          code_attempted: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          attempt_time?: string
          code_attempted: string
          id?: string
          success?: boolean
          user_id: string
        }
        Update: {
          attempt_time?: string
          code_attempted?: string
          id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          favorite_game: string | null
          rank: Database["public"]["Enums"]["user_rank"] | null
          social_link: string | null
          tag: string | null
          user_id: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          favorite_game?: string | null
          rank?: Database["public"]["Enums"]["user_rank"] | null
          social_link?: string | null
          tag?: string | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          favorite_game?: string | null
          rank?: Database["public"]["Enums"]["user_rank"] | null
          social_link?: string | null
          tag?: string | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_chat_xp: { Args: never; Returns: number }
      cleanup_old_voucher_attempts: { Args: never; Returns: undefined }
      create_voucher: { Args: { _amount: number }; Returns: string }
      earn_credits: {
        Args: { _amount: number; _reason?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      owner_set_credits: {
        Args: { _new_credits: number; _target_user_id: string }
        Returns: boolean
      }
      redeem_special_voucher: { Args: { _code: string }; Returns: Json }
      redeem_voucher: { Args: { _code: string }; Returns: number }
      spend_credits: {
        Args: { _amount: number; _reason?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "staff" | "user" | "owner"
      game_category:
        | "arcade"
        | "puzzle"
        | "card"
        | "casual"
        | "ai"
        | "multiplayer"
        | "community"
      moderation_action: "ban" | "kick" | "timeout" | "unban" | "warn"
      mood_type: "very_sad" | "sad" | "neutral" | "happy" | "very_happy"
      user_rank:
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
        | "diamond"
        | "master"
        | "legend"
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
      app_role: ["admin", "moderator", "staff", "user", "owner"],
      game_category: [
        "arcade",
        "puzzle",
        "card",
        "casual",
        "ai",
        "multiplayer",
        "community",
      ],
      moderation_action: ["ban", "kick", "timeout", "unban", "warn"],
      mood_type: ["very_sad", "sad", "neutral", "happy", "very_happy"],
      user_rank: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "master",
        "legend",
      ],
    },
  },
} as const
