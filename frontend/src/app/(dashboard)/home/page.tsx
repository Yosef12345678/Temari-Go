"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { busAPI, type Bus } from "@/lib/bus-api";
import { studentAPI, type Student } from "@/lib/student-api";
import { driverAPI, type Driver } from "@/lib/driver-api";
import { routeAPI, type Route } from "@/lib/route-api";
import { routeRunAPI, type RouteRun } from "@/lib/routeRun-api";
import {
  notificationAPI,
  type NotificationItem,
} from "@/lib/notification-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { DashboardKpiCards } from "@/components/home-components/dashboard-kpi-cards";
import { RouteActivityChart } from "@/components/home-components/route-activity-chart";
import { LiveActivity } from "@/components/home-components/live-activity";
import { FleetOverview } from "@/components/home-components/fleet-overview";
import { QuickActions } from "@/components/home-components/quick-actions";
import { Shield } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function HomePage() {
  const { user } = useAuth();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeRuns, setRouteRuns] = useState<RouteRun[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => authClient.getAccessToken() ?? undefined;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const today = new Date().toISOString().split("T")[0];
        const [
          { items },
          studentList,
          driverList,
          routeList,
          runList,
          notif,
        ] = await Promise.all([
          busAPI.getAll(token, { page: 1, pageSize: 200 }),
          studentAPI.getAll(token),
          driverAPI.getAll(token),
          routeAPI.getAll(token),
          routeRunAPI.getAll(token, { run_date: today }),
          notificationAPI.list({ limit: 20, accessToken: token }),
        ]);
        setBuses(items);
        setStudents(Array.isArray(studentList) ? studentList : []);
        setDrivers(Array.isArray(driverList) ? driverList : []);
        setRoutes(Array.isArray(routeList) ? routeList : []);
        setRouteRuns(Array.isArray(runList) ? runList : []);
        setNotifications(notif.notifications);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {loading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {getGreeting()}, {user?.name?.split(" ")[0] ?? "Admin"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate()} · Here is what is happening across your fleet
                today.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Shield className="size-3.5" />
          Admin console
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <DashboardKpiCards
        data={{
          buses,
          students,
          drivers,
          routes,
          routeRuns,
          notifications,
          loading,
        }}
      />

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RouteActivityChart routeRuns={routeRuns} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <LiveActivity
            notifications={notifications}
            routeRuns={routeRuns}
            loading={loading}
          />
        </div>
      </div>

      {/* Fleet + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FleetOverview buses={buses} routes={routes} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
