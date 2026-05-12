"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteRun } from "@/lib/routeRun-api";

interface RouteActivityChartProps {
  routeRuns: RouteRun[];
  loading: boolean;
}

const chartConfig = {
  runs: {
    label: "Route Runs",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function RouteActivityChart({ routeRuns, loading }: RouteActivityChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      assigned: 0,
      accepted: 0,
      arrived: 0,
      picked_up: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const run of routeRuns) {
      if (counts[run.lifecycle_status] !== undefined) {
        counts[run.lifecycle_status]++;
      }
    }

    return [
      { status: "Assigned", count: counts.assigned, fill: "var(--color-chart-1)" },
      { status: "Accepted", count: counts.accepted, fill: "var(--color-chart-2)" },
      { status: "Arrived", count: counts.arrived, fill: "var(--color-chart-3)" },
      { status: "Picked Up", count: counts.picked_up, fill: "var(--color-chart-4)" },
      { status: "Completed", count: counts.completed, fill: "var(--color-chart-5)" },
      { status: "Cancelled", count: counts.cancelled, fill: "var(--color-destructive)" },
    ];
  }, [routeRuns]);

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Route Run Lifecycle</CardTitle>
          <CardDescription>Status distribution across all route runs</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Route Run Lifecycle</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Status distribution across all route runs
          </span>
          <span className="@[540px]/card:hidden">Run status breakdown</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--color-runs)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
