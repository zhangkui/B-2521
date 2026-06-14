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

export interface Tag {
  id: number;
  userId: number;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagStatItem {
  tag: Tag;
  income: {
    amount: number;
    count: number;
    percentage: number;
  };
  expense: {
    amount: number;
    count: number;
    percentage: number;
  };
  total: {
    amount: number;
    count: number;
  };
}

export interface TagStatsResponse {
  summary: {
    incomeTotal: number;
    expenseTotal: number;
    netTotal: number;
    transactionCount: number;
  };
  stats: TagStatItem[];
}

export interface TagTrendLabel {
  key: string;
  label: string;
}

export interface TagTrendItem {
  tagId: number;
  tagName: string;
  labels: TagTrendLabel[];
  income: number[];
  expense: number[];
  count: number[];
  incomeChange: number;
  expenseChange: number;
}

export interface TagTrendResponse {
  granularity: "day" | "week" | "month";
  labels: TagTrendLabel[];
  trends: TagTrendItem[];
}

export type ReportPeriod = "WEEKLY" | "MONTHLY";

export interface Report {
  id: number;
  userId: number;
  title: string;
  period: ReportPeriod;
  periodKey: string;
  startDate: string;
  endDate: string;
  content: any;
  createdAt: string;
}

export interface ReportSubscription {
  id: number;
  userId: number;
  period: ReportPeriod;
  isActive: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  list: Report[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
