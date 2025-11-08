
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
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
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-semibold aria-selected:opacity-100 text-foreground hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 [&:nth-child(7n+1)]:hover:from-red-50 [&:nth-child(7n+1)]:hover:to-pink-50 [&:nth-child(7n+2)]:hover:from-orange-50 [&:nth-child(7n+2)]:hover:to-amber-50 [&:nth-child(7n+3)]:hover:from-yellow-50 [&:nth-child(7n+3)]:hover:to-lime-50 [&:nth-child(7n+4)]:hover:from-green-50 [&:nth-child(7n+4)]:hover:to-emerald-50 [&:nth-child(7n+5)]:hover:from-teal-50 [&:nth-child(7n+5)]:hover:to-cyan-50 [&:nth-child(7n+6)]:hover:from-blue-50 [&:nth-child(7n+6)]:hover:to-indigo-50 [&:nth-child(7n+7)]:hover:from-purple-50 [&:nth-child(7n+7)]:hover:to-pink-50"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br text-foreground hover:shadow-md focus:shadow-md font-bold border-2 [&:nth-child(7n+1)]:from-red-100 [&:nth-child(7n+1)]:to-pink-100 [&:nth-child(7n+1)]:border-red-300 [&:nth-child(7n+2)]:from-orange-100 [&:nth-child(7n+2)]:to-amber-100 [&:nth-child(7n+2)]:border-orange-300 [&:nth-child(7n+3)]:from-yellow-100 [&:nth-child(7n+3)]:to-lime-100 [&:nth-child(7n+3)]:border-yellow-300 [&:nth-child(7n+4)]:from-green-100 [&:nth-child(7n+4)]:to-emerald-100 [&:nth-child(7n+4)]:border-green-300 [&:nth-child(7n+5)]:from-teal-100 [&:nth-child(7n+5)]:to-cyan-100 [&:nth-child(7n+5)]:border-teal-300 [&:nth-child(7n+6)]:from-blue-100 [&:nth-child(7n+6)]:to-indigo-100 [&:nth-child(7n+6)]:border-blue-300 [&:nth-child(7n+7)]:from-purple-100 [&:nth-child(7n+7)]:to-pink-100 [&:nth-child(7n+7)]:border-purple-300",
        day_today: "bg-gradient-to-br from-yellow-100 to-orange-100 text-foreground font-bold border-2 border-orange-300",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
