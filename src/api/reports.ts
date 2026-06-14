import request from "../utils/request";
import { Report, ReportSubscription, ReportListResponse, ReportPeriod } from "../types";

export interface CreateSubscriptionParams {
  period: ReportPeriod;
}

export interface UpdateSubscriptionParams {
  isActive?: boolean;
}

export interface QueryReportParams {
  period?: ReportPeriod;
  page?: number;
  pageSize?: number;
}

export interface GenerateReportParams {
  period: ReportPeriod;
  periodKey?: string;
}

export const reportsApi = {
  createSubscription: (params: CreateSubscriptionParams): Promise<ReportSubscription> => {
    return request.post("/reports/subscriptions", params);
  },

  getSubscriptions: (): Promise<ReportSubscription[]> => {
    return request.get("/reports/subscriptions");
  },

  updateSubscription: (
    id: number,
    params: UpdateSubscriptionParams,
  ): Promise<ReportSubscription> => {
    return request.patch(`/reports/subscriptions/${id}`, params);
  },

  removeSubscription: (id: number): Promise<{ message: string }> => {
    return request.delete(`/reports/subscriptions/${id}`);
  },

  generateReport: (params: GenerateReportParams): Promise<Report> => {
    return request.post("/reports/generate", params);
  },

  getReports: (params?: QueryReportParams): Promise<ReportListResponse> => {
    return request.get("/reports", { params });
  },

  getReportDetail: (id: number): Promise<Report> => {
    return request.get(`/reports/${id}`);
  },

  deleteReport: (id: number): Promise<{ message: string }> => {
    return request.delete(`/reports/${id}`);
  },
};
