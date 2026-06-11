import { defineStore } from "pinia";
import { User } from "../types";
import { authApi } from "../api/auth";
import { setToken, removeToken, setUser, removeUser } from "../utils/request";

interface RegisterParams {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

interface LoginParams {
  username: string;
  password: string;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: "",
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    displayName: (state) =>
      state.user?.nickname || state.user?.username || "用户",
  },

  actions: {
    async register(params: RegisterParams) {
      const result = await authApi.register(params);
      this.token = result.token;
      this.user = result.user as User;
      setToken(result.token);
      setUser(result.user);
      return result;
    },

    async login(params: LoginParams) {
      const result = await authApi.login(params);
      this.token = result.token;
      this.user = result.user as User;
      setToken(result.token);
      setUser(result.user);
      return result;
    },

    async logout() {
      try {
        await authApi.logout();
      } catch (_) {
      } finally {
        this.token = "";
        this.user = null;
        removeToken();
        removeUser();
      }
    },

    async fetchProfile() {
      try {
        const user = await authApi.getProfile();
        this.user = user as User;
        setUser(user);
        return user;
      } catch (error) {
        throw error;
      }
    },

    async updateProfile(params: {
      nickname?: string;
      avatar?: string;
      email?: string;
    }) {
      const user = await authApi.updateProfile(params);
      this.user = { ...this.user, ...user } as User;
      setUser(this.user);
      return user;
    },

    async changePassword(oldPassword: string, newPassword: string) {
      return authApi.changePassword({ oldPassword, newPassword });
    },

    restoreAuth() {
      const token = localStorage.getItem("totoro_token");
      const userStr = localStorage.getItem("totoro_user");
      if (token) {
        this.token = token;
      }
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (_) {
        }
      }
    },
  },
});
