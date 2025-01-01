export type TimeEntry = {
  id: string;
  user_id: string;
  date: string;
  work_type: "hourly" | "job";
  job_description: string;
  hours: number | null;
  hourly_rate: number | null;
  start_time: string | null;
  end_time: string | null;
  job_count: number | null;
  job_rate: number | null;
  total_salary: number;
  created_at: string;
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