export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DealStatus = 'draft' | 'active' | 'closed' | 'archived';
export type DealWellType = 'developed' | 'undeveloped';

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
      deals: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          category: string | null;
          status: DealStatus;
          basin: string | null;
          metadata: Json;
          baseline_scenario_id: string | null;
          kpis: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          category?: string | null;
          status?: DealStatus;
          basin?: string | null;
          metadata?: Json;
          baseline_scenario_id?: string | null;
          kpis?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          category?: string | null;
          status?: DealStatus;
          basin?: string | null;
          metadata?: Json;
          baseline_scenario_id?: string | null;
          kpis?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_wells: {
        Row: {
          id: string;
          deal_id: string;
          well_id: string | null;
          slopcast_well_id: string;
          group_id: string | null;
          well_type: DealWellType;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          well_id?: string | null;
          slopcast_well_id: string;
          group_id?: string | null;
          well_type?: DealWellType;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          well_id?: string | null;
          slopcast_well_id?: string;
          group_id?: string | null;
          well_type?: DealWellType;
          metadata?: Json;
          created_at?: string;
        };
      };
      deal_well_groups: {
        Row: {
          id: string;
          deal_id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_production_profiles: {
        Row: {
          id: string;
          deal_id: string;
          group_id: string | null;
          well_id: string | null;
          name: string;
          qi: number;
          b: number;
          di: number;
          terminal_decline: number;
          gor_mcf_per_bbl: number;
          water_cut: number;
          params: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          qi: number;
          b: number;
          di: number;
          terminal_decline?: number;
          gor_mcf_per_bbl?: number;
          water_cut?: number;
          params?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          qi?: number;
          b?: number;
          di?: number;
          terminal_decline?: number;
          gor_mcf_per_bbl?: number;
          water_cut?: number;
          params?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_capex_profiles: {
        Row: {
          id: string;
          deal_id: string;
          group_id: string | null;
          well_id: string | null;
          name: string;
          rig_count: number;
          drill_duration_days: number;
          stim_duration_days: number;
          rig_start_date: string | null;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          rig_count?: number;
          drill_duration_days?: number;
          stim_duration_days?: number;
          rig_start_date?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          rig_count?: number;
          drill_duration_days?: number;
          stim_duration_days?: number;
          rig_start_date?: string | null;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_opex_profiles: {
        Row: {
          id: string;
          deal_id: string;
          group_id: string | null;
          well_id: string | null;
          name: string;
          segments: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          segments?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          segments?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_ownership_profiles: {
        Row: {
          id: string;
          deal_id: string;
          group_id: string | null;
          well_id: string | null;
          name: string;
          base_nri: number;
          base_cost_interest: number;
          agreements: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          base_nri?: number;
          base_cost_interest?: number;
          agreements?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          group_id?: string | null;
          well_id?: string | null;
          name?: string;
          base_nri?: number;
          base_cost_interest?: number;
          agreements?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_scenarios: {
        Row: {
          id: string;
          deal_id: string;
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
          deal_id: string;
          name: string;
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
        Update: {
          id?: string;
          deal_id?: string;
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
      deal_economics_runs: {
        Row: {
          id: string;
          deal_id: string;
          scenario_id: string | null;
          triggered_by: string;
          input_hash: string;
          portfolio_metrics: Json;
          group_metrics: Json;
          warnings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          scenario_id?: string | null;
          triggered_by: string;
          input_hash: string;
          portfolio_metrics?: Json;
          group_metrics?: Json;
          warnings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          scenario_id?: string | null;
          triggered_by?: string;
          input_hash?: string;
          portfolio_metrics?: Json;
          group_metrics?: Json;
          warnings?: Json;
          created_at?: string;
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
          p_run_kind?: string;
          p_engine_version?: string;
        };
        Returns: string;
      };
      current_deal_role: {
        Args: {
          target_deal_id: string;
        };
        Returns: string | null;
      };
      has_deal_access: {
        Args: {
          target_deal_id: string;
        };
        Returns: boolean;
      };
      save_deal_bundle: {
        Args: {
          p_deal_id: string | null;
          p_name: string;
          p_category: string | null;
          p_status: string | null;
          p_basin: string | null;
          p_metadata: Json;
          p_kpis: Json;
          p_well_groups: Json;
          p_wells: Json;
          p_production_profiles: Json;
          p_capex_profiles: Json;
          p_opex_profiles: Json;
          p_ownership_profiles: Json;
          p_scenarios: Json;
        };
        Returns: string;
      };
    };
  };
};
