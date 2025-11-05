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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      company_income: {
        Row: {
          amount: number
          brand: string
          client: string
          completion_date: string | null
          created_at: string
          created_by: string
          date: string
          id: string
          job_type: string
          payment_method: string
          payment_type: string
        }
        Insert: {
          amount: number
          brand?: string
          client: string
          completion_date?: string | null
          created_at?: string
          created_by: string
          date: string
          id?: string
          job_type?: string
          payment_method?: string
          payment_type?: string
        }
        Update: {
          amount?: number
          brand?: string
          client?: string
          completion_date?: string | null
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          job_type?: string
          payment_method?: string
          payment_type?: string
        }
        Relationships: []
      }
      employee_details: {
        Row: {
          address: string | null
          created_at: string
          full_name: string
          id: string
          mobile: string | null
          salary_details: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name: string
          id?: string
          mobile?: string | null
          salary_details?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string
          id?: string
          mobile?: string | null
          salary_details?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          receipt_path: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description: string
          id?: string
          receipt_path?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          receipt_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string
          id: string
          month: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by: string
          id?: string
          month: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          details: string | null
          id: string
          merchant: string
          method: string
          paid_by: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          date: string
          details?: string | null
          id?: string
          merchant: string
          method: string
          paid_by?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          details?: string | null
          id?: string
          merchant?: string
          method?: string
          paid_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      studio_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          date: string
          details: string | null
          id: string
          merchant: string
          method: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          date: string
          details?: string | null
          id?: string
          merchant: string
          method: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          date?: string
          details?: string | null
          id?: string
          merchant?: string
          method?: string
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          hourly_rate: number | null
          hours: number | null
          id: string
          job_count: number | null
          job_description: string
          job_rate: number | null
          start_time: string | null
          total_salary: number
          user_id: string
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          job_count?: number | null
          job_description: string
          job_rate?: number | null
          start_time?: string | null
          total_salary: number
          user_id: string
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          job_count?: number | null
          job_description?: string
          job_rate?: number | null
          start_time?: string | null
          total_salary?: number
          user_id?: string
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Relationships: []
      }
      vendor_bills: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          invoice_path: string | null
          method: string | null
          paid_at: string | null
          paid_by: string | null
          status: Database["public"]["Enums"]["bill_status"]
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          invoice_path?: string | null
          method?: string | null
          paid_at?: string | null
          paid_by?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_path?: string | null
          method?: string | null
          paid_at?: string | null
          paid_by?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_role: { Args: never; Returns: string }
      get_month_end_date: {
        Args: { month: number; year: number }
        Returns: string
      }
    }
    Enums: {
      bill_status: "pending" | "paid"
      user_role: "admin" | "staff" | "manager"
      work_type: "hourly" | "job"
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
      bill_status: ["pending", "paid"],
      user_role: ["admin", "staff", "manager"],
      work_type: ["hourly", "job"],
    },
  },
} as const
