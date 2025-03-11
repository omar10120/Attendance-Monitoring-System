export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          check_in: string
          check_out: string | null
          created_at: string
          updated_at: string | null
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          check_in: string
          check_out?: string | null
          created_at?: string
          updated_at?: string | null
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          check_in?: string
          check_out?: string | null
          created_at?: string
          updated_at?: string | null
          status?: string
          notes?: string | null
        }
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
  }
}
