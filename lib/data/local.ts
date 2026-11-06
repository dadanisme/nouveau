import { SignInRequiredError, type DataSource } from '@/lib/data/types';
import i18n from '@/lib/i18n';
import { getLocalDb } from '@/lib/local-db';
import { k } from '@/locales/keys';

/**
 * A guest's data, in the on-device store (`lib/local-db`). Same row shapes as `remote.ts`. A guest
 * has one Personal workspace, so creating or deleting one needs an account.
 */
export const localDataSource: DataSource = {
  kind: 'local',

  async getTransactions(workspaceId, year, month, type) {
    return (await getLocalDb()).getTransactionsForMonth(workspaceId, year, month, type);
  },

  async getTransactionsByYear(workspaceId, year) {
    return (await getLocalDb()).getTransactionsForYear(workspaceId, year);
  },

  async getTransaction(id) {
    return (await getLocalDb()).getTransaction(id);
  },

  async hasTransactions(workspaceId) {
    return (await getLocalDb()).hasTransactions(workspaceId);
  },

  async addTransaction(transaction) {
    await (await getLocalDb()).insertTransaction(transaction);
  },

  async updateTransaction(id, updates) {
    await (await getLocalDb()).updateTransaction(id, updates);
  },

  async deleteTransaction(id) {
    await (await getLocalDb()).deleteTransaction(id);
  },

  async getCategories(workspaceId) {
    return (await getLocalDb()).getCategories(workspaceId);
  },

  async countCategoryTransactions(categoryId) {
    return (await getLocalDb()).countCategoryTransactions(categoryId);
  },

  async addCategory(category) {
    await (await getLocalDb()).insertCategory(category);
  },

  async updateCategory(id, updates) {
    await (await getLocalDb()).updateCategory(id, updates);
  },

  async deleteCategory(id) {
    await (await getLocalDb()).deleteCategory(id);
  },

  async getMyWorkspaces(userId) {
    return (await getLocalDb()).getWorkspacesOwnedBy(userId);
  },

  async getWorkspace(id) {
    return (await getLocalDb()).getWorkspace(id);
  },

  async createWorkspace() {
    throw new SignInRequiredError(i18n.t(k.common.signInRequired));
  },

  async updateWorkspace(id, updates) {
    await (await getLocalDb()).updateWorkspace(id, updates);
  },

  async deleteWorkspace() {
    throw new SignInRequiredError(i18n.t(k.common.signInRequired));
  },
};
