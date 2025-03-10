
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, parse } from "date-fns";

interface MonthSelectorProps {
  selectedMonth: string; // format: "YYYY-MM"
  onChange: (month: string) => void;
  label?: string;
}

const MonthSelector = ({ selectedMonth, onChange, label = "Select Month:" }: MonthSelectorProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    parse(selectedMonth, "yyyy-MM", new Date())
  );

  useEffect(() => {
    // Update internal state when the prop changes
    setCurrentMonth(parse(selectedMonth, "yyyy-MM", new Date()));
  }, [selectedMonth]);

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    const formattedMonth = format(prevMonth, "yyyy-MM");
    setCurrentMonth(prevMonth);
    onChange(formattedMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    const formattedMonth = format(nextMonth, "yyyy-MM");
    setCurrentMonth(nextMonth);
    onChange(formattedMonth);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="expense-month" className="font-medium whitespace-nowrap">
        {label}
      </label>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handlePreviousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input
          type="month"
          id="expense-month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="border rounded px-2 py-1 mx-1 w-40"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MonthSelector;
