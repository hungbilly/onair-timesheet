
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { CompanyIncomeRecord } from "@/types";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export const getCurrentMonthRange = (): DateRange => {
  const today = new Date();
  return {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today)
  };
};

export const formatDateForSupabase = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export const formatDateForDisplay = (date: Date): string => {
  return format(date, "MMM d, yyyy");
};

export const isWithinRange = (dateStr: string, range: DateRange): boolean => {
  const date = parseISO(dateStr);
  return date >= range.startDate && date <= range.endDate;
};

export const groupByBrand = (
  records: CompanyIncomeRecord[], 
  dateRange: DateRange
): Record<string, number> => {
  const filtered = records.filter(record => 
    isWithinRange(record.date, dateRange)
  );
  
  return filtered.reduce((acc, record) => {
    const { brand, amount } = record;
    if (!acc[brand]) {
      acc[brand] = 0;
    }
    acc[brand] += Number(amount);
    return acc;
  }, {} as Record<string, number>);
};
