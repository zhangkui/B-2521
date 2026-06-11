import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";
import router from "../router";

const TOKEN_KEY = "totoro_token";
const USER_KEY = "totoro_user";

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

const baseURL = (import.meta as any).env.VITE_API_BASE_URL || "/api";

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const response = error.response;
    const status = response?.status;
    const data = response?.data;

    let message = "请求失败，请稍后重试";

    if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.message) {
      message = data.message;
    } else {
      switch (status) {
        case 400:
          message = "请求参数错误";
          break;
        case 401:
          message = "登录已过期，请重新登录";
          removeToken();
          removeUser();
          router.push({ name: "Login" });
          break;
        case 403:
          message = "无权限访问该资源";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        case 502:
          message = "网关错误，请稍后重试";
          break;
        case 503:
          message = "服务暂时不可用，请稍后重试";
          break;
        default:
          if (error.message.includes("timeout")) {
            message = "请求超时，请检查网络连接";
          } else if (error.message.includes("Network Error")) {
            message = "网络错误，请检查网络连接";
          }
      }
    }

    if (status !== 401) {
      ElMessage.error(message);
    } else {
      ElMessage.warning(message);
    }

    return Promise.reject({
      status,
      message,
      data: data,
      originalError: error,
    });
  },
);

export default service;
