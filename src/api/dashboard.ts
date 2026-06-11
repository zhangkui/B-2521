import request from "../utils/request";
import { DashboardOverview, DashboardChartData } from "../types";

export const dashboardApi = {
  getOverview: (): Promise<DashboardOverview> => {
    return request.get("/dashboard/overview");
  },

  getChartData: (period: "week" | "month" = "week"): Promise<DashboardChartData> => {
    return request.get("/dashboard/chart", { params: { period } });
  },
};
