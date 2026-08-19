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
      access_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          note: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          note: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          note?: string
          status?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          chapter: string | null
          created_at: string
          difficulty: string
          id: string
          language: string
          mcq_options_count: number | null
          question_count: number
          question_type: string
          source_file_name: string | null
          source_file_type: string | null
          source_text: string | null
          status: string
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          language?: string
          mcq_options_count?: number | null
          question_count?: number
          question_type: string
          source_file_name?: string | null
          source_file_type?: string | null
          source_text?: string | null
          status?: string
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          language?: string
          mcq_options_count?: number | null
          question_count?: number
          question_type?: string
          source_file_name?: string | null
          source_file_type?: string | null
          source_text?: string | null
          status?: string
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          subject?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_questions: {
        Row: {
          created_at: string
          id: string
          marks: number
          paper_id: string
          question_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marks?: number
          paper_id: string
          question_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marks?: number
          paper_id?: string
          question_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_questions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          chapter: string | null
          class_name: string | null
          created_at: string
          exam_date: string | null
          exam_name: string | null
          exam_time: string | null
          id: string
          institution_name: string | null
          instructions: string | null
          logo_url: string | null
          status: string
          subject: string | null
          title: string
          total_marks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          exam_time?: string | null
          id?: string
          institution_name?: string | null
          instructions?: string | null
          logo_url?: string | null
          status?: string
          subject?: string | null
          title: string
          total_marks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          exam_time?: string | null
          id?: string
          institution_name?: string | null
          instructions?: string | null
          logo_url?: string | null
          status?: string
          subject?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_points: Json | null
          correct_answer: string | null
          created_at: string
          difficulty: string
          expected_answer: string | null
          explanation: string | null
          generation_id: string | null
          id: string
          is_saved: boolean
          language: string
          marks: number
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_points?: Json | null
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          expected_answer?: string | null
          explanation?: string | null
          generation_id?: string | null
          id?: string
          is_saved?: boolean
          language?: string
          marks?: number
          options?: Json | null
          question_text: string
          question_type: string
          sort_order?: number
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_points?: Json | null
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          expected_answer?: string | null
          explanation?: string | null
          generation_id?: string | null
          id?: string
          is_saved?: boolean
          language?: string
          marks?: number
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          country: string | null
          created_at: string
          id: string
          institution: string | null
          name: string
          rating: number
          role: string | null
          status: string
        }
        Insert: {
          content: string
          country?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name: string
          rating?: number
          role?: string | null
          status?: string
        }
        Update: {
          content?: string
          country?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          rating?: number
          role?: string | null
          status?: string
        }
        Relationships: []
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
