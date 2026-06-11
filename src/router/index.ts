import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
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
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const user = localStorage.getItem("totoro_user");
  if (to.name !== "Login" && !user) {
    next({ name: "Login" });
  } else {
    next();
  }
});

export default router;
