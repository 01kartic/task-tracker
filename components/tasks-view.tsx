"use client";

import { useState, useMemo } from "react";
import {
  IconCalendarDot,
  IconCheck,
  IconChevronDown,
  IconMinus,
} from "@tabler/icons-react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import type { Task, TaskCompletion } from "@/lib/db";
import { getTodayDateString } from "@/lib/db";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "./ui/empty";
import { Popover, PopoverPopup, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

interface TasksViewProps {
  tasks: Task[];
  completions: TaskCompletion[];
  calendarCompletionData: Map<string, { completed: number; total: number }>;
  onToggleComplete: (task: Task, date: string) => void;
  onRatingChange: (task: Task, date: string, rating: number) => void;
  trackerCreatedAt: number;
}

const ratingOptions = [
  { value: 0, label: "Rate" },
  { value: 0.5, label: "0.5" },
  { value: 1, label: "1" },
  { value: 1.5, label: "1.5" },
  { value: 2, label: "2" },
  { value: 2.5, label: "2.5" },
  { value: 3, label: "3" },
  { value: 3.5, label: "3.5" },
  { value: 4, label: "4" },
  { value: 4.5, label: "4.5" },
  { value: 5, label: "5" },
];

export function TasksView({
  tasks,
  completions,
  calendarCompletionData,
  onToggleComplete,
  onRatingChange,
  trackerCreatedAt,
}: TasksViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const today = getTodayDateString();

  // Format date to YYYY-MM-DD string
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateString = formatDateString(selectedDate);

  // Get tasks available on selected date
  const tasksForSelectedDate = useMemo(() => {
    // Normalize selectedDate to start of day
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(23, 59, 59, 999);
    const selectedTimestamp = selectedDay.getTime();
    return tasks.filter((task) => task.createdAt <= selectedTimestamp);
  }, [tasks, selectedDate]);

  // Check if actions should be disabled (more than 1 day old)
  const isActionsDisabled = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff > 1;
  }, [selectedDate]);

  // Get completions for selected date
  const completionsForSelectedDate = useMemo(() => {
    return completions.filter((c) => c.date === selectedDateString);
  }, [completions, selectedDateString]);

  const dateDisplay = useMemo(() => {
    const weekday = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleDateString("en-US", { month: "long" });
    const year = selectedDate.getFullYear();
    return `${weekday} ${day} ${month}, ${year}`;
  }, [selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;

    // Normalize dates to start of day for accurate comparison
    const getStartOfDay = (d: Date) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const selectedDay = getStartOfDay(date);
    const todayDay = getStartOfDay(new Date());
    const creationDay = getStartOfDay(new Date(trackerCreatedAt));

    // Don't allow future dates
    if (selectedDay.getTime() > todayDay.getTime()) {
      return;
    }

    // Don't allow dates before tracker creation
    if (selectedDay.getTime() < creationDay.getTime()) {
      return;
    }

    setSelectedDate(date);
    setMonth(date);
  };

  // Get completion data for a specific date
  const getDateProgress = (
    date: Date,
  ): { completed: number; total: number } | null => {
    const dateString = formatDateString(date);
    return calendarCompletionData.get(dateString) || null;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-xl leading-7">{dateDisplay}</h4>
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <IconChevronDown />
          </PopoverTrigger>
          <PopoverPopup className="w-fit rounded-2xl [&>div]:p-0 overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              captionLayout="dropdown"
              disabled={(date) => {
                // Normalize dates to start of day for accurate comparison
                const getStartOfDay = (d: Date) => {
                  const normalized = new Date(d);
                  normalized.setHours(0, 0, 0, 0);
                  return normalized.getTime();
                };

                const dateDayStart = getStartOfDay(date);
                const todayDayStart = getStartOfDay(new Date());
                const creationDayStart = getStartOfDay(
                  new Date(trackerCreatedAt),
                );

                // Disable future days (after today) and days before tracker creation
                return (
                  dateDayStart > todayDayStart ||
                  dateDayStart < creationDayStart
                );
              }}
              className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
              formatters={{
                formatMonthDropdown: (date) => {
                  return date.toLocaleString("default", { month: "long" });
                },
              }}
              components={{
                DayButton: ({ children, modifiers, day, ...props }) => {
                  const progress = getDateProgress(day.date);
                  const progress_percent =
                    progress && progress.total > 0
                      ? (progress.completed / progress.total) * 100
                      : 0;

                  return (
                    <CalendarDayButton
                      day={day}
                      modifiers={modifiers}
                      className={cn("relative", props.className)}
                      {...props}
                    >
                      {children}
                      {!modifiers.outside && progress && progress.total > 0 && (
                        <div className="absolute inset-0 rounded-md overflow-clip flex items-end">
                          <div
                            className="w-full bg-chart-1/40"
                            style={{
                              height: `calc(var(--cell-size) * (${progress_percent} / 100))`,
                            }}
                          />
                        </div>
                      )}
                    </CalendarDayButton>
                  );
                },
              }}
            />
            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
              >
                Today
              </Button>
            </div>
          </PopoverPopup>
        </Popover>
      </div>
      <div className="space-y-2.5 w-full">
        {tasksForSelectedDate.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconCalendarDot />
              </EmptyMedia>
              <EmptyDescription>No tasks for this date</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          tasksForSelectedDate.map((task) => {
            const completion = completionsForSelectedDate.find(
              (c) => c.taskId === task.id,
            );
            const completed = completion?.completed || false;
            const rating = completion?.rating || 0;
            return (
              <div
                key={task.id}
                className="flex items-center justify-between relative shrink-0 w-full"
              >
                <div className="flex gap-3 items-center relative shrink-0">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={completed ? "default" : "outline"}
                          size="icon-xs"
                          className={completed ? "opacity-50" : ""}
                          onClick={() =>
                            onToggleComplete(task, selectedDateString)
                          }
                          disabled={isActionsDisabled}
                        />
                      }
                    >
                      {completed ? <IconCheck /> : <IconMinus />}
                    </TooltipTrigger>
                    <TooltipPopup>
                      {isActionsDisabled
                        ? "Cannot edit past dates"
                        : completed
                          ? "Undo"
                          : "Mark as Done"}
                    </TooltipPopup>
                  </Tooltip>
                  <p
                    className={`font-normal leading-6 relative shrink-0 text-sm ${
                      completed ? "line-through opacity-50" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <NativeSelect
                        size="sm"
                        value={rating}
                        onChange={(e) =>
                          onRatingChange(
                            task,
                            selectedDateString,
                            Number(e.target.value),
                          )
                        }
                        disabled={!completed || isActionsDisabled}
                      />
                    }
                  >
                    {ratingOptions.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </TooltipTrigger>
                  <TooltipPopup side="left">
                    {isActionsDisabled
                      ? "Cannot edit past dates"
                      : "Rate this task"}
                  </TooltipPopup>
                </Tooltip>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
