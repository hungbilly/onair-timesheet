
export const getMonthDateRange = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = `${yearMonth}-01`;
  
  // Calculate the last day of the month using native JavaScript Date
  // Setting day to 0 gets us the last day of the previous month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  
  return { startDate, endDate };
};
