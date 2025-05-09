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
      candidates: {
        Row: {
          id: number
          created_at: string
          name: string
          genre: string
          image_url: string | null
          instagram_username: string | null
          bio: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          genre: string
          image_url?: string | null
          instagram_username?: string | null
          bio?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          genre?: string
          image_url?: string | null
          instagram_username?: string | null
          bio?: string | null
        }
      }
      votes: {
        Row: {
          id: number
          created_at: string
          user_id: string
          candidate_id: number
          transaction_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          candidate_id: number
          transaction_id: string
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          candidate_id?: number
          transaction_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          is_admin: boolean
          has_voted: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          is_admin?: boolean
          has_voted?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          is_admin?: boolean
          has_voted?: boolean
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}