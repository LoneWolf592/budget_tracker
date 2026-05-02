export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  month: number;
  year: number;
}

export type Category =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Utilities'
  | 'Income'
  | 'Other';

export interface AuthResponse {
  token: string;
  user: User;
}
