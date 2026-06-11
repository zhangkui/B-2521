import request from "../utils/request";
import { Budget, BudgetSummary } from "../types";

export interface CreateBudgetParams {
  categoryId: number;
  amount: number;
  month: string;
}

export interface UpdateBudgetParams {
  categoryId?: number;
  amount?: number;
  month?: string;
}

export interface QueryBudgetParams {
  month?: string;
  categoryId?: number;
}

export const budgetsApi = {
  create: (params: CreateBudgetParams): Promise<Budget> => {
    return request.post("/budgets", params);
  },

  findAll: (params?: QueryBudgetParams): Promise<Budget[]> => {
    return request.get("/budgets", { params });
  },

  getSummary: (month?: string): Promise<BudgetSummary> => {
    return request.get("/budgets/summary", { params: { month } });
  },

  findOne: (id: number): Promise<Budget> => {
    return request.get(`/budgets/${id}`);
  },

  update: (id: number, params: UpdateBudgetParams): Promise<Budget> => {
    return request.patch(`/budgets/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/budgets/${id}`);
  },
};
