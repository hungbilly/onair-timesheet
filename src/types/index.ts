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

export type CompanyIncome = {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  amount: number;
  deposit: "full" | "partial" | "balance";
  payment_method: "cash" | "bank_transfer" | "payme";
  date: string;
  job_status: "in_progress" | "completed";
  source: string;
  type: string;
  job_completion_date: string | null;
  created_at: string;
  created_by: string;
  client: string | null;
  payment_slip_path: string | null;
};
