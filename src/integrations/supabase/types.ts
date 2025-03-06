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
      get_month_end_date: {
        Args: {
          year: number
          month: number
        }
        Returns: string
      }
    }
    Enums: {
      bill_status: "pending" | "paid"
      user_role: "admin" | "staff"
      work_type: "hourly" | "job"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
