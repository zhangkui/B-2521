import request from "../utils/request";
import { LoginResponse } from "../types";

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export const authApi = {
  register: (params: RegisterParams): Promise<LoginResponse> => {
    return request.post("/auth/register", params);
  },

  login: (params: LoginParams): Promise<LoginResponse> => {
    return request.post("/auth/login", params);
  },

  logout: (): Promise<{ message: string }> => {
    return request.post("/auth/logout");
  },

  getProfile: (): Promise<any> => {
    return request.get("/users/profile");
  },

  updateProfile: (params: {
    nickname?: string;
    avatar?: string;
    email?: string;
  }): Promise<any> => {
    return request.put("/users/profile", params);
  },

  changePassword: (params: {
    oldPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    return request.patch("/users/password", params);
  },
};
