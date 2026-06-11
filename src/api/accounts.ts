import request from "../utils/request";
import { Account, AccountType } from "../types";

export interface CreateAccountParams {
  name: string;
  type: AccountType;
  initialBalance: number;
  currency?: string;
  icon?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateAccountParams {
  name?: string;
  type?: AccountType;
  initialBalance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
}

export const accountsApi = {
  create: (params: CreateAccountParams): Promise<Account> => {
    return request.post("/accounts", params);
  },

  findAll: (): Promise<Account[]> => {
    return request.get("/accounts");
  },

  getSummary: (): Promise<{
    totalAccounts: number;
    totalBalance: number;
  }> => {
    return request.get("/accounts/summary");
  },

  findOne: (id: number): Promise<Account> => {
    return request.get(`/accounts/${id}`);
  },

  update: (id: number, params: UpdateAccountParams): Promise<Account> => {
    return request.patch(`/accounts/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/accounts/${id}`);
  },
};
