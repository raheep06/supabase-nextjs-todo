export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: number;
          inserted_at: string;
          is_complete: boolean | null;
          task: string | null;
          user_id: string; // The user who created the task
          due_date: string | null;
          assigned_to: string | null; // The user to whom the task is assigned
          assigned_by: string | null; // The user who assigned the task
        }
        Insert: {
          id?: number;
          inserted_at?: string;
          is_complete?: boolean | null;
          task?: string | null;
          user_id: string; // The user who created the task
          due_date?: string | null;
          assigned_to?: string | null; // The user to whom the task is assigned
          assigned_by?: string | null; // The user who assigned the task
        }
        Update: {
          id?: number;
          inserted_at?: string;
          is_complete?: boolean | null;
          task?: string | null;
          user_id?: string;
          due_date?: string | null;
          assigned_to?: string | null; // The user to whom the task is assigned
          assigned_by?: string | null; // The user who assigned the task
        }
      }
      users: { // Define the users table
        Row: {
          id: string; // UUID type
          email: string; // User's email
          created_at: string; // Timestamp with time zone
        }
        Insert: {
          id?: string; // UUID type
          email: string; // User's email
          created_at?: string; // Timestamp with time zone
        }
        Update: {
          id?: string; // UUID type
          email?: string; // User's email
          created_at?: string; // Timestamp with time zone
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