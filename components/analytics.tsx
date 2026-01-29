"use client";

import { useMemo } from "react";
import { TaskCompletion, Task } from "@/lib/db";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import { LineChart, Line, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "./ui/empty";
import { IconChartLine } from "@tabler/icons-react";

interface AnalyticsProps {
  tasks: Task[];
  completions: TaskCompletion[];
  trackerCreatedAt: number;
}

export function Analytics({
  tasks,
  completions,
  trackerCreatedAt,
}: AnalyticsProps) {
  const analytics = useMemo(() => {
    // Get all dates from tracker creation to today
    const startDate = new Date(trackerCreatedAt);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      allDates.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group completions by date
    const dateMap = new Map<
      string,
      {
        completed: number;
        total: number;
        totalRating: number;
        ratedCount: number;
      }
    >();

    allDates.forEach((date) => {
      // Use end of day to include tasks created on that day
      const dateParts = date.split("-");
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      const dateEndOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

      const tasksForDate = tasks.filter(
        (task) => task.createdAt <= dateEndOfDay,
      );
      const completionsForDate = completions.filter((c) => c.date === date);

      // Count completed tasks by checking if each task has a completed completion
      const completed = tasksForDate.filter((task) => {
        const completion = completionsForDate.find((c) => c.taskId === task.id);
        return completion?.completed === true;
      }).length;

      const totalRating = completionsForDate.reduce(
        (sum, c) => sum + (c.rating || 0),
        0,
      );
      const ratedCount = completionsForDate.length; // Count all completions, not just those with rating > 0

      dateMap.set(date, {
        completed,
        total: tasksForDate.length,
        totalRating,
        ratedCount,
      });
    });

    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      avgRating: data.ratedCount > 0 ? data.totalRating / data.ratedCount : 0,
    }));
  }, [tasks, completions, trackerCreatedAt]);

  const avgCompletionRate = useMemo(() => {
    if (analytics.length === 0) return 0;
    console.log(analytics);
    const sum = analytics.reduce((acc, day) => acc + day.completionRate, 0);
    return sum / analytics.length;
  }, [analytics]);

  const avgRating = useMemo(() => {
    if (analytics.length === 0) return 0;
    const daysWithRatings = analytics.filter((day) => day.avgRating > 0);
    if (daysWithRatings.length === 0) return 0;
    const sum = daysWithRatings.reduce((acc, day) => acc + day.avgRating, 0);
    return sum / daysWithRatings.length;
  }, [analytics]);

  const chartData = useMemo(() => {
    return analytics.map((day) => {
      const date = new Date(day.date);
      const day_num = date.getDate();
      const month_num = date.getMonth() + 1;
      return {
        date: `${day_num}/${month_num}`,
        fullDate: day.date,
        completionRate: Number(day.completionRate.toFixed(1)),
        avgRating: Number((day.avgRating * 20).toFixed(1)), // Multiply for chart display
      };
    });
  }, [analytics]);

  const chartConfig = {
    completionRate: {
      label: "Completion Rate",
      color: "var(--chart-1)",
    },
    avgRating: {
      label: "Avg Rating",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-dashed bg-transparent shadow-none! before:shadow-none!">
          <CardHeader className="p-4 gap-1">
            <CardDescription className="uppercase">
              Avg Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl">
              {avgCompletionRate.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-dashed bg-transparent shadow-none! before:shadow-none!">
          <CardHeader className="p-4 gap-1">
            <CardDescription className="uppercase">Avg Rating</CardDescription>
            <CardTitle className="text-2xl">
              {avgRating.toFixed(1)} / 5
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Combined Line Chart */}
      <Card className="[&>div]:p-3 border-0 shadow-none! before:shadow-none! bg-transparent!">
        <CardHeader>
          <CardTitle>Task Completion Rate & Average Rating</CardTitle>
          <CardDescription>
            Tracking your progress from{" "}
            {new Date(trackerCreatedAt).toLocaleDateString("en-IN")} to Today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconChartLine />
                </EmptyMedia>
                <EmptyDescription>
                  No data available to display the chart.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 12,
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        let formattedValue;
                        if (name === "avgRating") {
                          formattedValue = (Number(value) / 20).toFixed(1);
                        } else if (name === "completionRate") {
                          formattedValue = `${Number(value)}%`;
                        }
                        // return [value, 'Completion Rate'];
                        return (
                          <div className="[&>svg]:text-muted-foreground flex w-full flex-wrap items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5">
                            <div
                              className="shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg) h-2.5 w-2.5"
                              style={
                                {
                                  "--color-bg":
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ].color,
                                  "--color-border":
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ].color,
                                } as React.CSSProperties
                              }
                            />
                            <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                              <div className="grid gap-1.5">
                                <span className="text-muted-foreground">
                                  {
                                    chartConfig[
                                      name as keyof typeof chartConfig
                                    ].label
                                  }
                                </span>
                              </div>
                              {formattedValue && (
                                <span className="text-foreground font-mono font-medium tabular-nums">
                                  {formattedValue.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                  labelFormatter={(value) => {
                    const dataPoint = chartData.find((d) => d.date === value);
                    if (dataPoint) {
                      const date = new Date(dataPoint.fullDate);
                      return date.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    }
                    return value;
                  }}
                />
                <Line
                  dataKey="completionRate"
                  type="monotone"
                  stroke="var(--color-completionRate)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="avgRating"
                  type="monotone"
                  stroke="var(--color-avgRating)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
