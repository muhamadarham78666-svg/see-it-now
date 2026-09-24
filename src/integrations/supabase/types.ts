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
      access_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          note: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          note: string
          phone?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          note?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_label: string
          target_type: string
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string
          target_label?: string
          target_type?: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string
          target_label?: string
          target_type?: string
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          created_at: string
          feature: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_bulk_jobs: {
        Row: {
          book: string
          class_level: string
          consecutive_failures: number
          created_at: string
          created_by: string
          id: string
          last_chapter: string
          last_message: string
          lease_until: string | null
          next_retry_at: string | null
          progress: Json
          status: string
          targets: Json
          updated_at: string
        }
        Insert: {
          book?: string
          class_level?: string
          consecutive_failures?: number
          created_at?: string
          created_by: string
          id?: string
          last_chapter?: string
          last_message?: string
          lease_until?: string | null
          next_retry_at?: string | null
          progress?: Json
          status?: string
          targets?: Json
          updated_at?: string
        }
        Update: {
          book?: string
          class_level?: string
          consecutive_failures?: number
          created_at?: string
          created_by?: string
          id?: string
          last_chapter?: string
          last_message?: string
          lease_until?: string | null
          next_retry_at?: string | null
          progress?: Json
          status?: string
          targets?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bank_bulk_scheduler_keys: {
        Row: {
          created_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      bank_imports: {
        Row: {
          book: string
          class_level: string
          created_at: string
          created_by: string | null
          id: string
          inserted_rows: number
          label: string
          skipped_rows: number
          source: string
          status: string
          total_rows: number
        }
        Insert: {
          book?: string
          class_level?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inserted_rows?: number
          label?: string
          skipped_rows?: number
          source?: string
          status?: string
          total_rows?: number
        }
        Update: {
          book?: string
          class_level?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inserted_rows?: number
          label?: string
          skipped_rows?: number
          source?: string
          status?: string
          total_rows?: number
        }
        Relationships: []
      }
      bank_questions: {
        Row: {
          answer_points: Json | null
          book: string
          category: string
          chapter: string
          class_level: string
          correct_answer: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          expected_answer: string | null
          explanation: string
          fingerprint: string
          id: string
          import_id: string | null
          is_active: boolean
          language: string
          marks: number
          options: Json | null
          parts: Json | null
          question_text: string
          question_type: string
          statement: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          answer_points?: Json | null
          book: string
          category?: string
          chapter?: string
          class_level: string
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          expected_answer?: string | null
          explanation?: string
          fingerprint: string
          id?: string
          import_id?: string | null
          is_active?: boolean
          language?: string
          marks?: number
          options?: Json | null
          parts?: Json | null
          question_text: string
          question_type: string
          statement?: string | null
          topic?: string
          updated_at?: string
        }
        Update: {
          answer_points?: Json | null
          book?: string
          category?: string
          chapter?: string
          class_level?: string
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          expected_answer?: string | null
          explanation?: string
          fingerprint?: string
          id?: string
          import_id?: string | null
          is_active?: boolean
          language?: string
          marks?: number
          options?: Json | null
          parts?: Json | null
          question_text?: string
          question_type?: string
          statement?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_questions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          body: string
          cover_url: string
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          summary: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          body?: string
          cover_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          summary?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string
          cover_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          region: string
          sort_order: number
          style: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region?: string
          sort_order?: number
          style?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region?: string
          sort_order?: number
          style?: string
          updated_at?: string
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
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_events: {
        Row: {
          created_at: string
          id: string
          question_ids: Json
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_ids?: Json
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_ids?: Json
          source?: string
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
          attempts: Json
          chapter: string | null
          class_name: string | null
          created_at: string
          exam_date: string | null
          exam_name: string | null
          exam_time: string | null
          footer_note: string | null
          id: string
          institution_name: string | null
          instructions: string | null
          logo_url: string | null
          pdf_style: string
          print_settings: Json
          status: string
          subject: string | null
          title: string
          total_marks: number
          updated_at: string
          user_id: string
          watermark_text: string | null
        }
        Insert: {
          attempts?: Json
          chapter?: string | null
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          exam_time?: string | null
          footer_note?: string | null
          id?: string
          institution_name?: string | null
          instructions?: string | null
          logo_url?: string | null
          pdf_style?: string
          print_settings?: Json
          status?: string
          subject?: string | null
          title: string
          total_marks?: number
          updated_at?: string
          user_id: string
          watermark_text?: string | null
        }
        Update: {
          attempts?: Json
          chapter?: string | null
          class_name?: string | null
          created_at?: string
          exam_date?: string | null
          exam_name?: string | null
          exam_time?: string | null
          footer_note?: string | null
          id?: string
          institution_name?: string | null
          instructions?: string | null
          logo_url?: string | null
          pdf_style?: string
          print_settings?: Json
          status?: string
          subject?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
          user_id?: string
          watermark_text?: string | null
        }
        Relationships: []
      }
      plan_settings: {
        Row: {
          benefits: Json
          created_at: string
          currency: string
          daily_paper_limit: number
          duration: string
          duration_days: number
          featured: boolean
          features: Json
          id: string
          is_active: boolean
          name: string
          plan_key: string
          price: number
          sort_order: number
          tagline: string
          updated_at: string
          user_limit: number
        }
        Insert: {
          benefits?: Json
          created_at?: string
          currency?: string
          daily_paper_limit?: number
          duration: string
          duration_days?: number
          featured?: boolean
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          plan_key: string
          price?: number
          sort_order?: number
          tagline?: string
          updated_at?: string
          user_limit?: number
        }
        Update: {
          benefits?: Json
          created_at?: string
          currency?: string
          daily_paper_limit?: number
          duration?: string
          duration_days?: number
          featured?: boolean
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          plan_key?: string
          price?: number
          sort_order?: number
          tagline?: string
          updated_at?: string
          user_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          board_code: string | null
          class_level: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          preferences: Json
          ui_language: string
          updated_at: string
        }
        Insert: {
          board_code?: string | null
          class_level?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          preferences?: Json
          ui_language?: string
          updated_at?: string
        }
        Update: {
          board_code?: string | null
          class_level?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json
          ui_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_points: Json | null
          chapter: string | null
          correct_answer: string | null
          created_at: string
          diagram_note: string | null
          diagram_svg: string | null
          difficulty: string
          expected_answer: string | null
          explanation: string | null
          fingerprint: string | null
          generation_id: string | null
          id: string
          is_saved: boolean
          language: string
          marks: number
          options: Json | null
          parts: Json | null
          question_text: string
          question_type: string
          sort_order: number
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_points?: Json | null
          chapter?: string | null
          correct_answer?: string | null
          created_at?: string
          diagram_note?: string | null
          diagram_svg?: string | null
          difficulty?: string
          expected_answer?: string | null
          explanation?: string | null
          fingerprint?: string | null
          generation_id?: string | null
          id?: string
          is_saved?: boolean
          language?: string
          marks?: number
          options?: Json | null
          parts?: Json | null
          question_text: string
          question_type: string
          sort_order?: number
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_points?: Json | null
          chapter?: string | null
          correct_answer?: string | null
          created_at?: string
          diagram_note?: string | null
          diagram_svg?: string | null
          difficulty?: string
          expected_answer?: string | null
          explanation?: string | null
          fingerprint?: string | null
          generation_id?: string | null
          id?: string
          is_saved?: boolean
          language?: string
          marks?: number
          options?: Json | null
          parts?: Json | null
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
      site_settings: {
        Row: {
          announcement: string
          announcement_enabled: boolean
          blog_enabled: boolean
          contact_address: string
          contact_email: string
          contact_map_url: string
          contact_phone: string
          contact_whatsapp: string
          created_at: string
          free_trial_days: number
          free_trial_enabled: boolean
          id: string
          maintenance_message: string
          maintenance_mode: boolean
          show_contact: boolean
          signups_paused: boolean
          updated_at: string
        }
        Insert: {
          announcement?: string
          announcement_enabled?: boolean
          blog_enabled?: boolean
          contact_address?: string
          contact_email?: string
          contact_map_url?: string
          contact_phone?: string
          contact_whatsapp?: string
          created_at?: string
          free_trial_days?: number
          free_trial_enabled?: boolean
          id?: string
          maintenance_message?: string
          maintenance_mode?: boolean
          show_contact?: boolean
          signups_paused?: boolean
          updated_at?: string
        }
        Update: {
          announcement?: string
          announcement_enabled?: boolean
          blog_enabled?: boolean
          contact_address?: string
          contact_email?: string
          contact_map_url?: string
          contact_phone?: string
          contact_whatsapp?: string
          created_at?: string
          free_trial_days?: number
          free_trial_enabled?: boolean
          id?: string
          maintenance_message?: string
          maintenance_mode?: boolean
          show_contact?: boolean
          signups_paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          linked_user_id: string | null
          message: string
          phone: string
          plan_key: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          linked_user_id?: string | null
          message?: string
          phone: string
          plan_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          linked_user_id?: string | null
          message?: string
          phone?: string
          plan_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          plan_key: string
          request_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
          user_limit: number
          warned_stages: Json
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          plan_key: string
          request_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
          user_id: string
          user_limit: number
          warned_stages?: Json
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          plan_key?: string
          request_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_limit?: number
          warned_stages?: Json
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          sender: string
          thread_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          sender: string
          thread_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          sender?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          escalated: boolean
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_token: string | null
          id: string
          last_message_at: string
          plan_key: string | null
          source: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          escalated?: boolean
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_token?: string | null
          id?: string
          last_message_at?: string
          plan_key?: string | null
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          escalated?: boolean
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_token?: string | null
          id?: string
          last_message_at?: string
          plan_key?: string | null
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          member_email: string
          member_role: string
          member_user_id: string | null
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_email: string
          member_role?: string
          member_user_id?: string | null
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_email?: string
          member_role?: string
          member_user_id?: string | null
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      textbook_chapters: {
        Row: {
          chapter_name: string
          chapter_number: number
          content_indexed: boolean
          created_at: string
          id: string
          page_from: number | null
          page_to: number | null
          textbook_id: string
        }
        Insert: {
          chapter_name: string
          chapter_number: number
          content_indexed?: boolean
          created_at?: string
          id?: string
          page_from?: number | null
          page_to?: number | null
          textbook_id: string
        }
        Update: {
          chapter_name?: string
          chapter_number?: number
          content_indexed?: boolean
          created_at?: string
          id?: string
          page_from?: number | null
          page_to?: number | null
          textbook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textbook_chapters_textbook_id_fkey"
            columns: ["textbook_id"]
            isOneToOne: false
            referencedRelation: "textbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      textbooks: {
        Row: {
          academic_session: string
          board: string
          class_level: string
          created_at: string
          edition: string
          id: string
          medium: string
          page_count: number | null
          processing_error: string
          processing_status: string
          publication_year: number | null
          publisher: string
          source_url: string
          status: string
          subject: string
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          academic_session: string
          board?: string
          class_level: string
          created_at?: string
          edition?: string
          id?: string
          medium?: string
          page_count?: number | null
          processing_error?: string
          processing_status?: string
          publication_year?: number | null
          publisher?: string
          source_url?: string
          status?: string
          subject: string
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          academic_session?: string
          board?: string
          class_level?: string
          created_at?: string
          edition?: string
          id?: string
          medium?: string
          page_count?: number | null
          processing_error?: string
          processing_status?: string
          publication_year?: number | null
          publisher?: string
          source_url?: string
          status?: string
          subject?: string
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          browser: string
          created_at: string
          email: string
          fingerprint: string
          id: string
          ip: string
          label: string
          last_seen_at: string
          os: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: string
          created_at?: string
          email?: string
          fingerprint: string
          id?: string
          ip?: string
          label?: string
          last_seen_at?: string
          os?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: string
          created_at?: string
          email?: string
          fingerprint?: string
          id?: string
          ip?: string
          label?: string
          last_seen_at?: string
          os?: string
          status?: string
          updated_at?: string
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
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      owner_email: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "owner" | "editor"
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
      app_role: ["admin", "user", "owner", "editor"],
    },
  },
} as const
