"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BusFront, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import type { NotificationItem } from "@/lib/notification-api";
import type { RouteRun, RouteRunStatus } from "@/lib/routeRun-api";

interface LiveActivityProps {
  notifications: NotificationItem[];
  routeRuns: RouteRun[];
  loading: boolean;
}

const statusIcon: Record<RouteRunStatus, React.ReactNode> = {
  assigned: <Clock className="size-3.5 text-amber-500" />,
  accepted: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  arrived: <BusFront className="size-3.5 text-blue-500" />,
  picked_up: <CheckCircle2 className="size-3.5 text-violet-500" />,
  completed: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  cancelled: <XCircle className="size-3.5 text-destructive" />,
};

const statusBadge: Record<RouteRunStatus, string> = {
  assigned: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  arrived: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  picked_up: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const isUnread = !item.read_at;
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 shrink-0">
        <Bell className={`size-4 ${isUnread ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.type}</span>
          {isUnread && (
            <Badge variant="default" className="h-5 px-1.5 text-[10px]">
              New
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function RouteRunRow({ run }: { run: RouteRun }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 shrink-0">{statusIcon[run.lifecycle_status]}</div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{run.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge[run.lifecycle_status]}`}>
            {run.lifecycle_status.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Bus {run.bus?.bus_number ?? "—"} · {run.run_date}
        </p>
        {run.start_time && (
          <p className="text-[10px] text-muted-foreground">
            Scheduled {run.start_time}
          </p>
        )}
      </div>
    </div>
  );
}

export function LiveActivity({ notifications, routeRuns, loading }: LiveActivityProps) {
  const activities = useMemo(() => {
    const notifItems = notifications.slice(0, 5).map((n) => ({
      id: `notif-${n.id}`,
      type: "notification" as const,
      data: n,
      sortDate: new Date(n.sent_at),
    }));

    const runItems = routeRuns.slice(0, 5).map((r) => ({
      id: `run-${r.id}`,
      type: "run" as const,
      data: r,
      sortDate: r.run_date ? new Date(r.run_date) : new Date(0),
    }));

    return [...notifItems, ...runItems].sort(
      (a, b) => b.sortDate.getTime() - a.sortDate.getTime()
    );
  }, [notifications, routeRuns]);

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="size-4 text-primary" />
          Live Activity
        </CardTitle>
        <CardDescription>
          Recent notifications and route run updates
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Clock className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Notifications and route runs will appear here as they happen.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {activities.map((item) =>
              item.type === "notification" ? (
                <NotificationRow key={item.id} item={item.data as NotificationItem} />
              ) : (
                <RouteRunRow key={item.id} run={item.data as RouteRun} />
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
