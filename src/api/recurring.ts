import request from "../utils/request";
import { RecurringTransaction, RecurringFrequency, TransactionType } from "../types";

export interface CreateRecurringParams {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  description?: string;
  note?: string;
  isActive?: boolean;
  tagIds?: number[];
}

export interface UpdateRecurringParams {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  amount?: number;
  frequency?: RecurringFrequency;
  startDate?: string;
  endDate?: string;
  description?: string;
  note?: string;
  isActive?: boolean;
  tagIds?: number[];
}

export interface QueryRecurringParams {
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  frequency?: RecurringFrequency;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RecurringPagination<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const recurringApi = {
  create: (params: CreateRecurringParams): Promise<RecurringTransaction> => {
    return request.post("/recurring", params);
  },

  findAll: (
    params?: QueryRecurringParams,
  ): Promise<RecurringPagination<RecurringTransaction>> => {
    return request.get("/recurring", { params });
  },

  findOne: (id: number): Promise<RecurringTransaction> => {
    return request.get(`/recurring/${id}`);
  },

  update: (
    id: number,
    params: UpdateRecurringParams,
  ): Promise<RecurringTransaction> => {
    return request.patch(`/recurring/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/recurring/${id}`);
  },

  generate: (
    id: number,
    untilDate?: string,
  ): Promise<{
    generatedCount: number;
    transactions: any[];
  }> => {
    return request.post(`/recurring/${id}/generate`, { untilDate });
  },

  getPreview: (
    id: number,
    count?: number,
  ): Promise<{
    id: number;
    amount: number;
    type: TransactionType;
    frequency: RecurringFrequency;
    previewDates: string[];
  }> => {
    return request.get(`/recurring/${id}/preview`, { params: { count } });
  },
};
