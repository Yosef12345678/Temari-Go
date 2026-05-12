 "use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { driverAPI, type Driver, type DriverApplication } from "@/lib/driver-api";
import { alcoholTestAPI, type AlcoholTest } from "@/lib/alcohol-test-api";
import {
  driverRatingAPI,
  type DriverRatingsResponse,
} from "@/lib/driver-rating-api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertTriangle,
  Award,
  BusFront,
  Shield,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(Number(score))) return "—";
  return `${Number(score).toFixed(1)}`;
}

export default function DriverPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const [tests, setTests] = useState<AlcoholTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<DriverRatingsResponse | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<
    "pending_verification" | "rejected" | "active"
  >("pending_verification");
  const [rejectReasonById, setRejectReasonById] = useState<Record<number, string>>({});
  const [applicationActionLoadingId, setApplicationActionLoadingId] = useState<number | null>(null);

  const getToken = () => authClient.getAccessToken() ?? undefined;

  useEffect(() => {
    const loadDrivers = async () => {
      setDriversLoading(true);
      setDriversError(null);
      try {
        const token = getToken();
        const items = await driverAPI.getAll(token);
        setDrivers(items);
        if (items.length > 0 && selectedDriverId == null) {
          setSelectedDriverId(items[0].id);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load drivers";
        setDriversError(msg);
      } finally {
        setDriversLoading(false);
      }
    };

    void loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const driverId = selectedDriverId;
    if (!driverId) {
      setTests([]);
      setRatings(null);
      return;
    }

    const token = getToken();

    const loadTests = async () => {
      setTestsLoading(true);
      setTestsError(null);
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const items = await alcoholTestAPI.getDriverTests(driverId, {
          startDate: start.toISOString(),
          endDate: now.toISOString(),
          limit: 50,
          accessToken: token,
        });
        setTests(items);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load alcohol tests";
        setTestsError(msg);
        setTests([]);
      } finally {
        setTestsLoading(false);
      }
    };

    const loadRatings = async () => {
      setRatingsLoading(true);
      setRatingsError(null);
      try {
        const data = await driverRatingAPI.getForDriver(driverId, {
          limit: 12,
          accessToken: token,
        });
        setRatings(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load driver ratings";
        setRatingsError(msg);
        setRatings(null);
      } finally {
        setRatingsLoading(false);
      }
    };

    void loadTests();
    void loadRatings();
  }, [selectedDriverId]);

  const loadApplications = async () => {
    if (!isAdmin) return;
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const token = getToken();
      const items = await driverAPI.listApplications(applicationStatusFilter, token);
      setApplications(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load driver applications";
      setApplicationsError(msg);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationStatusFilter, isAdmin]);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  const latestTest = useMemo(
    () => (tests.length > 0 ? tests[0] : null),
    [tests]
  );

  const currentRating = ratings?.current ?? null;

  const handleApproveApplication = async (userId: number) => {
    setApplicationActionLoadingId(userId);
    try {
      const token = getToken();
      await driverAPI.approveApplication(userId, token);
      toast.success("Driver verified. Setup email link sent.");
      await loadApplications();
    } catch (err: unknown) {
      setApplicationsError(err instanceof Error ? err.message : "Failed to approve application");
    } finally {
      setApplicationActionLoadingId(null);
    }
  };

  const handleRejectApplication = async (userId: number) => {
    setApplicationActionLoadingId(userId);
    try {
      const token = getToken();
      await driverAPI.rejectApplication(userId, rejectReasonById[userId] || undefined, token);
      await loadApplications();
    } catch (err: unknown) {
      setApplicationsError(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setApplicationActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <UserCircle2 className="size-6 text-primary" aria-hidden />
            Drivers &amp; safety
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse drivers, review safety signals, and see rating summaries.
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
            <Shield className="size-3.5" />
            Read-only access
          </div>
        )}
      </div>

      {driversError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{driversError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.36fr),minmax(0,0.64fr)]">
        <Card className="h-full">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BusFront className="size-4" />
              Drivers
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Select a driver to see alcohol tests and rating breakdowns.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {driversLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No drivers found. Create driver accounts first to see safety
                signals.
              </p>
            ) : (
              <ScrollArea className="max-h-[520px] pr-1">
                <div className="space-y-1">
                  {drivers.map((driver) => {
                    const isSelected = driver.id === selectedDriverId;
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={[
                          "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted",
                        ].join(" ")}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{driver.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {driver.email}
                          </span>
                        </div>
                        {isSelected && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4" />
                  Safety overview
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedDriver
                    ? `Safety signals for ${selectedDriver.name}.`
                    : "Select a driver to see safety details."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Re-trigger effects by toggling selected driver id
                  setSelectedDriverId((id) => (id ? id : null));
                }}
                disabled={!selectedDriverId}
              >
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Overall rating (0–100)
                </p>
                <p className="text-sm font-medium">
                  {currentRating
                    ? formatScore(currentRating.overall_score ?? 0)
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Safety compliance
                </p>
                <p className="text-sm font-medium">
                  {currentRating
                    ? formatScore(currentRating.safety_compliance_score ?? 0)
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Parental feedback
                </p>
                <p className="text-sm font-medium">
                  {currentRating
                    ? formatScore(currentRating.parental_feedback_score ?? 0)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="tests" className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Alcohol tests
              </TabsTrigger>
              <TabsTrigger value="ratings" className="flex items-center gap-2">
                <Award className="size-4" />
                Rating history
              </TabsTrigger>
              {isAdmin ? (
                <TabsTrigger value="applications" className="flex items-center gap-2">
                  <Shield className="size-4" />
                  Driver applications
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="tests" className="mt-4 space-y-3">
              {testsError && (
                <Alert variant="destructive">
                  <AlertDescription>{testsError}</AlertDescription>
                </Alert>
              )}
              {testsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : tests.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No alcohol tests recorded for this driver in the current
                  period.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatDate(test.timestamp)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {test.bus?.bus_number ?? `#${test.bus_id}`}
                          </TableCell>
                          <TableCell className="text-xs">
                            {test.alcohol_level.toFixed(3)} mg/L
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={test.passed ? "outline" : "destructive"}
                              className="text-[10px] font-normal"
                            >
                              {test.passed ? "Passed" : "Failed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {latestTest && (
                <p className="text-xs text-muted-foreground">
                  Latest test:{" "}
                  <span className="font-medium">
                    {latestTest.passed ? "Passed" : "Failed"}
                  </span>{" "}
                  at {formatDate(latestTest.timestamp)} on bus{" "}
                  {latestTest.bus?.bus_number ?? `#${latestTest.bus_id}`}.
                </p>
              )}
            </TabsContent>

            <TabsContent value="ratings" className="mt-4 space-y-3">
              {ratingsError && (
                <Alert variant="destructive">
                  <AlertDescription>{ratingsError}</AlertDescription>
                </Alert>
              )}
              {ratingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : !ratings || ratings.historical.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No historical ratings found yet. Ratings are recomputed
                  monthly by the scheduler.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Overall</TableHead>
                        <TableHead>Safety</TableHead>
                        <TableHead>Parents</TableHead>
                        <TableHead>Ops</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratings.historical.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {row.period_start} → {row.period_end}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatScore(row.overall_score)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatScore(row.safety_compliance_score)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatScore(row.parental_feedback_score)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatScore(row.operational_performance_score)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            {isAdmin ? (
              <TabsContent value="applications" className="mt-4 space-y-3">
                {applicationsError && (
                  <Alert variant="destructive">
                    <AlertDescription>{applicationsError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={applicationStatusFilter === "pending_verification" ? "default" : "outline"}
                    onClick={() => setApplicationStatusFilter("pending_verification")}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={applicationStatusFilter === "rejected" ? "default" : "outline"}
                    onClick={() => setApplicationStatusFilter("rejected")}
                  >
                    Rejected
                  </Button>
                  <Button
                    size="sm"
                    variant={applicationStatusFilter === "active" ? "default" : "outline"}
                    onClick={() => setApplicationStatusFilter("active")}
                  >
                    Active
                  </Button>
                </div>
                {applicationsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">No driver applications in this state.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((application) => (
                      <Card key={application.id}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{application.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {application.email}
                                {application.phone_number ? ` • ${application.phone_number}` : ""}
                                {application.username ? ` • @${application.username}` : ""}
                              </p>
                            </div>
                            <Badge variant="outline">{application.account_status}</Badge>
                          </div>
                          {application.rejected_reason ? (
                            <p className="text-xs text-destructive">
                              Rejected reason: {application.rejected_reason}
                            </p>
                          ) : null}
                          {applicationStatusFilter === "pending_verification" ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                value={rejectReasonById[application.id] ?? ""}
                                onChange={(e) =>
                                  setRejectReasonById((prev) => ({
                                    ...prev,
                                    [application.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional rejection reason"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={applicationActionLoadingId === application.id}
                                  onClick={() => handleApproveApplication(application.id)}
                                >
                                  Approve + send setup link
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={applicationActionLoadingId === application.id}
                                  onClick={() => handleRejectApplication(application.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
