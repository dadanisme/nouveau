import { supabase } from '@/lib/supabase';

import type {
  DataSource,
  TransactionWithCategory,
  TransactionWithFullCategory,
} from '@/lib/data/types';

/** A signed-in account's data: the Supabase queries the hooks ran before guest mode (#100). */
export const remoteDataSource: DataSource = {
  kind: 'remote',

  async getTransactions(workspaceId, year, month, type) {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = supabase
      .from('transactions')
      .select(
        '*, category:categories!category_id(id, name, type, color, icon), receipt_proofs(count)',
      )
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as TransactionWithCategory[];
  },

  async getTransactionsByYear(workspaceId, year) {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        '*, category:categories!category_id(id, name, type, color, icon), receipt_proofs(count)',
      )
      .eq('workspace_id', workspaceId)
      .gte('date', `${year}-01-01`)
      .lt('date', `${year + 1}-01-01`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as TransactionWithCategory[];
  },

  async getTransaction(id) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as TransactionWithFullCategory;
  },

  async hasTransactions(workspaceId) {
    // One id at most, and no row data: only whether one exists.
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1);
    if (error) throw error;
    return data.length > 0;
  },

  async addTransaction(transaction) {
    const { error } = await supabase.from('transactions').insert(transaction);
    if (error) throw error;
  },

  async updateTransaction(id, updates) {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  async getCategories(workspaceId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async countCategoryTransactions(categoryId) {
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (error) throw error;
    return count ?? 0;
  },

  async addCategory(category) {
    const { error } = await supabase.from('categories').insert(category);
    if (error) throw error;
  },

  async updateCategory(id, updates) {
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  async getMyWorkspaces(userId) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*, workspace_members!inner(user_id)')
      .eq('workspace_members.user_id', userId)
      .order('is_personal', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(({ workspace_members: _, ...workspace }) => workspace);
  },

  async getWorkspace(id) {
    const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createWorkspace(args) {
    const { data, error } = await supabase.rpc('create_workspace', {
      name: args.name,
      home_currency: args.home_currency,
    });
    if (error) throw error;
    return data;
  },

  async updateWorkspace(id, updates) {
    const { error } = await supabase.from('workspaces').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteWorkspace(id) {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  },
};
