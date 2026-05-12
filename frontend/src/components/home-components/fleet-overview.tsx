"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BusFront, MapPin, Users } from "lucide-react";
import type { Bus } from "@/lib/bus-api";
import type { Route as RouteType } from "@/lib/route-api";

interface FleetOverviewProps {
  buses: Bus[];
  routes: RouteType[];
  loading: boolean;
}

export function FleetOverview({ buses, routes, loading }: FleetOverviewProps) {
  const getBusRouteCount = (busId: number) => {
    return routes.filter((r) => r.bus_id === busId).length;
  };

  const getBusAssignmentCount = (busId: number) => {
    const busRoutes = routes.filter((r) => r.bus_id === busId);
    return busRoutes.reduce(
      (sum, r) => sum + (r.routeAssignments?.length ?? 0),
      0
    );
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BusFront className="size-4 text-primary" />
          Fleet Overview
        </CardTitle>
        <CardDescription>
          Buses, routes, and student assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : buses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BusFront className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No buses configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add buses in the Fleet section to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {buses.map((bus) => {
              const routeCount = getBusRouteCount(bus.id);
              const assignmentCount = getBusAssignmentCount(bus.id);
              return (
                <div
                  key={bus.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <BusFront className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Bus {bus.bus_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Capacity: {bus.capacity ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium tabular-nums">
                        {routeCount} route{routeCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium tabular-nums">
                        {assignmentCount} student{assignmentCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    {bus.driver ? (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {bus.driver.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        No driver
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
