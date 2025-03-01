
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
  user_id: string;
  date: string;
  description: string;
  amount: number;
  receipt_path: string | null;
  created_at: string;
  expense_type?: "work" | "personal"; // Make it optional to handle existing data
};

export type User = {
  id: string;
  name: string;
  role: 'staff' | 'manager';
  hourlyRate: number;
};
