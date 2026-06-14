import request from "../utils/request";
import {
  Tag,
  TagStatsResponse,
  TagTrendResponse,
  TransactionType,
} from "../types";

export interface CreateTagParams {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateTagParams {
  name?: string;
  color?: string;
  icon?: string;
}

export interface TagTransactionParams {
  transactionId: number;
  tagIds: number[];
}

export interface QueryTagStatsParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
}

export interface QueryTagTrendParams {
  granularity: "day" | "week" | "month";
  tagId?: number;
  startDate?: string;
  endDate?: string;
  periods?: number;
}

export const tagsApi = {
  create: (params: CreateTagParams): Promise<Tag> => {
    return request.post("/tags", params);
  },

  findAll: (): Promise<Tag[]> => {
    return request.get("/tags");
  },

  getTagStats: (params?: QueryTagStatsParams): Promise<TagStatsResponse> => {
    return request.get("/tags/statistics", { params });
  },

  getTagTrend: (params: QueryTagTrendParams): Promise<TagTrendResponse> => {
    return request.get("/tags/trend", { params });
  },

  getTransactionTags: (transactionId: number): Promise<Tag[]> => {
    return request.get(`/tags/transaction/${transactionId}`);
  },

  tagTransaction: (params: TagTransactionParams): Promise<any> => {
    return request.post("/tags/tag-transaction", params);
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
};
