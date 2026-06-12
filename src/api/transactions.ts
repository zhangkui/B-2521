import request from "../utils/request";
import { Transaction, Pagination, TransactionType } from "../types";

export interface CreateTransactionParams {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  description?: string;
  note?: string;
}

export interface UpdateTransactionParams {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  amount?: number;
  transactionDate?: string;
  description?: string;
  note?: string;
}

export interface QueryTransactionParams {
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const transactionsApi = {
  create: (params: CreateTransactionParams): Promise<Transaction> => {
    return request.post("/transactions", params);
  },

  findAll: (
    params?: QueryTransactionParams,
  ): Promise<Pagination<Transaction>> => {
    return request.get("/transactions", { params });
  },

  getStatistics: (
    params?: QueryTransactionParams,
  ): Promise<{
    summary: {
      totalIncome: number;
      totalExpense: number;
      netBalance: number;
    };
    expenseByCategory: Array<{
      category: any;
      totalAmount: number;
      count: number;
    }>;
    incomeByCategory: Array<{
      category: any;
      totalAmount: number;
      count: number;
    }>;
  }> => {
    return request.get("/transactions/statistics", { params });
  },

  findOne: (id: number): Promise<Transaction> => {
    return request.get(`/transactions/${id}`);
  },

  update: (
    id: number,
    params: UpdateTransactionParams,
  ): Promise<Transaction> => {
    return request.patch(`/transactions/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/transactions/${id}`);
  },
};
