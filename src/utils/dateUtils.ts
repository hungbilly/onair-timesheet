import { endOfMonth, format } from "date-fns";

export const getMonthDateRange = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = `${yearMonth}-01`;
  const endDate = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
  return { startDate, endDate };
};