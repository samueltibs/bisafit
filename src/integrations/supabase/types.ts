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
      health_uploads: {
        Row: {
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          days: number | null
          id: string
          meal_plan_json: Json
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days?: number | null
          id?: string
          meal_plan_json: Json
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days?: number | null
          id?: string
          meal_plan_json?: Json
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_profiles: {
        Row: {
          budget_level: string | null
          calories_target: number | null
          carbs_g: number | null
          created_at: string | null
          cuisine_preferences_json: Json | null
          dietary_preferences_json: Json | null
          fat_g: number | null
          meal_plan_json: Json | null
          meals_per_day: number | null
          nutrition_goal_style: string | null
          protein_g: number | null
          snacks_per_day: number | null
          targets_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_level?: string | null
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          cuisine_preferences_json?: Json | null
          dietary_preferences_json?: Json | null
          fat_g?: number | null
          meal_plan_json?: Json | null
          meals_per_day?: number | null
          nutrition_goal_style?: string | null
          protein_g?: number | null
          snacks_per_day?: number | null
          targets_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_level?: string | null
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          cuisine_preferences_json?: Json | null
          dietary_preferences_json?: Json | null
          fat_g?: number | null
          meal_plan_json?: Json | null
          meals_per_day?: number | null
          nutrition_goal_style?: string | null
          protein_g?: number | null
          snacks_per_day?: number | null
          targets_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          block_number: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          name: string | null
          plan_json: Json
          start_date: string | null
          started_at: string | null
          status: string | null
          user_id: string
          weeks: number | null
        }
        Insert: {
          block_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          plan_json: Json
          start_date?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
          weeks?: number | null
        }
        Update: {
          block_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          plan_json?: Json
          start_date?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
          weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          id: string
          notes: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          id?: string
          notes?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          created_at: string | null
          entry_date: string
          id: string
          photo_url: string
          pose: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          id?: string
          photo_url: string
          pose?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          id?: string
          photo_url?: string
          pose?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          constraints_json: Json | null
          created_at: string | null
          current_plan_id: string | null
          days_per_week: number | null
          equipment_json: Json | null
          experience_level: string | null
          full_name: string | null
          gender: string | null
          goal_primary: string | null
          goal_secondary: string | null
          height_cm: number | null
          id: string
          is_pro: boolean | null
          rest_day: string | null
          session_minutes: number | null
          unit_preference: string | null
          updated_at: string | null
          weight_kg: number | null
          workout_days: Json | null
        }
        Insert: {
          constraints_json?: Json | null
          created_at?: string | null
          current_plan_id?: string | null
          days_per_week?: number | null
          equipment_json?: Json | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          goal_primary?: string | null
          goal_secondary?: string | null
          height_cm?: number | null
          id: string
          is_pro?: boolean | null
          rest_day?: string | null
          session_minutes?: number | null
          unit_preference?: string | null
          updated_at?: string | null
          weight_kg?: number | null
          workout_days?: Json | null
        }
        Update: {
          constraints_json?: Json | null
          created_at?: string | null
          current_plan_id?: string | null
          days_per_week?: number | null
          equipment_json?: Json | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          goal_primary?: string | null
          goal_secondary?: string | null
          height_cm?: number | null
          id?: string
          is_pro?: boolean | null
          rest_day?: string | null
          session_minutes?: number | null
          unit_preference?: string | null
          updated_at?: string | null
          weight_kg?: number | null
          workout_days?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          id: string
          session_log_json: Json | null
          started_at: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          session_log_json?: Json | null
          started_at?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          session_log_json?: Json | null
          started_at?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string | null
          scheduled_date: string | null
          title: string | null
          user_id: string
          workout_json: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          scheduled_date?: string | null
          title?: string | null
          user_id: string
          workout_json: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          scheduled_date?: string | null
          title?: string | null
          user_id?: string
          workout_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
