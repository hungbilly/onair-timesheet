
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
};

export type User = {
  id: string;
  name: string;
  role: 'staff' | 'manager';
  hourlyRate: number;
};

export type CompanyIncomeRecord = {
  id: string;
  client: string;
  amount: number;
  date: string;
  brand: string;
  payment_type: string;
  created_at: string;
  created_by: string;
  payment_method: string;
  job_status: string;
  completion_date: string | null;
  job_type: string;
};
