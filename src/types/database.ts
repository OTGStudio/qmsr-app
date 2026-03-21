/**
 * Supabase-generated database types for the `public` schema.
 * Regenerate when the schema changes (Docker running):
 *   npx supabase gen types typescript --local > src/types/database.ts
 */
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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          org_id: string | null
          user_id: string | null
          role: Database['public']['Enums']['org_role']
          invited_email: string | null
          accepted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          user_id?: string | null
          role?: Database['public']['Enums']['org_role']
          invited_email?: string | null
          accepted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          user_id?: string | null
          role?: Database['public']['Enums']['org_role']
          invited_email?: string | null
          accepted_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'org_members_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      scenarios: {
        Row: {
          id: string
          user_id: string | null
          org_id: string | null
          name: string
          notes: string | null
          product_name: string | null
          company_name: string | null
          fei_number: string | null
          insp_type: string
          marketed_us: boolean | null
          pathway: string | null
          manual_class: string | null
          class_source: string | null
          device_class: string | null
          product_code: string | null
          regulation_num: string | null
          risk: string | null
          signals: string[] | null
          ai_enabled: boolean | null
          sw_enabled: boolean | null
          cyber_enabled: boolean | null
          pccp_planned: boolean | null
          ratings: Json | null
          area_notes: Json | null
          fda_data: Json | null
          fda_pulled_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          name?: string
          notes?: string | null
          product_name?: string | null
          company_name?: string | null
          fei_number?: string | null
          insp_type?: string
          marketed_us?: boolean | null
          pathway?: string | null
          manual_class?: string | null
          class_source?: string | null
          device_class?: string | null
          product_code?: string | null
          regulation_num?: string | null
          risk?: string | null
          signals?: string[] | null
          ai_enabled?: boolean | null
          sw_enabled?: boolean | null
          cyber_enabled?: boolean | null
          pccp_planned?: boolean | null
          ratings?: Json | null
          area_notes?: Json | null
          fda_data?: Json | null
          fda_pulled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          name?: string
          notes?: string | null
          product_name?: string | null
          company_name?: string | null
          fei_number?: string | null
          insp_type?: string
          marketed_us?: boolean | null
          pathway?: string | null
          manual_class?: string | null
          class_source?: string | null
          device_class?: string | null
          product_code?: string | null
          regulation_num?: string | null
          risk?: string | null
          signals?: string[] | null
          ai_enabled?: boolean | null
          sw_enabled?: boolean | null
          cyber_enabled?: boolean | null
          pccp_planned?: boolean | null
          ratings?: Json | null
          area_notes?: Json | null
          fda_data?: Json | null
          fda_pulled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'scenarios_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      stripe_customers: {
        Row: {
          user_id: string
          customer_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          customer_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          customer_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          org_id: string | null
          stripe_sub_id: string
          stripe_price_id: string
          status: Database['public']['Enums']['subscription_status']
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          stripe_sub_id: string
          stripe_price_id: string
          status: Database['public']['Enums']['subscription_status']
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          stripe_sub_id?: string
          stripe_price_id?: string
          status?: Database['public']['Enums']['subscription_status']
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      org_role: 'owner' | 'admin' | 'member'
      subscription_status:
        | 'active'
        | 'trialing'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'incomplete'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
