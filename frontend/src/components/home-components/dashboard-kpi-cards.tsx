"use client";

import { useMemo } from "react";
import {
  BusFront,
  GraduationCap,
  Route,
  UserCircle2,
  Bell,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Bus } from "@/lib/bus-api";
import type { Student } from "@/lib/student-api";
import type { Driver } from "@/lib/driver-api";
import type { Route as RouteType } from "@/lib/route-api";
import type { RouteRun } from "@/lib/routeRun-api";
import type { NotificationItem } from "@/lib/notification-api";

interface KpiData {
  buses: Bus[];
  students: Student[];
  drivers: Driver[];
  routes: RouteType[];
  routeRuns: RouteRun[];
  notifications: NotificationItem[];
  loading: boolean;
}

interface KpiCardDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: (d: KpiData) => number;
  subtext: (d: KpiData) => string;
  trend: "up" | "down" | "neutral";
  trendLabel: string;
}

const KPI_DEFS: KpiCardDef[] = [
  {
    key: "buses",
    label: "Active Buses",
    icon: BusFront,
    value: (d) => d.buses.length,
    subtext: (d) =>
      d.buses.length > 0
        ? `${d.buses.filter((b) => b.driver_id != null).length} with driver assigned`
        : "Fleet configured",
    trend: "up",
    trendLabel: "Fleet ready",
  },
  {
    key: "students",
    label: "Students",
    icon: GraduationCap,
    value: (d) => d.students.length,
    subtext: (d) =>
      d.students.length > 0
        ? `${d.students.length} enrolled`
        : "Awaiting enrollment",
    trend: "up",
    trendLabel: "Enrollment stable",
  },
  {
    key: "drivers",
    label: "Drivers",
    icon: UserCircle2,
    value: (d) => d.drivers.length,
    subtext: () => "Active workforce",
    trend: "neutral",
    trendLabel: "All verified",
  },
  {
    key: "routes",
    label: "Routes",
    icon: Route,
    value: (d) => d.routes.length,
    subtext: (d) =>
      d.routes.length > 0
        ? `${d.routes.filter((r) => r.routeAssignments && r.routeAssignments.length > 0).length} with assignments`
        : "No routes configured",
    trend: "up",
    trendLabel: "Coverage growing",
  },
  {
    key: "runs",
    label: "Today's Runs",
    icon: Activity,
    value: (d) => d.routeRuns.length,
    subtext: (d) => {
      const active = d.routeRuns.filter(
        (r) => r.lifecycle_status === "assigned" || r.lifecycle_status === "accepted" || r.lifecycle_status === "arrived"
      ).length;
      return active > 0 ? `${active} in progress` : "No active runs";
    },
    trend: "up",
    trendLabel: "Operations live",
  },
  {
    key: "alerts",
    label: "Unread Alerts",
    icon: Bell,
    value: (d) => d.notifications.filter((n) => !n.read_at).length,
    subtext: (d) => {
      const total = d.notifications.length;
      const unread = d.notifications.filter((n) => !n.read_at).length;
      return total > 0 ? `${total} total notifications` : "Inbox empty";
    },
    trend: "down",
    trendLabel: "Attention needed",
  },
];

function TrendBadge({ trend, label }: { trend: "up" | "down" | "neutral"; label: string }) {
  const icon =
    trend === "up" ? (
      <TrendingUp className="size-3" />
    ) : trend === "down" ? (
      <TrendingDown className="size-3" />
    ) : (
      <Minus className="size-3" />
    );
  return (
    <Badge variant="outline" className="gap-1 text-[10px] font-normal">
      {icon}
      {label}
    </Badge>
  );
}

export function DashboardKpiCards({ data }: { data: KpiData }) {
  const values = useMemo(() => {
    if (data.loading) return null;
    return KPI_DEFS.map((def) => ({
      ...def,
      count: def.value(data),
      sub: def.subtext(data),
    }));
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {data.loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <CardDescription>
                  <Skeleton className="h-4 w-24" />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  <Skeleton className="h-8 w-16" />
                </CardTitle>
                <CardAction>
                  <Skeleton className="h-6 w-20" />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardFooter>
            </Card>
          ))
        : values?.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.key}
                className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs dark:to-card"
              >
                <CardHeader>
                  <CardDescription className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {item.count}
                  </CardTitle>
                  <CardAction>
                    <TrendBadge trend={item.trend} label={item.trendLabel} />
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {item.sub}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Live from system records
                  </div>
                </CardFooter>
              </Card>
            );
          })}
    </div>
  );
}
