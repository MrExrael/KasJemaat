/**
 * Tipe database KasJemaat.
 *
 * Ditulis manual agar selaras dengan supabase/migrations/0001_init.sql.
 * Regenerasi otomatis (disarankan setelah skema berubah):
 *   npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/types/database.ts
 * atau (proyek ter-link): npx supabase gen types typescript --linked --schema public > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          pic_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          pic_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          pic_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cash_types: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["user_role"];
          department_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          department_id: string;
          cash_type_id: string;
          type: Database["public"]["Enums"]["tx_type"];
          amount: number;
          category: string | null;
          description: string | null;
          proof_url: string | null;
          status: Database["public"]["Enums"]["tx_status"];
          created_by: string;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          department_id: string;
          cash_type_id: string;
          type: Database["public"]["Enums"]["tx_type"];
          amount: number;
          category?: string | null;
          description?: string | null;
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["tx_status"];
          created_by: string;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          department_id?: string;
          cash_type_id?: string;
          type?: Database["public"]["Enums"]["tx_type"];
          amount?: number;
          category?: string | null;
          description?: string | null;
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["tx_status"];
          created_by?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_cash_type_id_fkey";
            columns: ["cash_type_id"];
            isOneToOne: false;
            referencedRelation: "cash_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_reports: {
        Row: {
          id: string;
          week_start_date: string;
          cash_type_id: string;
          persembahan_mimbar: number;
          kolekte_ibadah: number;
          perpuluhan: number;
          persembahan_syukur: number;
          lainnya: number;
          total: number;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_start_date: string;
          cash_type_id: string;
          persembahan_mimbar?: number;
          kolekte_ibadah?: number;
          perpuluhan?: number;
          persembahan_syukur?: number;
          lainnya?: number;
          total?: number;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week_start_date?: string;
          cash_type_id?: string;
          persembahan_mimbar?: number;
          kolekte_ibadah?: number;
          perpuluhan?: number;
          persembahan_syukur?: number;
          lainnya?: number;
          total?: number;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_reports_cash_type_id_fkey";
            columns: ["cash_type_id"];
            isOneToOne: false;
            referencedRelation: "cash_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      current_department: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "gembala" | "sekretaris" | "bendahara" | "petugas";
      tx_type: "income" | "expense";
      tx_status: "draft" | "verified" | "approved";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------- Alias praktis ----------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      user_role: ["gembala", "sekretaris", "bendahara", "petugas"],
      tx_type: ["income", "expense"],
      tx_status: ["draft", "verified", "approved"],
    },
  },
} as const;
