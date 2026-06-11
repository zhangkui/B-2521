import { defineStore } from "pinia";
import { Transaction, Category, Account, Budget, TransactionType } from "../types";
import { accountsApi } from "../api/accounts";
import { categoriesApi } from "../api/categories";
import {
  transactionsApi,
  QueryTransactionParams,
} from "../api/transactions";
import dayjs from "dayjs";

export const useFinanceStore = defineStore("finance", {
  state: () => ({
    transactions: [] as Transaction[],
    transactionPagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    },
    transactionSummary: {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
    },
    categories: [] as Category[],
    accounts: [] as Account[],
    budgets: [] as Budget[],
    loading: false,
  }),

  getters: {
    totalBalance: (state) =>
      state.accounts
        .filter((a) => a.visible !== false)
        .reduce((acc, curr) => acc + Number(curr.balance), 0),

    totalIncome: (state) =>
      state.transactions
        .filter((t) => t.type === "income")
        .reduce((acc, curr) => acc + Number(curr.amount), 0),

    totalExpense: (state) =>
      state.transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, curr) => acc + Number(curr.amount), 0),

    recentTransactions: (state) =>
      [...state.transactions]
        .sort((a, b) => {
          const dateA = new Date(a.transactionDate || a.createdAt).getTime();
          const dateB = new Date(b.transactionDate || b.createdAt).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 10),

    visibleAccounts: (state) =>
      state.accounts.filter((a) => a.visible !== false),

    incomeCategories: (state) =>
      state.categories.filter((c) => c.type === "income"),

    expenseCategories: (state) =>
      state.categories.filter((c) => c.type === "expense"),
  },

  actions: {
    async initialize() {
      await Promise.all([this.loadAccounts(), this.loadCategories()]);
    },

    async loadAccounts() {
      const accounts = await accountsApi.findAll();
      this.accounts = accounts.map((a) => ({
        ...a,
        balance: Number(a.balance),
        initialBalance: Number(a.initialBalance),
        visible: (a as any).visible ?? true,
      }));
      return this.accounts;
    },

    async loadCategories() {
      const categories = await categoriesApi.findAll();
      this.categories = categories;
      return this.categories;
    },

    async loadTransactions(params?: QueryTransactionParams) {
      this.loading = true;
      try {
        const result = await transactionsApi.findAll({
          page: 1,
          pageSize: 1000,
          ...params,
        });
        this.transactions = result.list.map((t) => ({
          ...t,
          amount: Number(t.amount),
        }));
        this.transactionPagination = result.pagination;
        this.transactionSummary = result.summary;
        return result;
      } finally {
        this.loading = false;
      }
    },

    async addAccount(account: any) {
      const created = await accountsApi.create(account);
      await this.loadAccounts();
      return created;
    },

    async updateAccount(updatedAccount: Account) {
      const { id, name, type, initialBalance, color, icon, description, isDefault } =
        updatedAccount;
      const result = await accountsApi.update(id, {
        name,
        type,
        initialBalance: Number(initialBalance),
        color: color || undefined,
        icon: icon || undefined,
        description: description || undefined,
        isDefault,
      });
      await this.loadAccounts();
      return result;
    },

    async deleteAccount(id: number) {
      const result = await accountsApi.remove(id);
      await this.loadAccounts();
      return result;
    },

    toggleAccountVisibility(id: number) {
      const account = this.accounts.find((a) => a.id === id);
      if (account) {
        account.visible = account.visible === false ? true : false;
      }
    },

    async addCategory(category: any) {
      const created = await categoriesApi.create(category);
      await this.loadCategories();
      return created;
    },

    async updateCategory(id: number, data: any) {
      const result = await categoriesApi.update(id, data);
      await this.loadCategories();
      return result;
    },

    async deleteCategory(id: number) {
      const result = await categoriesApi.remove(id);
      await this.loadCategories();
      return result;
    },

    async addTransaction(transaction: {
      amount: number;
      type: TransactionType;
      categoryId: number;
      accountId: number;
      date: string;
      note?: string;
    }) {
      const result = await transactionsApi.create({
        amount: Number(transaction.amount),
        type: transaction.type,
        categoryId: Number(transaction.categoryId),
        accountId: Number(transaction.accountId),
        transactionDate: transaction.date
          ? dayjs(transaction.date).toISOString()
          : new Date().toISOString(),
        note: transaction.note,
      });
      await this.loadTransactions();
      await this.loadAccounts();
      return result;
    },

    async updateTransaction(updatedTx: Transaction & { date?: string }) {
      const id = updatedTx.id;
      const result = await transactionsApi.update(id, {
        accountId: Number(updatedTx.accountId),
        categoryId: Number(updatedTx.categoryId),
        type: updatedTx.type,
        amount: Number(updatedTx.amount),
        transactionDate: updatedTx.date
          ? dayjs(updatedTx.date).toISOString()
          : updatedTx.transactionDate,
        note: updatedTx.note,
        description: updatedTx.description,
      });
      await this.loadTransactions();
      await this.loadAccounts();
      return result;
    },

    async deleteTransaction(id: number) {
      const result = await transactionsApi.remove(id);
      await this.loadTransactions();
      await this.loadAccounts();
      return result;
    },
  },
});
