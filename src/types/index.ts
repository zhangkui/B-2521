export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Account {
  id: string;
  name: string;
  type: "bank" | "cash" | "alipay" | "wechat" | "credit_card";
  balance: number;
  color: string;
  visible?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
  createdAt: number;
}

export interface Budget {
  categoryId: string;
  amount: number;
  spent: number;
}
