-- Create employee_details table
CREATE TABLE public.employee_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  address text,
  mobile text,
  salary_details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manager and admin access
CREATE POLICY "Managers and admins can view all employee details"
ON public.employee_details
FOR SELECT
USING (get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Managers and admins can insert employee details"
ON public.employee_details
FOR INSERT
WITH CHECK (get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Managers and admins can update employee details"
ON public.employee_details
FOR UPDATE
USING (get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Managers and admins can delete employee details"
ON public.employee_details
FOR DELETE
USING (get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_employee_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_details_timestamp
BEFORE UPDATE ON public.employee_details
FOR EACH ROW
EXECUTE FUNCTION public.update_employee_details_updated_at();