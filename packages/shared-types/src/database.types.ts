export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accreditations: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          changed_by: string | null
          id: string
          status_id: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          status_id: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "student_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_active: boolean
          target_role: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          target_role?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          target_role?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      counselors: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counselors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          calling_code: string | null
          id: string
          iso_code: string
          name: string
          name_es: string | null
        }
        Insert: {
          calling_code?: string | null
          id?: string
          iso_code: string
          name: string
          name_es?: string | null
        }
        Update: {
          calling_code?: string | null
          id?: string
          iso_code?: string
          name?: string
          name_es?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          id: string
          name: string
          symbol: string | null
        }
        Insert: {
          code: string
          id?: string
          name: string
          symbol?: string | null
        }
        Update: {
          code?: string
          id?: string
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          id: string
          name: string
          required: boolean
        }
        Insert: {
          id?: string
          name: string
          required?: boolean
        }
        Update: {
          id?: string
          name?: string
          required?: boolean
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          original_filename: string | null
          size_bytes: number | null
          storage_path: string
          type_id: string | null
          uploaded_by: string | null
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path: string
          type_id?: string | null
          uploaded_by?: string | null
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          size_bytes?: number | null
          storage_path?: string
          type_id?: string | null
          uploaded_by?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      education_levels: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      education_models: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_notes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          note: string | null
          ranking: number | null
          student_id: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          ranking?: number | null
          student_id: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          ranking?: number | null
          student_id?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      event_universities: {
        Row: {
          event_id: string
          university_id: string
        }
        Insert: {
          event_id: string
          university_id: string
        }
        Update: {
          event_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_universities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_universities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          country_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string | null
          id: string
          image_url: string | null
          location: string | null
          registration_deadline: string | null
          start_date: string | null
          start_time: string | null
          state_province_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          start_time?: string | null
          state_province_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          registration_deadline?: string | null
          start_date?: string | null
          start_time?: string | null
          state_province_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_state_province_id_fkey"
            columns: ["state_province_id"]
            isOneToOne: false
            referencedRelation: "states_provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      fields_of_study: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      financial_plans: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      high_school_accreditations: {
        Row: {
          accreditation_id: string
          high_school_id: string
        }
        Insert: {
          accreditation_id: string
          high_school_id: string
        }
        Update: {
          accreditation_id?: string
          high_school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "high_school_accreditations_accreditation_id_fkey"
            columns: ["accreditation_id"]
            isOneToOne: false
            referencedRelation: "accreditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "high_school_accreditations_high_school_id_fkey"
            columns: ["high_school_id"]
            isOneToOne: false
            referencedRelation: "high_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      high_schools: {
        Row: {
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string
          education_model_id: string | null
          id: string
          monthly_cost: number | null
          monthly_cost_currency_id: string | null
          name: string
          phone_number: string | null
          state_province_id: string | null
          status_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          education_model_id?: string | null
          id?: string
          monthly_cost?: number | null
          monthly_cost_currency_id?: string | null
          name: string
          phone_number?: string | null
          state_province_id?: string | null
          status_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          education_model_id?: string | null
          id?: string
          monthly_cost?: number | null
          monthly_cost_currency_id?: string | null
          name?: string
          phone_number?: string | null
          state_province_id?: string | null
          status_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "high_schools_education_model_id_fkey"
            columns: ["education_model_id"]
            isOneToOne: false
            referencedRelation: "education_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "high_schools_monthly_cost_currency_id_fkey"
            columns: ["monthly_cost_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "high_schools_state_province_id_fkey"
            columns: ["state_province_id"]
            isOneToOne: false
            referencedRelation: "states_provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "high_schools_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "high_schools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      language_exams: {
        Row: {
          id: string
          language_id: string
          name: string
        }
        Insert: {
          id?: string
          language_id: string
          name: string
        }
        Update: {
          id?: string
          language_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_exams_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          read_at: string | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_to_ones: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          end_time: string | null
          event_id: string
          id: string
          room: string | null
          start_time: string | null
          status: string
          student_id: string | null
          student_note: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          room?: string | null
          start_time?: string | null
          status?: string
          student_id?: string | null
          student_note?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          room?: string | null
          start_time?: string | null
          status?: string
          student_id?: string | null
          student_note?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_to_ones_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_to_ones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_to_ones_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_to_ones_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_to_ones_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: string
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: string
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      special_partners: {
        Row: {
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string
          id: string
          login_username: string | null
          name: string
          phone: string | null
          updated_at: string
          webpage: string | null
          wrsi_id: string | null
        }
        Insert: {
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          id?: string
          login_username?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          webpage?: string | null
          wrsi_id?: string | null
        }
        Update: {
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string
          id?: string
          login_username?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          webpage?: string | null
          wrsi_id?: string | null
        }
        Relationships: []
      }
      sponsors_and_allies: {
        Row: {
          created_at: string
          email: string | null
          id: string
          industry_id: string | null
          links: string | null
          login_password: string | null
          login_username: string | null
          name: string
          status_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          industry_id?: string | null
          links?: string | null
          login_password?: string | null
          login_username?: string | null
          name: string
          status_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          industry_id?: string | null
          links?: string | null
          login_password?: string | null
          login_username?: string | null
          name?: string
          status_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_and_allies_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_and_allies_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      states_provinces: {
        Row: {
          country_id: string
          id: string
          name: string
        }
        Insert: {
          country_id: string
          id?: string
          name: string
        }
        Update: {
          country_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_provinces_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          note: string | null
          status_id: string
          student_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          status_id: string
          student_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          status_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          color: string | null
          entity_type: string
          id: string
          is_terminal: boolean
          name: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          entity_type: string
          id?: string
          is_terminal?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          entity_type?: string
          id?: string
          is_terminal?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      student_applications: {
        Row: {
          created_at: string
          id: string
          intake_term: Database["public"]["Enums"]["intake_term"] | null
          intake_year: number | null
          program_id: string | null
          status_id: string | null
          student_id: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intake_term?: Database["public"]["Enums"]["intake_term"] | null
          intake_year?: number | null
          program_id?: string | null
          status_id?: string | null
          student_id: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intake_term?: Database["public"]["Enums"]["intake_term"] | null
          intake_year?: number | null
          program_id?: string | null
          status_id?: string | null
          student_id?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_applications_program_fkey"
            columns: ["program_id", "university_id"]
            isOneToOne: false
            referencedRelation: "university_programs"
            referencedColumns: ["id", "university_id"]
          },
          {
            foreignKeyName: "student_applications_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_applications_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      student_countries_interest: {
        Row: {
          country_id: string
          created_at: string
          rating: number | null
          student_id: string
        }
        Insert: {
          country_id: string
          created_at?: string
          rating?: number | null
          student_id: string
        }
        Update: {
          country_id?: string
          created_at?: string
          rating?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_countries_interest_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_countries_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_countries_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_education_level_interest: {
        Row: {
          created_at: string
          education_level_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          education_level_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          education_level_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_education_level_interest_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_education_level_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_education_level_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fields_of_study_interest: {
        Row: {
          created_at: string
          field_of_study_id: string
          rating: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          field_of_study_id: string
          rating?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          field_of_study_id?: string
          rating?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fields_of_study_interest_field_of_study_id_fkey"
            columns: ["field_of_study_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fields_of_study_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fields_of_study_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_language_exams: {
        Row: {
          exam_date: string | null
          expiry_date: string | null
          language_exam_id: string
          score: number | null
          student_id: string
        }
        Insert: {
          exam_date?: string | null
          expiry_date?: string | null
          language_exam_id: string
          score?: number | null
          student_id: string
        }
        Update: {
          exam_date?: string | null
          expiry_date?: string | null
          language_exam_id?: string
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_language_exams_language_exam_id_fkey"
            columns: ["language_exam_id"]
            isOneToOne: false
            referencedRelation: "language_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_language_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_language_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_passports: {
        Row: {
          country_id: string
          student_id: string
        }
        Insert: {
          country_id: string
          student_id: string
        }
        Update: {
          country_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_passports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_passports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_passports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_references: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          relationship: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          relationship?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          relationship?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_references_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_references_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_university_interest: {
        Row: {
          created_at: string
          interest_level: string
          rank: number | null
          rating: number | null
          student_id: string
          university_id: string
        }
        Insert: {
          created_at?: string
          interest_level?: string
          rank?: number | null
          rating?: number | null
          student_id: string
          university_id: string
        }
        Update: {
          created_at?: string
          interest_level?: string
          rank?: number | null
          rating?: number | null
          student_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_university_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_university_interest_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_university_interest_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          average_grade: number | null
          birth_date: string | null
          budget: number | null
          budget_currency_id: string | null
          cefr_level: string | null
          consent_info_use: boolean
          consent_info_use_at: string | null
          counselor_id: string | null
          country_id: string | null
          created_at: string
          desired_intake_term: Database["public"]["Enums"]["intake_term"] | null
          desired_intake_year: number | null
          expected_graduation_year: number | null
          financial_plan_id: string | null
          first_name: string
          high_school_id: string | null
          highest_education_level_id: string | null
          id: string
          last_name: string
          onboarding_completed_at: string | null
          parent_or_guardian_name: string | null
          parent_or_guardian_phone: string | null
          personal_notes: string | null
          phone_number: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_grade?: number | null
          birth_date?: string | null
          budget?: number | null
          budget_currency_id?: string | null
          cefr_level?: string | null
          consent_info_use?: boolean
          consent_info_use_at?: string | null
          counselor_id?: string | null
          country_id?: string | null
          created_at?: string
          desired_intake_term?:
            | Database["public"]["Enums"]["intake_term"]
            | null
          desired_intake_year?: number | null
          expected_graduation_year?: number | null
          financial_plan_id?: string | null
          first_name: string
          high_school_id?: string | null
          highest_education_level_id?: string | null
          id?: string
          last_name: string
          onboarding_completed_at?: string | null
          parent_or_guardian_name?: string | null
          parent_or_guardian_phone?: string | null
          personal_notes?: string | null
          phone_number?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_grade?: number | null
          birth_date?: string | null
          budget?: number | null
          budget_currency_id?: string | null
          cefr_level?: string | null
          consent_info_use?: boolean
          consent_info_use_at?: string | null
          counselor_id?: string | null
          country_id?: string | null
          created_at?: string
          desired_intake_term?:
            | Database["public"]["Enums"]["intake_term"]
            | null
          desired_intake_year?: number | null
          expected_graduation_year?: number | null
          financial_plan_id?: string | null
          first_name?: string
          high_school_id?: string | null
          highest_education_level_id?: string | null
          id?: string
          last_name?: string
          onboarding_completed_at?: string | null
          parent_or_guardian_name?: string | null
          parent_or_guardian_phone?: string | null
          personal_notes?: string | null
          phone_number?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_budget_currency_id_fkey"
            columns: ["budget_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_financial_plan_id_fkey"
            columns: ["financial_plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_high_school_id_fkey"
            columns: ["high_school_id"]
            isOneToOne: false
            referencedRelation: "high_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_highest_education_level_id_fkey"
            columns: ["highest_education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          currency_id: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          requirements: string | null
          state_province_id: string | null
          status_id: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          requirements?: string | null
          state_province_id?: string | null
          status_id?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          currency_id?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          requirements?: string | null
          state_province_id?: string | null
          status_id?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universities_state_province_id_fkey"
            columns: ["state_province_id"]
            isOneToOne: false
            referencedRelation: "states_provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universities_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      university_programs: {
        Row: {
          created_at: string
          duration: string | null
          education_level_id: string | null
          field_of_study_id: string | null
          id: string
          name: string
          requirements: string | null
          tuition: number | null
          tuition_currency_id: string | null
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          education_level_id?: string | null
          field_of_study_id?: string | null
          id?: string
          name: string
          requirements?: string | null
          tuition?: number | null
          tuition_currency_id?: string | null
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          education_level_id?: string | null
          field_of_study_id?: string | null
          id?: string
          name?: string
          requirements?: string | null
          tuition?: number | null
          tuition_currency_id?: string | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_programs_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_programs_field_of_study_id_fkey"
            columns: ["field_of_study_id"]
            isOneToOne: false
            referencedRelation: "fields_of_study"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_programs_tuition_currency_id_fkey"
            columns: ["tuition_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      workshop_registrations: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          room: string | null
          status: string
          student_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          room?: string | null
          status?: string
          student_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          room?: string | null
          status?: string
          student_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_registrations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_registrations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          created_at: string
          end_time: string
          event_id: string
          id: string
          start_time: string
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          event_id: string
          id?: string
          start_time: string
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          event_id?: string
          id?: string
          start_time?: string
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshops_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshops_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      student_directory: {
        Row: {
          average_grade: number | null
          birth_date: string | null
          budget: number | null
          budget_currency_id: string | null
          cefr_level: string | null
          counselor_first_name: string | null
          counselor_id: string | null
          counselor_last_name: string | null
          country_id: string | null
          created_at: string | null
          desired_intake_term: Database["public"]["Enums"]["intake_term"] | null
          desired_intake_year: number | null
          expected_graduation_year: number | null
          financial_plan_id: string | null
          first_name: string | null
          high_school_id: string | null
          high_school_name: string | null
          highest_education_level_id: string | null
          id: string | null
          last_name: string | null
          onboarding_completed_at: string | null
          parent_or_guardian_name: string | null
          phone_number: string | null
          status_changed_at: string | null
          status_color: string | null
          status_id: string | null
          status_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_budget_currency_id_fkey"
            columns: ["budget_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_financial_plan_id_fkey"
            columns: ["financial_plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_high_school_id_fkey"
            columns: ["high_school_id"]
            isOneToOne: false
            referencedRelation: "high_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_highest_education_level_id_fkey"
            columns: ["highest_education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_student: { Args: { p_student_id: string }; Returns: boolean }
      can_access_user: { Args: { p_user_id: string }; Returns: boolean }
      complete_student_onboarding: {
        Args: {
          p_country_interest_ids?: string[]
          p_field_ids?: string[]
          p_intended_level_ids?: string[]
          p_passport_country_ids?: string[]
          p_profile: Json
        }
        Returns: {
          average_grade: number | null
          birth_date: string | null
          budget: number | null
          budget_currency_id: string | null
          cefr_level: string | null
          consent_info_use: boolean
          consent_info_use_at: string | null
          counselor_id: string | null
          country_id: string | null
          created_at: string
          desired_intake_term: Database["public"]["Enums"]["intake_term"] | null
          desired_intake_year: number | null
          expected_graduation_year: number | null
          financial_plan_id: string | null
          first_name: string
          high_school_id: string | null
          highest_education_level_id: string | null
          id: string
          last_name: string
          onboarding_completed_at: string | null
          parent_or_guardian_name: string | null
          parent_or_guardian_phone: string | null
          personal_notes: string | null
          phone_number: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_student_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      entity_ref_exists: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      has_role: { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_counselor_of: { Args: { p_student_id: string }; Returns: boolean }
      is_service_context: { Args: never; Returns: boolean }
      update_student_profile: {
        Args: {
          p_country_interest_ids?: string[]
          p_field_ids?: string[]
          p_intended_level_ids?: string[]
          p_passport_country_ids?: string[]
          p_profile: Json
        }
        Returns: {
          average_grade: number | null
          birth_date: string | null
          budget: number | null
          budget_currency_id: string | null
          cefr_level: string | null
          consent_info_use: boolean
          consent_info_use_at: string | null
          counselor_id: string | null
          country_id: string | null
          created_at: string
          desired_intake_term: Database["public"]["Enums"]["intake_term"] | null
          desired_intake_year: number | null
          expected_graduation_year: number | null
          financial_plan_id: string | null
          first_name: string
          high_school_id: string | null
          highest_education_level_id: string | null
          id: string
          last_name: string
          onboarding_completed_at: string | null
          parent_or_guardian_name: string | null
          parent_or_guardian_phone: string | null
          personal_notes: string | null
          phone_number: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      device_platform: "ios" | "android" | "web"
      intake_term: "fall" | "winter" | "spring_summer"
      task_status: "open" | "in_progress" | "done" | "cancelled"
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
      device_platform: ["ios", "android", "web"],
      intake_term: ["fall", "winter", "spring_summer"],
      task_status: ["open", "in_progress", "done", "cancelled"],
    },
  },
} as const

