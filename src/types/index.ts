export type TimeEntry = {
  id: string;
  date: Date;
  hours: number;
  project: string;
  description: string;
  userId: string;
};

export type ExpenseEntry = {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  userId: string;
  receipt?: string;
};

export type User = {
  id: string;
  name: string;
  role: 'staff' | 'manager';
  hourlyRate: number;
};