import request from "../utils/request";
import { Tag } from "../types";

export interface CreateTagParams {
  name: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateTagParams {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export interface QueryTagParams {
  keyword?: string;
}

export const tagsApi = {
  create: (params: CreateTagParams): Promise<Tag> => {
    return request.post("/tags", params);
  },

  findAll: (params?: QueryTagParams): Promise<Tag[]> => {
    return request.get("/tags", { params });
  },

  findOne: (id: number): Promise<Tag> => {
    return request.get(`/tags/${id}`);
  },

  update: (id: number, params: UpdateTagParams): Promise<Tag> => {
    return request.patch(`/tags/${id}`, params);
  },

  remove: (id: number): Promise<{ message: string }> => {
    return request.delete(`/tags/${id}`);
  },

  getTransactionTags: (transactionId: number): Promise<Tag[]> => {
    return request.get(`/tags/transaction/${transactionId}`);
  },

  updateTransactionTags: (
    transactionId: number,
    tagIds: number[],
  ): Promise<Tag[]> => {
    return request.patch(`/tags/transaction/${transactionId}`, { tagIds });
  },
};
