export type TransactionType = "income" | "expense" | "INCOME" | "EXPENSE";

export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type AccountType =
  | "CASH"
  | "BANK_CARD"
  | "CREDIT_CARD"
  | "ALIPAY"
  | "WECHAT"
  | "INVESTMENT"
  | "OTHER";

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  visible?: boolean;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  parentId: number | null;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  description: string | null;
  note: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  };
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    type: TransactionType;
  };
}

export interface Pagination<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    type: TransactionType;
  };
  amount: number;
  month: string;
  spent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentage: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    type: TransactionType;
  };
  amount: number;
  spent: number;
  month: string;
}

export interface DashboardOverview {
  totalBalance: number;
  currentMonth: {
    income: number;
    expense: number;
  };
  prevMonth: {
    income: number;
    expense: number;
  };
  incomeChange: number;
  expenseChange: number;
  budget: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    percentage: number;
  };
}

export interface DashboardChartData {
  labels: string[];
  income: number[];
  expense: number[];
}
