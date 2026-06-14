import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import { useAuthStore } from "../store/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: MainLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/Dashboard.vue"),
      },
      {
        path: "transactions",
        name: "Transactions",
        component: () => import("../views/Transactions.vue"),
      },
      {
        path: "analysis",
        name: "Analysis",
        component: () => import("../views/Analysis.vue"),
      },
      {
        path: "budget",
        name: "Budget",
        component: () => import("../views/Budget.vue"),
      },
      {
        path: "accounts",
        name: "Accounts",
        component: () => import("../views/Accounts.vue"),
      },
      {
        path: "categories",
        name: "Categories",
        component: () => import("../views/Categories.vue"),
      },
      {
        path: "tag-stats",
        name: "TagStats",
        component: () => import("../views/TagStats.vue"),
      },
      {
        path: "tag-trend",
        name: "TagTrend",
        component: () => import("../views/TagTrend.vue"),
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("../views/ReportHistory.vue"),
      },
      {
        path: "report-history",
        name: "ReportHistory",
        component: () => import("../views/ReportHistory.vue"),
      },
      {
        path: "report-subscription",
        name: "ReportSubscription",
        component: () => import("../views/ReportSubscription.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  authStore.restoreAuth();

  if (to.meta.public) {
    if (authStore.isLoggedIn) {
      next({ name: "Dashboard" });
    } else {
      next();
    }
    return;
  }

  if (!authStore.isLoggedIn) {
    next({ name: "Login" });
    return;
  }

  if (!authStore.user) {
    try {
      await authStore.fetchProfile();
    } catch (_) {
      authStore.logout();
      next({ name: "Login" });
      return;
    }
  }

  next();
});

export default router;
