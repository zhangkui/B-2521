import { Category, Account, Transaction } from "../types";

const KEYS = {
  TRANSACTIONS: "totoro_transactions",
  CATEGORIES: "totoro_categories",
  ACCOUNTS: "totoro_accounts",
  BUDGETS: "totoro_budgets",
  USER: "totoro_user",
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  },
  set: <T>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

export const initialCategories: Category[] = [
  {
    id: "1",
    name: "餐饮",
    icon: "Utensils",
    color: "#f87171",
    type: "expense",
  },
  {
    id: "2",
    name: "购物",
    icon: "ShoppingBag",
    color: "#fb923c",
    type: "expense",
  },
  { id: "3", name: "交通", icon: "Bus", color: "#fbbf24", type: "expense" },
  {
    id: "4",
    name: "娱乐",
    icon: "Gamepad2",
    color: "#4ade80",
    type: "expense",
  },
  { id: "5", name: "住房", icon: "Home", color: "#2dd4bf", type: "expense" },
  { id: "6", name: "工资", icon: "Wallet", color: "#3b82f6", type: "income" },
  {
    id: "7",
    name: "理财",
    icon: "TrendingUp",
    color: "#8b5cf6",
    type: "income",
  },
  { id: "8", name: "礼金", icon: "Gift", color: "#ec4899", type: "income" },
];

export const initialAccounts: Account[] = [
  { id: "1", name: "现金", type: "cash", balance: 1000, color: "#64748b" },
  { id: "2", name: "招商银行", type: "bank", balance: 15420, color: "#ef4444" },
  { id: "3", name: "支付宝", type: "alipay", balance: 5280, color: "#0ea5e9" },
  {
    id: "4",
    name: "微信支付",
    type: "wechat",
    balance: 3150,
    color: "#22c55e",
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: "t1",
    amount: 35.5,
    type: "expense",
    categoryId: "1",
    accountId: "3",
    date: "2026-02-08",
    note: "午餐隆江猪脚饭",
    createdAt: 1739000000000 + 12 * 3600000 + 30 * 60000, // 12:30:00
  },
  {
    id: "t5",
    amount: 15,
    type: "expense",
    categoryId: "3",
    accountId: "4",
    date: "2026-02-08",
    note: "打车去公司",
    createdAt: 1739000000000 + 8 * 3600000 + 45 * 60000, // 08:45:00
  },
  {
    id: "t2",
    amount: 128,
    type: "expense",
    categoryId: "2",
    accountId: "3",
    date: "2026-02-07",
    note: "优衣库T恤",
    createdAt: 1738913400000 + 15 * 3600000 + 20 * 60000, // 15:20:00
  },
  {
    id: "t8",
    amount: 12.5,
    type: "expense",
    categoryId: "1",
    accountId: "4",
    date: "2026-02-07",
    note: "瑞幸咖啡",
    createdAt: 1738913400000 + 10 * 3600000 + 15 * 60000, // 10:15:00
  },
  {
    id: "t6",
    amount: 45,
    type: "expense",
    categoryId: "4",
    accountId: "1",
    date: "2026-02-06",
    note: "电影票《流浪地球》",
    createdAt: 1738827000000 + 19 * 3600000 + 40 * 60000, // 19:40:00
  },
  {
    id: "t3",
    amount: 8000,
    type: "income",
    categoryId: "6",
    accountId: "2",
    date: "2026-02-05",
    note: "1月工资发放",
    createdAt: 1738740600000 + 9 * 3600000 + 5 * 60000, // 09:05:00
  },
  {
    id: "t7",
    amount: 200,
    type: "income",
    categoryId: "8",
    accountId: "4",
    date: "2026-02-04",
    note: "收到生日红包",
    createdAt: 1738654200000 + 0 * 3600000 + 5 * 60000, // 00:05:00
  },
  {
    id: "t4",
    amount: 2500,
    type: "expense",
    categoryId: "5",
    accountId: "2",
    date: "2026-02-01",
    note: "2月房租缴纳",
    createdAt: 1738395000000 + 10 * 3600000 + 0 * 60000, // 10:00:00
  },
];

export { KEYS };
