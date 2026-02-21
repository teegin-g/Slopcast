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
      wells: {
        Row: {
          id: string;
          external_key: string | null;
          name: string;
          lat: number;
          lng: number;
          lateral_length: number;
          status: 'PRODUCING' | 'DUC' | 'PERMIT';
          operator: string;
          formation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_key?: string | null;
          name: string;
          lat: number;
          lng: number;
          lateral_length: number;
          status: 'PRODUCING' | 'DUC' | 'PERMIT';
          operator: string;
          formation: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_key?: string | null;
          name?: string;
          lat?: number;
          lng?: number;
          lateral_length?: number;
          status?: 'PRODUCING' | 'DUC' | 'PERMIT';
          operator?: string;
          formation?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          description: string | null;
          active_group_id: string | null;
          ui_state: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          description?: string | null;
          active_group_id?: string | null;
          ui_state?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          description?: string | null;
          active_group_id?: string | null;
          ui_state?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor' | 'viewer';
          created_at?: string;
        };
      };
      project_groups: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
          sort_order: number;
          type_curve: Json;
          capex: Json;
          opex: Json;
          ownership: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color: string;
          sort_order?: number;
          type_curve: Json;
          capex: Json;
          opex: Json;
          ownership: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          type_curve?: Json;
          capex?: Json;
          opex?: Json;
          ownership?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_group_wells: {
        Row: {
          project_group_id: string;
          well_id: string;
        };
        Insert: {
          project_group_id: string;
          well_id: string;
        };
        Update: {
          project_group_id?: string;
          well_id?: string;
        };
      };
      project_scenarios: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          color: string;
          is_base_case: boolean;
          pricing: Json;
          schedule: Json;
          capex_scalar: number;
          production_scalar: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          color: string;
          is_base_case?: boolean;
          pricing: Json;
          schedule: Json;
          capex_scalar?: number;
          production_scalar?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          color?: string;
          is_base_case?: boolean;
          pricing?: Json;
          schedule?: Json;
          capex_scalar?: number;
          production_scalar?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      economics_runs: {
        Row: {
          id: string;
          project_id: string;
          triggered_by: string;
          input_hash: string;
          portfolio_metrics: Json;
          warnings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          triggered_by: string;
          input_hash: string;
          portfolio_metrics: Json;
          warnings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          triggered_by?: string;
          input_hash?: string;
          portfolio_metrics?: Json;
          warnings?: Json;
          created_at?: string;
        };
      };
      economics_run_group_metrics: {
        Row: {
          economics_run_id: string;
          project_group_id: string;
          metrics: Json;
          rank: number | null;
        };
        Insert: {
          economics_run_id: string;
          project_group_id: string;
          metrics: Json;
          rank?: number | null;
        };
        Update: {
          economics_run_id?: string;
          project_group_id?: string;
          metrics?: Json;
          rank?: number | null;
        };
      };
    };
    Functions: {
      save_project_bundle: {
        Args: {
          p_project_id: string | null;
          p_name: string;
          p_description: string | null;
          p_active_group_id: string | null;
          p_ui_state: Json;
          p_groups: Json;
          p_scenarios: Json;
        };
        Returns: string;
      };
      create_economics_run: {
        Args: {
          p_project_id: string;
          p_input_hash: string;
          p_portfolio_metrics: Json;
          p_warnings: Json;
          p_group_metrics: Json;
        };
        Returns: string;
      };
    };
  };
};
