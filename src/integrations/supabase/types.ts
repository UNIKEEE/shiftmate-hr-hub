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
      attendance_corrections: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          id: string
          profile_id: string
          reason: string
          requested_clock_in: string | null
          requested_clock_out: string | null
          status: Database["public"]["Enums"]["request_status"]
          work_date: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          profile_id: string
          reason: string
          requested_clock_in?: string | null
          requested_clock_out?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          work_date: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          profile_id?: string
          reason?: string
          requested_clock_in?: string | null
          requested_clock_out?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_corrections_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_corrections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          early_leave_minutes: number
          id: string
          late_minutes: number
          note: string | null
          profile_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          work_date: string
          worked_minutes: number
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          early_leave_minutes?: number
          id?: string
          late_minutes?: number
          note?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          work_date: string
          worked_minutes?: number
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          early_leave_minutes?: number
          id?: string
          late_minutes?: number
          note?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          work_date?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
          subject_profile_id: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
          subject_profile_id?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          subject_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          profile_id: string
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          profile_id: string
          reason: string
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          profile_id?: string
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          absent_deduction_per_day: number
          company_name: string
          currency: string
          early_leave_deduction_per_hour: number
          grace_minutes: number
          id: boolean
          late_deduction_per_hour: number
          missing_punch_penalty: number
          updated_at: string
          work_end: string
          work_start: string
        }
        Insert: {
          absent_deduction_per_day?: number
          company_name?: string
          currency?: string
          early_leave_deduction_per_hour?: number
          grace_minutes?: number
          id?: boolean
          late_deduction_per_hour?: number
          missing_punch_penalty?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Update: {
          absent_deduction_per_day?: number
          company_name?: string
          currency?: string
          early_leave_deduction_per_hour?: number
          grace_minutes?: number
          id?: boolean
          late_deduction_per_hour?: number
          missing_punch_penalty?: number
          updated_at?: string
          work_end?: string
          work_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string
          joined_on: string
          monthly_salary: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string
          joined_on?: string
          monthly_salary?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string
          joined_on?: string
          monthly_salary?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_slip_lines: {
        Row: {
          amount: number
          description: string
          id: string
          kind: string
          minutes: number
          ref_date: string | null
          slip_id: string
        }
        Insert: {
          amount?: number
          description: string
          id?: string
          kind: string
          minutes?: number
          ref_date?: string | null
          slip_id: string
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          kind?: string
          minutes?: number
          ref_date?: string | null
          slip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_slip_lines_slip_id_fkey"
            columns: ["slip_id"]
            isOneToOne: false
            referencedRelation: "salary_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_slips: {
        Row: {
          base_pay: number
          days_absent: number
          days_present: number
          generated_at: string
          id: string
          net_pay: number
          period_month: string
          profile_id: string
          total_deductions: number
        }
        Insert: {
          base_pay?: number
          days_absent?: number
          days_present?: number
          generated_at?: string
          id?: string
          net_pay?: number
          period_month: string
          profile_id: string
          total_deductions?: number
        }
        Update: {
          base_pay?: number
          days_absent?: number
          days_present?: number
          generated_at?: string
          id?: string
          net_pay?: number
          period_month?: string
          profile_id?: string
          total_deductions?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_slips_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          label: string
          profile_id: string
          shift_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          label?: string
          profile_id: string
          shift_date: string
          start_time?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          label?: string
          profile_id?: string
          shift_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_current_user: {
        Args: { _email: string; _full_name: string }
        Returns: string
      }
      generate_demo_history: {
        Args: { _from: string; _profile_id: string; _to: string }
        Returns: undefined
      }
      generate_salary_slip: {
        Args: { _month: string; _profile_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "hr" | "employee"
      attendance_status:
        | "present"
        | "late"
        | "early_leave"
        | "absent"
        | "on_leave"
        | "incomplete"
      leave_type: "annual" | "sick" | "unpaid" | "casual"
      request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "hr", "employee"],
      attendance_status: [
        "present",
        "late",
        "early_leave",
        "absent",
        "on_leave",
        "incomplete",
      ],
      leave_type: ["annual", "sick", "unpaid", "casual"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
