import request from "../utils/request";
import { MonthlyReport } from "../types";

export const reportsApi = {
  getMonthlyReport: (month?: string): Promise<MonthlyReport> => {
    return request.get("/reports/monthly", { params: { month } });
  },
};
