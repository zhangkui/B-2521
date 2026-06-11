import { defineStore } from "pinia";
import { Transaction, Category, Account, Budget } from "../types";
import {
  storage,
  KEYS,
  initialCategories,
  initialAccounts,
  initialTransactions,
} from "../utils/storage";

export const useFinanceStore = defineStore("finance", {
  state: () => ({
    transactions: storage
      .get<Transaction[]>(KEYS.TRANSACTIONS, initialTransactions)
      .map((tx) => ({
        ...tx,
        createdAt: tx.createdAt || new Date(tx.date).getTime(),
      })),
    categories: storage.get<Category[]>(KEYS.CATEGORIES, initialCategories),
    accounts: storage
      .get<Account[]>(KEYS.ACCOUNTS, initialAccounts)
      .map((acc) => ({ ...acc, visible: acc.visible ?? true })),
    budgets: storage.get<Budget[]>(KEYS.BUDGETS, []),
  }),
  getters: {
    totalBalance: (state) =>
      state.accounts
        .filter((a) => a.visible !== false)
        .reduce((acc, curr) => acc + curr.balance, 0),
    totalIncome: (state) =>
      state.transactions
        .filter((t) => t.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0),
    totalExpense: (state) =>
      state.transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, curr) => acc + curr.amount, 0),
    recentTransactions: (state) =>
      [...state.transactions]
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateB - dateA;
          return b.createdAt - a.createdAt;
        })
        .slice(0, 10),
  },
  actions: {
    addTransaction(transaction: Omit<Transaction, "id" | "createdAt">) {
      const newTransaction: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
      };
      this.transactions.push(newTransaction);

      // Update account balance
      const account = this.accounts.find((a) => a.id === transaction.accountId);
      if (account) {
        if (transaction.type === "income")
          account.balance += transaction.amount;
        else account.balance -= transaction.amount;
      }

      this.syncStorage();
    },
    deleteTransaction(id: string) {
      const index = this.transactions.findIndex((t) => t.id === id);
      if (index !== -1) {
        const transaction = this.transactions[index];
        const account = this.accounts.find(
          (a) => a.id === transaction.accountId,
        );
        if (account) {
          if (transaction.type === "income")
            account.balance -= transaction.amount;
          else account.balance += transaction.amount;
        }
        this.transactions.splice(index, 1);
        this.syncStorage();
      }
    },
    addAccount(account: Omit<Account, "id">) {
      const newAccount = {
        ...account,
        id: Math.random().toString(36).substr(2, 9),
        visible: true,
      };
      this.accounts.push(newAccount);
      this.syncStorage();
    },
    toggleAccountVisibility(id: string) {
      const account = this.accounts.find((a) => a.id === id);
      if (account) {
        account.visible = !account.visible;
        this.syncStorage();
      }
    },
    deleteAccount(id: string) {
      const index = this.accounts.findIndex((a) => a.id === id);
      if (index !== -1) {
        this.accounts.splice(index, 1);
        this.syncStorage();
      }
    },
    updateAccount(updatedAccount: Account) {
      const index = this.accounts.findIndex((a) => a.id === updatedAccount.id);
      if (index !== -1) {
        this.accounts[index] = updatedAccount;
        this.syncStorage();
      }
    },
    updateTransaction(updatedTx: Transaction) {
      const index = this.transactions.findIndex((t) => t.id === updatedTx.id);
      if (index !== -1) {
        const oldTx = this.transactions[index];

        // 1. Revert old transaction effect on account balance
        const oldAccount = this.accounts.find((a) => a.id === oldTx.accountId);
        if (oldAccount) {
          if (oldTx.type === "income") {
            oldAccount.balance -= oldTx.amount;
          } else {
            oldAccount.balance += oldTx.amount;
          }
        }

        // 2. Apply new transaction effect on account balance
        const newAccount = this.accounts.find(
          (a) => a.id === updatedTx.accountId,
        );
        if (newAccount) {
          if (updatedTx.type === "income") {
            newAccount.balance += updatedTx.amount;
          } else {
            newAccount.balance -= updatedTx.amount;
          }
        }

        // 3. Update the transaction record
        this.transactions[index] = updatedTx;
        this.syncStorage();
      }
    },
    syncStorage() {
      storage.set(KEYS.TRANSACTIONS, this.transactions);
      storage.set(KEYS.CATEGORIES, this.categories);
      storage.set(KEYS.ACCOUNTS, this.accounts);
      storage.set(KEYS.BUDGETS, this.budgets);
    },
  },
});
