import request from "../utils/request";
import { Category, TransactionType } from "../types";

export interface CreateCategoryParams {
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface UpdateCategoryParams {
  name?: string;
  type?: TransactionType;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface QueryCategoryParams {
  type?: TransactionType;
}

export const categoriesApi = {
  create: (params: CreateCategoryParams): Promise<Category> => {
    return request.post("/categories", params);
  },

  findAll: (params?: QueryCategoryParams): Promise<Category[]> => {
    return request.get("/categories", { params });
  },

  findByType: (type: TransactionType): Promise<Category[]> => {
    return request.get(`/categories/type/${type}`);
  },

  findOne: (id: number): Promise<Category> => {
    return request.get(`/categories/${id}`);
  },

  update: (
    id: number,
    params: UpdateCategoryParams,
  ): Promise<Category> => {
    return request.patch(`/categories/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/categories/${id}`);
  },
};
