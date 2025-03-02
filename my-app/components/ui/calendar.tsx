import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayClickEventHandler } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  dayCounts?: Record<string, number>;
  getGradientColor?: (value: number, minValue: number, maxValue: number) => string;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  dayCounts = {},
  getGradientColor,
  ...props
}: CalendarProps) {
  const dayCountValues = Object.values(dayCounts);
  const maxDayCount = dayCountValues.length ? Math.max(...dayCountValues) : 0;

  const renderDay = (day: Date, modifiers: Record<string, boolean>) => {
    const dateStr = day instanceof Date && !isNaN(day.getTime()) ? format(day, 'yyyy-MM-dd') : '';
    const count = dayCounts[dateStr] || 0;

    let style: React.CSSProperties = {};
    let textColor = '';
    let isOutside = modifiers.outside;

    if (count > 0 && getGradientColor) {
      const bgColor = getGradientColor(count, 0, maxDayCount);
      style.backgroundColor = bgColor;
      
      // Determine text color based on background brightness
      const rgb = bgColor.replace(/[^\d,]/g, '').split(',').map(Number);
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      textColor = brightness > 150 ? 'text-gray-900' : 'text-white';
    }

    return (
      <div
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal flex items-center justify-center rounded-md",
          modifiers.selected && "bg-primary text-primary-foreground",
          modifiers.today && !modifiers.selected && "border border-gray-300",
          isOutside && "text-muted-foreground opacity-50",
          textColor
        )}
        style={style}
      >
        {day instanceof Date && !isNaN(day.getTime()) ? day.getDate() : ''}
      </div>
    );
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "",
        day_outside: "day-outside aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        Day: renderDay
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };