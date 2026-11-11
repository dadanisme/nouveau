export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3';
  };
  public: {
    Tables: {
      ai_usage: {
        Row: {
          cost: number | null;
          created_at: string;
          id: string;
          input_tokens: number | null;
          model: string;
          operation: string;
          output_tokens: number | null;
          total_tokens: number | null;
          user_id: string;
        };
        Insert: {
          cost?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model: string;
          operation: string;
          output_tokens?: number | null;
          total_tokens?: number | null;
          user_id: string;
        };
        Update: {
          cost?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string;
          operation?: string;
          output_tokens?: number | null;
          total_tokens?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          color: string;
          created_at: string | null;
          icon: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          type: string;
          updated_at: string | null;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          color: string;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          type: string;
          updated_at?: string | null;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          color?: string;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'categories_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      email_classifications: {
        Row: {
          created_at: string;
          email_from: string | null;
          email_subject: string;
          id: string;
          is_transaction: boolean;
          model: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_from?: string | null;
          email_subject: string;
          id?: string;
          is_transaction: boolean;
          model: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_from?: string | null;
          email_subject?: string;
          id?: string;
          is_transaction?: boolean;
          model?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_classifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      exchange_rates: {
        Row: {
          base_currency: string;
          fetched_at: string;
          id: string;
          quote_currency: string;
          rate: number;
          rate_date: string;
        };
        Insert: {
          base_currency: string;
          fetched_at?: string;
          id?: string;
          quote_currency: string;
          rate: number;
          rate_date: string;
        };
        Update: {
          base_currency?: string;
          fetched_at?: string;
          id?: string;
          quote_currency?: string;
          rate?: number;
          rate_date?: string;
        };
        Relationships: [];
      };
      feature_subscriptions: {
        Row: {
          feature_id: string;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          notes: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          feature_id: string;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          feature_id?: string;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          notes?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feature_subscriptions_feature_id_fkey';
            columns: ['feature_id'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feature_subscriptions_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feature_subscriptions_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feature_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      features: {
        Row: {
          bypass: boolean;
          description: string | null;
          flag: string;
          id: string;
          name: string;
        };
        Insert: {
          bypass?: boolean;
          description?: string | null;
          flag: string;
          id?: string;
          name: string;
        };
        Update: {
          bypass?: boolean;
          description?: string | null;
          flag?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      premium_entitlements: {
        Row: {
          billing_issue_detected_at: string | null;
          created_at: string;
          entitlement_id: string;
          environment: string | null;
          expires_at: string | null;
          grace_period_expires_at: string | null;
          last_event_at: string;
          last_event_id: string;
          last_event_type: string;
          period_type: string | null;
          product_id: string | null;
          purchased_at: string | null;
          source: string;
          store: string | null;
          unsubscribe_detected_at: string | null;
          updated_at: string;
          user_id: string;
          will_renew: boolean;
        };
        Insert: {
          billing_issue_detected_at?: string | null;
          created_at?: string;
          entitlement_id?: string;
          environment?: string | null;
          expires_at?: string | null;
          grace_period_expires_at?: string | null;
          last_event_at: string;
          last_event_id: string;
          last_event_type: string;
          period_type?: string | null;
          product_id?: string | null;
          purchased_at?: string | null;
          source: string;
          store?: string | null;
          unsubscribe_detected_at?: string | null;
          updated_at?: string;
          user_id: string;
          will_renew?: boolean;
        };
        Update: {
          billing_issue_detected_at?: string | null;
          created_at?: string;
          entitlement_id?: string;
          environment?: string | null;
          expires_at?: string | null;
          grace_period_expires_at?: string | null;
          last_event_at?: string;
          last_event_id?: string;
          last_event_type?: string;
          period_type?: string | null;
          product_id?: string | null;
          purchased_at?: string | null;
          source?: string;
          store?: string | null;
          unsubscribe_detected_at?: string | null;
          updated_at?: string;
          user_id?: string;
          will_renew?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'premium_entitlements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt_proofs: {
        Row: {
          created_at: string | null;
          filename: string;
          id: string;
          mime_type: string;
          r2_key: string;
          size_bytes: number | null;
          transaction_id: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string | null;
          filename: string;
          id?: string;
          mime_type: string;
          r2_key: string;
          size_bytes?: number | null;
          transaction_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string | null;
          filename?: string;
          id?: string;
          mime_type?: string;
          r2_key?: string;
          size_bytes?: number | null;
          transaction_id?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'receipt_proofs_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipt_proofs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipt_proofs_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      storage_deletion_queue: {
        Row: {
          attempts: number;
          created_at: string;
          id: string;
          last_attempt_at: string | null;
          last_error: string | null;
          r2_key: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_attempt_at?: string | null;
          last_error?: string | null;
          r2_key: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_attempt_at?: string | null;
          last_error?: string | null;
          r2_key?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string | null;
          currency: string;
          date: string;
          description: string | null;
          home_amount: number;
          home_currency: string;
          id: string;
          order_id: string | null;
          type: string;
          updated_at: string | null;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string | null;
          currency?: string;
          date: string;
          description?: string | null;
          home_amount: number;
          home_currency?: string;
          id?: string;
          order_id?: string | null;
          type: string;
          updated_at?: string | null;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          home_amount?: number;
          home_currency?: string;
          id?: string;
          order_id?: string | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          active_workspace_id: string | null;
          ai_consent: string | null;
          ai_consent_updated_at: string | null;
          created_at: string | null;
          currency: string;
          display_name: string;
          email: string;
          id: string;
          profile_image: string | null;
          role: string;
          role_updated_by: string | null;
          theme: string;
          updated_at: string | null;
        };
        Insert: {
          active_workspace_id?: string | null;
          ai_consent?: string | null;
          ai_consent_updated_at?: string | null;
          created_at?: string | null;
          currency?: string;
          display_name: string;
          email: string;
          id?: string;
          profile_image?: string | null;
          role?: string;
          role_updated_by?: string | null;
          theme?: string;
          updated_at?: string | null;
        };
        Update: {
          active_workspace_id?: string | null;
          ai_consent?: string | null;
          ai_consent_updated_at?: string | null;
          created_at?: string | null;
          currency?: string;
          display_name?: string;
          email?: string;
          id?: string;
          profile_image?: string | null;
          role?: string;
          role_updated_by?: string | null;
          theme?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_active_workspace_id_fkey';
            columns: ['active_workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_role_updated_by_fkey';
            columns: ['role_updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      waiting_list: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      workspace_invites: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          status: string;
          token: string;
          workspace_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          status?: string;
          token: string;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          status?: string;
          token?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_invites_accepted_by_fkey';
            columns: ['accepted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_invites_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      workspace_members: {
        Row: {
          joined_at: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          joined_at?: string;
          role?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          joined_at?: string;
          role?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          home_currency: string;
          id: string;
          is_personal: boolean;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          home_currency?: string;
          id?: string;
          is_personal?: boolean;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          home_currency?: string;
          id?: string;
          is_personal?: boolean;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      workspace_member_profiles: {
        Row: {
          display_name: string | null;
          email: string | null;
          joined_at: string | null;
          profile_image: string | null;
          role: string | null;
          user_id: string | null;
          workspace_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      accept_workspace_invite: { Args: { token: string }; Returns: string };
      claim_storage_deletions: {
        Args: {
          p_limit?: number;
          p_max_attempts?: number;
          p_retry_after?: string;
        };
        Returns: {
          attempts: number;
          id: string;
          r2_key: string;
        }[];
      };
      create_workspace: {
        Args: { home_currency?: string; name: string };
        Returns: string;
      };
      create_workspace_invite: {
        Args: { email: string; expires_in_hours?: number; workspace_id: string };
        Returns: {
          expires_at: string;
          id: string;
          token: string;
        }[];
      };
      decline_workspace_invite: { Args: { token: string }; Returns: undefined };
      delete_account: { Args: { p_user_id: string }; Returns: Json };
      delete_account_plan: {
        Args: { p_user_id: string };
        Returns: {
          action: string;
          owner_id: string;
          workspace_id: string;
        }[];
      };
      delete_account_preview: { Args: { p_user_id: string }; Returns: Json };
      get_balance: { Args: { uid: string }; Returns: number };
      get_monthly_totals: {
        Args: { end_date: string; start_date: string; uid: string };
        Returns: {
          expense: number;
          income: number;
        }[];
      };
      get_workspace_balance: { Args: { workspace: string }; Returns: number };
      get_workspace_monthly_totals: {
        Args: { end_date: string; start_date: string; workspace: string };
        Returns: {
          expense: number;
          income: number;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      is_workspace_member: { Args: { workspace: string }; Returns: boolean };
      upsert_premium_entitlement: {
        Args: { p_entitlement: Json };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
