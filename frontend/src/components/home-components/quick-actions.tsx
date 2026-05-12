"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BusFront,
  GraduationCap,
  Route,
  MapPin,
  ClipboardCheck,
  CreditCard,
  Bell,
  ArrowRight,
} from "lucide-react";

const actions = [
  {
    title: "Manage Fleet",
    description: "Buses, drivers, and routes",
    icon: BusFront,
    href: "/bus",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Students",
    description: "Enrollments and assignments",
    icon: GraduationCap,
    href: "/student",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Route Planner",
    description: "Optimize pickup stops",
    icon: Route,
    href: "/routes",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "Live Map",
    description: "Tracking and geofences",
    icon: MapPin,
    href: "/map",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Attendance",
    description: "RFID scans and records",
    icon: ClipboardCheck,
    href: "/attendance",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    title: "Payments",
    description: "Billing and invoices",
    icon: CreditCard,
    href: "/payments",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    title: "Notifications",
    description: "Alerts and messages",
    icon: Bell,
    href: "/notifications",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export function QuickActions() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump to key admin workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-3 text-left"
                asChild
              >
                <Link href={action.href}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${action.bg}`}>
                    <Icon className={`size-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
