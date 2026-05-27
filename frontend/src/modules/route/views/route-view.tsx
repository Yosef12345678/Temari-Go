'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/hooks/use-auth';
import { busAPI, type Bus } from '@/lib/bus-api';
import { studentAPI, type Student } from '@/lib/student-api';
import { routeRunAPI, type RouteRun, type RouteRunStatus } from '@/lib/routeRun-api';
import {
  routeAPI,
  type Route,
  type CreateRouteInput,
  type UpdateRouteInput,
  type RouteOptimizedWaypoint,
} from '@/lib/route-api';
import {
  routeAssignmentAPI,
  type RouteAssignment,
  type CreateRouteAssignmentInput,
} from '@/lib/route-assignment-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bus as BusIcon,
  CalendarDays,
  Info,
  Loader2,
  Map,
  Pencil,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const emptyRouteForm: CreateRouteInput = {
  bus_id: 0,
  name: '',
  start_time: null,
  end_time: null,
};

export function RouteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busFilter, setBusFilter] = useState<string>(() => {
    const busId = searchParams?.get('busId');
    return busId ?? '';
  });

  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [routeForm, setRouteForm] = useState<CreateRouteInput>(emptyRouteForm);
  const [routeFormError, setRouteFormError] = useState<string | null>(null);
  const [routeSubmitLoading, setRouteSubmitLoading] = useState(false);

  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
  const [deleteRouteLoading, setDeleteRouteLoading] = useState(false);

  const [selectedRouteForAssignments, setSelectedRouteForAssignments] =
    useState<Route | null>(null);
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<CreateRouteAssignmentInput>({
    route_id: 0,
    student_id: 0,
    pickup_latitude: null,
    pickup_longitude: null,
  });
  const [assignmentSubmitLoading, setAssignmentSubmitLoading] = useState(false);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<number | null>(
    null,
  );
  const [deleteAssignmentLoading, setDeleteAssignmentLoading] = useState(false);

  const [optimizeLoadingRouteId, setOptimizeLoadingRouteId] = useState<
    number | null
  >(null);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);
  const [optimizeRadiusMeters, setOptimizeRadiusMeters] = useState(500);
  const [optimizePreviewRoute, setOptimizePreviewRoute] = useState<Route | null>(null);
  const [optimizePreviewWaypoints, setOptimizePreviewWaypoints] = useState<RouteOptimizedWaypoint[]>([]);
  const [optimizeApplyLoading, setOptimizeApplyLoading] = useState(false);

  const [directionsLoadingRouteId, setDirectionsLoadingRouteId] = useState<
    number | null
  >(null);
  const [directionsSummary, setDirectionsSummary] = useState<string | null>(
    null,
  );

  // Route runs (daily instances)
  const [activeTab, setActiveTab] = useState<'templates' | 'runs'>('templates');
  const [routeRuns, setRouteRuns] = useState<RouteRun[]>([]);
  const [routeRunsLoading, setRouteRunsLoading] = useState(false);
  const [runDateFilter, setRunDateFilter] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [createRunDialogOpen, setCreateRunDialogOpen] = useState(false);
  const [createRunForm, setCreateRunForm] = useState({
    route_id: 0,
    run_date: '',
  });
  const [createRunLoading, setCreateRunLoading] = useState(false);
  const [deleteRunId, setDeleteRunId] = useState<number | null>(null);
  const [deleteRunLoading, setDeleteRunLoading] = useState(false);

  const token = accessToken ?? undefined;
  const busFilterId = busFilter ? Number(busFilter) : undefined;

  useEffect(() => {
    setAccessToken(authClient.getAccessToken());
  }, [user]);

  const loadOptions = useCallback(async () => {
    try {
      const [busResult, studentResult] = await Promise.all([
        busAPI.getAll(token, { page: 1, pageSize: 100 }),
        studentAPI.getAll(token),
      ]);
      setBuses(Array.isArray(busResult?.items) ? busResult.items : []);
      setStudents(Array.isArray(studentResult) ? studentResult : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load buses/students', err);
    }
  }, [token]);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeAPI.getAll(token, {
        bus_id: busFilterId,
      });
      setRoutes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load routes';
      setError(msg);
      setRoutes([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, busFilterId]);

  const loadRouteRuns = useCallback(async () => {
    setRouteRunsLoading(true);
    try {
      const data = await routeRunAPI.getAll(token, {
        run_date: runDateFilter,
      });
      setRouteRuns(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load route runs';
      toast.error(msg);
      setRouteRuns([]);
    } finally {
      setRouteRunsLoading(false);
    }
  }, [token, runDateFilter]);

  useEffect(() => {
    if (token) {
      void loadOptions();
    }
  }, [loadOptions, token]);

  useEffect(() => {
    if (token) {
      void loadRoutes();
    }
  }, [loadRoutes, token]);

  useEffect(() => {
    if (activeTab === 'runs') {
      void loadRouteRuns();
    }
  }, [loadRouteRuns, activeTab]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busFilter) params.set('busId', busFilter);
    const query = params.toString();
    const desired = query ? `/routes?${query}` : '/routes';
    router.replace(desired, { scroll: false });
  }, [busFilter, router]);

  const openCreateRoute = () => {
    setEditingRouteId(null);
    setRouteFormError(null);
    setRouteForm({
      ...emptyRouteForm,
      bus_id: buses[0]?.id ?? 0,
    });
    setRouteDialogOpen(true);
  };

  const openEditRoute = (route: Route) => {
    setEditingRouteId(route.id);
    setRouteFormError(null);
    setRouteForm({
      bus_id: route.bus_id,
      name: route.name,
      start_time: route.start_time ?? null,
      end_time: route.end_time ?? null,
    });
    setRouteDialogOpen(true);
  };

  const closeRouteDialog = () => {
    setRouteDialogOpen(false);
    setEditingRouteId(null);
    setRouteForm(emptyRouteForm);
    setRouteFormError(null);
    setRouteSubmitLoading(false);
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteFormError(null);
    const name = routeForm.name?.trim();
    if (!name) {
      setRouteFormError('Route name is required.');
      return;
    }
    const busId = Number(routeForm.bus_id);
    if (!busId || !buses.some((b) => b.id === busId)) {
      setRouteFormError('Please select a valid bus.');
      return;
    }

    setRouteSubmitLoading(true);
    setError(null);

    try {
      const payload: CreateRouteInput | UpdateRouteInput = {
        bus_id: busId,
        name,
        start_time: routeForm.start_time || null,
        end_time: routeForm.end_time || null,
      };

      if (editingRouteId) {
        const updated = await routeAPI.update(
          editingRouteId,
          payload,
          token,
        );
        setRoutes((prev) =>
          prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
        );
        toast.success('Route updated');
      } else {
        const created = await routeAPI.create(
          payload as CreateRouteInput,
          token,
        );
        setRoutes((prev) => [...prev, created]);
        toast.success('Route created');
      }
      closeRouteDialog();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Route save failed';
      setRouteFormError(msg);
      toast.error(msg);
    } finally {
      setRouteSubmitLoading(false);
    }
  };

  const confirmDeleteRoute = (id: number) => setDeleteRouteId(id);
  const cancelDeleteRoute = () => {
    setDeleteRouteId(null);
    setDeleteRouteLoading(false);
  };

  const handleDeleteRoute = async () => {
    if (deleteRouteId == null) return;
    setDeleteRouteLoading(true);
    setError(null);
    try {
      await routeAPI.delete(deleteRouteId, token);
      setRoutes((prev) => prev.filter((r) => r.id !== deleteRouteId));
      cancelDeleteRoute();
      toast.success('Route deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete route';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleteRouteLoading(false);
    }
  };

  const openAssignments = async (route: Route) => {
    setSelectedRouteForAssignments(route);
    setAssignments([]);
    setAssignmentsLoading(true);
    setOptimizeMessage(null);
    setDirectionsSummary(null);
    try {
      const data = await routeAssignmentAPI.getByRouteId(route.id, token);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load route assignments';
      setError(msg);
      toast.error(msg);
    } finally {
      setAssignmentsLoading(false);
    }
    setAssignmentForm((prev) => ({
      ...prev,
      route_id: route.id,
      student_id: 0,
      pickup_latitude: null,
      pickup_longitude: null,
    }));
  };

  const closeAssignments = () => {
    setSelectedRouteForAssignments(null);
    setAssignments([]);
    setAssignmentSubmitLoading(false);
    setDeleteAssignmentId(null);
    setDeleteAssignmentLoading(false);
  };

  const unassignedStudents = useMemo(() => {
    if (!selectedRouteForAssignments) return [];
    const assignedIds = new Set(
      assignments.map((a) => a.student_id).filter(Boolean),
    );
    return students.filter((s) => !assignedIds.has(s.id));
  }, [assignments, selectedRouteForAssignments, students]);

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteForAssignments) return;
    if (!assignmentForm.student_id) return;

    setAssignmentSubmitLoading(true);
    setError(null);

    try {
      const student = students.find((s) => s.id === assignmentForm.student_id);
      const homeLat =
        student && student.home_latitude != null
          ? Number(student.home_latitude)
          : null;
      const homeLng =
        student && student.home_longitude != null
          ? Number(student.home_longitude)
          : null;

      const payload: CreateRouteAssignmentInput = {
        route_id: selectedRouteForAssignments.id,
        student_id: Number(assignmentForm.student_id),
        pickup_latitude: homeLat,
        pickup_longitude: homeLng,
      };

      const created = await routeAssignmentAPI.create(payload, token);
      setAssignments((prev) => [...prev, created]);
      setAssignmentForm((prev) => ({
        ...prev,
        route_id: selectedRouteForAssignments.id,
        student_id: 0,
        pickup_latitude: null,
        pickup_longitude: null,
      }));
      toast.success('Student added to route');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to assign student';
      setError(msg);
      toast.error(msg);
    } finally {
      setAssignmentSubmitLoading(false);
    }
  };

  const confirmDeleteAssignment = (id: number) => setDeleteAssignmentId(id);
  const cancelDeleteAssignment = () => {
    setDeleteAssignmentId(null);
    setDeleteAssignmentLoading(false);
  };

  const handleDeleteAssignment = async () => {
    if (deleteAssignmentId == null) return;
    setDeleteAssignmentLoading(true);
    setError(null);
    try {
      await routeAssignmentAPI.delete(deleteAssignmentId, token);
      setAssignments((prev) =>
        prev.filter((a) => a.id !== deleteAssignmentId),
      );
      cancelDeleteAssignment();
      toast.success('Student removed from route');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to remove assignment';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleteAssignmentLoading(false);
    }
  };

  const handleOptimizeRoute = async (route: Route) => {
    setOptimizeLoadingRouteId(route.id);
    setOptimizeMessage(null);
    setError(null);
    try {
      const result = await routeAPI.optimize(
        route.id,
        { zone_radius_km: optimizeRadiusMeters / 1000, preview: true },
        token,
      );
      setOptimizePreviewRoute(route);
      setOptimizePreviewWaypoints(result.waypoints ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to preview optimization';
      setError(msg);
      toast.error(msg);
    } finally {
      setOptimizeLoadingRouteId(null);
    }
  };

  const updatePreviewWaypoint = (
    sequence: number,
    field: 'latitude' | 'longitude',
    value: string,
  ) => {
    const parsed = Number(value);
    setOptimizePreviewWaypoints((prev) =>
      prev.map((waypoint) =>
        waypoint.sequence === sequence
          ? { ...waypoint, [field]: Number.isNaN(parsed) ? waypoint[field] : parsed }
          : waypoint,
      ),
    );
  };

  const closeOptimizePreview = () => {
    setOptimizePreviewRoute(null);
    setOptimizePreviewWaypoints([]);
    setOptimizeApplyLoading(false);
  };

  const handleApplyOptimizePreview = async () => {
    if (!optimizePreviewRoute) return;
    setOptimizeApplyLoading(true);
    setError(null);
    try {
      const result = await routeAPI.optimize(
        optimizePreviewRoute.id,
        {
          zone_radius_km: optimizeRadiusMeters / 1000,
          stop_overrides: optimizePreviewWaypoints.map((waypoint) => ({
            sequence: waypoint.sequence,
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
          })),
        },
        token,
      );
      const updatedRoute = result.route ?? result;
      setRoutes((prev) =>
        prev.map((r) => (r.id === updatedRoute.id ? { ...r, ...updatedRoute } : r)),
      );
      if (selectedRouteForAssignments && selectedRouteForAssignments.id === optimizePreviewRoute.id) {
        const refreshed = await routeAssignmentAPI.getByRouteId(
          optimizePreviewRoute.id,
          token,
        );
        setAssignments(Array.isArray(refreshed) ? refreshed : []);
      }
      closeOptimizePreview();
      setOptimizeMessage('Route optimized successfully. Pickup order and stop coordinates updated.');
      toast.success('Route optimized');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to optimize route';
      setError(msg);
      toast.error(msg);
    } finally {
      setOptimizeApplyLoading(false);
    }
  };

  const handleGetDirections = async (route: Route) => {
    setDirectionsLoadingRouteId(route.id);
    setDirectionsSummary(null);
    setError(null);
    try {
      const result = await routeAPI.getDirections(route.id, {}, token);
      const summaryText =
        (result as { summary?: string })?.summary ||
        'Directions retrieved. Open the map view to see the route.';
      setDirectionsSummary(summaryText);
      toast.success('Directions loaded');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch directions';
      setError(msg);
      toast.error(msg);
    } finally {
      setDirectionsLoadingRouteId(null);
    }
  };

  const findBusById = (id: number | undefined) =>
    buses.find((b) => b.id === id) ?? null;

  const totalAssignmentsForRoute = (route: Route) =>
    route.routeAssignments?.length ??
    assignments.filter((a) => a.route_id === route.id).length ??
    0;

  const runLifecycleLabel = (status: RouteRunStatus | undefined) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'arrived':
        return 'Arrived';
      case 'picked_up':
        return 'Picked Up';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'assigned':
      default:
        return 'Assigned';
    }
  };

  const runStatusVariant = (status: RouteRunStatus | undefined) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'arrived':
        return 'secondary';
      case 'picked_up':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'assigned':
      default:
        return 'outline';
    }
  };

  const openCreateRun = () => {
    setCreateRunForm({
      route_id: routes[0]?.id ?? 0,
      run_date: new Date().toISOString().slice(0, 10),
    });
    setCreateRunDialogOpen(true);
  };

  const closeCreateRun = () => {
    setCreateRunDialogOpen(false);
    setCreateRunLoading(false);
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRunForm.route_id || !createRunForm.run_date) return;

    setCreateRunLoading(true);
    try {
      const created = await routeRunAPI.create(
        {
          route_id: createRunForm.route_id,
          run_date: createRunForm.run_date,
        },
        token,
      );
      setRouteRuns((prev) => [created, ...prev]);
      toast.success('Route run created');
      closeCreateRun();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create route run';
      toast.error(msg);
    } finally {
      setCreateRunLoading(false);
    }
  };

  const confirmDeleteRun = (id: number) => setDeleteRunId(id);
  const cancelDeleteRun = () => {
    setDeleteRunId(null);
    setDeleteRunLoading(false);
  };

  const handleDeleteRun = async () => {
    if (deleteRunId == null) return;
    setDeleteRunLoading(true);
    try {
      await routeRunAPI.delete(deleteRunId, token);
      setRouteRuns((prev) => prev.filter((r) => r.id !== deleteRunId));
      cancelDeleteRun();
      toast.success('Route run deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete route run';
      toast.error(msg);
    } finally {
      setDeleteRunLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Routes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <RouteIcon className="size-6 text-primary" aria-hidden />
            Routes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage route templates and daily route runs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'templates' && (
            <>
              <Select
                value={busFilter || 'all'}
                onValueChange={(v) => setBusFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger
                  id="route-bus-filter"
                  className="h-9 w-[140px]"
                  aria-label="Filter by bus"
                >
                  <SelectValue placeholder="All buses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All buses</SelectItem>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={String(bus.id)}>
                      {bus.bus_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadRoutes()}
                disabled={loading}
                aria-label="Refresh routes"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              <Button size="sm" onClick={openCreateRoute} aria-label="Create new route">
                <Plus className="size-4" aria-hidden />
                <span className="ml-2">New route</span>
              </Button>
            </>
          )}
          {activeTab === 'runs' && (
            <>
              <Input
                type="date"
                value={runDateFilter}
                onChange={(e) => setRunDateFilter(e.target.value)}
                className="h-9 w-[160px]"
                aria-label="Filter by run date"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadRouteRuns()}
                disabled={routeRunsLoading}
                aria-label="Refresh route runs"
              >
                {routeRunsLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              <Button size="sm" onClick={openCreateRun} aria-label="Create route run">
                <Plus className="size-4" aria-hidden />
                <span className="ml-2">New run</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            activeTab === 'templates'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Route Templates
          {activeTab === 'templates' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('runs')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            activeTab === 'runs'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Route Runs
          {activeTab === 'runs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeTab === 'templates' && (
      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RouteIcon className="size-5" />
              All Routes
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {loading
                ? 'Loading…'
                : `${routes.length} route${routes.length !== 1 ? 's' : ''} configured`}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn('h-12 w-full', i === 0 && 'rounded-t-lg')}
                />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RouteIcon className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No routes yet</EmptyTitle>
                <EmptyDescription>
                  Create a route linked to a bus, then assign students and use
                  optimize to order pickup stops.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={openCreateRoute}>
                  <Plus className="size-4" />
                  Create your first route
                </Button>
              </EmptyContent>
            </Empty>
          ) : isMobile ? (
            <div className="space-y-3">
              {routes.map((route) => {
                const bus = route.bus ?? findBusById(route.bus_id);
                const total = totalAssignmentsForRoute(route);
                return (
                  <Card key={route.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{route.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {bus && (
                              <span className="flex items-center gap-1">
                                <BusIcon className="size-3" />
                                {bus.bus_number}
                              </span>
                            )}
                            {(route.start_time || route.end_time) && (
                              <span>
                                {route.start_time ?? '—'} – {route.end_time ?? '—'}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="font-normal">
                            {total} student{total !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        <TooltipProvider>
                          <div className="flex shrink-0 gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openAssignments(route)}
                                  aria-label="Manage assignments"
                                >
                                  <Users className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Manage assignments</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOptimizeRoute(route)}
                                  disabled={
                                    optimizeLoadingRouteId === route.id ||
                                    directionsLoadingRouteId === route.id
                                  }
                                  aria-label="Optimize route"
                                >
                                  {optimizeLoadingRouteId === route.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Wand2 className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Optimize pickup order</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGetDirections(route)}
                                  disabled={
                                    directionsLoadingRouteId === route.id ||
                                    optimizeLoadingRouteId === route.id
                                  }
                                  aria-label="Get directions"
                                >
                                  {directionsLoadingRouteId === route.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Map className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Get directions</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditRoute(route)}
                                  aria-label="Edit route"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit route</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDeleteRoute(route.id)}
                                  aria-label="Delete route"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete route</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => {
                  const bus = route.bus ?? findBusById(route.bus_id);
                  const total = totalAssignmentsForRoute(route);
                  return (
                    <TableRow key={route.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {route.id}
                      </TableCell>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>
                        {bus ? (
                          <div className="flex items-center gap-1 text-sm">
                            <BusIcon className="size-3 text-muted-foreground" />
                            <span>{bus.bus_number}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unlinked
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {route.start_time || route.end_time ? (
                          <span className="text-sm">
                            {route.start_time ?? '—'} – {route.end_time ?? '—'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="size-3 text-muted-foreground" />
                          {total} student{total === 1 ? '' : 's'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openAssignments(route)}
                                  aria-label="Manage assignments"
                                >
                                  <Users className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Manage assignments</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOptimizeRoute(route)}
                                  disabled={
                                    optimizeLoadingRouteId === route.id ||
                                    directionsLoadingRouteId === route.id
                                  }
                                  aria-label="Optimize route"
                                >
                                  {optimizeLoadingRouteId === route.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Wand2 className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Optimize pickup order</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGetDirections(route)}
                                  disabled={
                                    directionsLoadingRouteId === route.id ||
                                    optimizeLoadingRouteId === route.id
                                  }
                                  aria-label="Get directions"
                                >
                                  {directionsLoadingRouteId === route.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Map className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Get directions</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditRoute(route)}
                                  aria-label="Edit route"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit route</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDeleteRoute(route.id)}
                                  aria-label="Delete route"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete route</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Route Runs Tab */}
      {activeTab === 'runs' && (
        <Card>
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="size-5" />
                Route Runs
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {routeRunsLoading
                  ? 'Loading…'
                  : `${routeRuns.length} run${routeRuns.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {routeRunsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className={cn('h-12 w-full', i === 0 && 'rounded-t-lg')}
                  />
                ))}
              </div>
            ) : routeRuns.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarDays className="size-6 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No route runs</EmptyTitle>
                  <EmptyDescription>
                    Create a route run from a template for a specific date.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" onClick={openCreateRun}>
                    <Plus className="size-4" />
                    Create a route run
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeRuns.map((run) => {
                      const bus = run.bus ?? findBusById(run.bus_id);
                      const routeName = routes.find((r) => r.id === run.route_id)?.name ?? `Route #${run.route_id}`;
                      return (
                        <TableRow key={run.id}>
                          <TableCell className="font-mono text-muted-foreground">
                            {run.id}
                          </TableCell>
                          <TableCell className="font-medium">{routeName}</TableCell>
                          <TableCell>
                            {bus ? (
                              <div className="flex items-center gap-1 text-sm">
                                <BusIcon className="size-3 text-muted-foreground" />
                                <span>{bus.bus_number}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unlinked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{run.run_date}</span>
                          </TableCell>
                          <TableCell>
                            {run.start_time || run.end_time ? (
                              <span className="text-sm">
                                {run.start_time ?? '—'} – {run.end_time ?? '—'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={runStatusVariant(run.lifecycle_status)} className="font-normal">
                              {runLifecycleLabel(run.lifecycle_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => confirmDeleteRun(run.id)}
                                      aria-label="Delete run"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete run</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={routeDialogOpen} onOpenChange={(open) => !open && closeRouteDialog()}>
        <DialogContent className="sm:max-w-md" aria-describedby="route-form-desc">
          <DialogHeader>
            <DialogTitle>
              {editingRouteId ? 'Edit route' : 'New route'}
            </DialogTitle>
            <DialogDescription id="route-form-desc">
              Link the route to a bus and define its operating window.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRouteSubmit} className="space-y-4">
            {routeFormError && (
              <Alert variant="destructive">
                <AlertDescription>{routeFormError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="route_name">Route name *</Label>
              <Input
                id="route_name"
                value={routeForm.name}
                onChange={(e) =>
                  setRouteForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Morning run – BUS-001"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route_bus">Bus *</Label>
              <Select
                value={routeForm.bus_id ? String(routeForm.bus_id) : ''}
                onValueChange={(v) =>
                  setRouteForm((f) => ({
                    ...f,
                    bus_id: v ? Number(v) : 0,
                  }))
                }
                required
                disabled={buses.length === 0}
              >
                <SelectTrigger id="route_bus" aria-label="Select bus">
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={String(bus.id)}>
                      {bus.bus_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {buses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No buses available. Add a bus first.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={routeForm.start_time ?? ''}
                  onChange={(e) =>
                    setRouteForm((f) => ({
                      ...f,
                      start_time: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={routeForm.end_time ?? ''}
                  onChange={(e) =>
                    setRouteForm((f) => ({
                      ...f,
                      end_time: e.target.value || null,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeRouteDialog}
                disabled={routeSubmitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={routeSubmitLoading}>
                {routeSubmitLoading && (
                  <Loader2 className="size-4 animate-spin mr-2" />
                )}
                {editingRouteId ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteRouteId != null}
        onOpenChange={(open) => !open && cancelDeleteRoute()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this route and its assignments. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRouteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoute}
              disabled={deleteRouteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRouteLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!selectedRouteForAssignments}
        onOpenChange={(open) => !open && closeAssignments()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="assignments-desc">
          <DialogHeader>
            <DialogTitle>
              Manage assignments · {selectedRouteForAssignments?.name}
            </DialogTitle>
            <DialogDescription id="assignments-desc">
              Assign students to this route. Pickup coordinates default to the
              student&apos;s home location. Use &quot;Optimize&quot; on the route to reorder stops.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                Assigned students
              </h3>
              {assignmentsLoading ? (
                <div className="space-y-2 rounded-md border p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <Empty className="rounded-md border border-dashed py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users className="size-6 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No students on this route</EmptyTitle>
                    <EmptyDescription>
                      Add students below. Only unassigned students are listed.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Pickup coords</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments
                        .slice()
                        .sort(
                          (a, b) =>
                            (a.pickup_order ?? Number.MAX_SAFE_INTEGER) -
                            (b.pickup_order ?? Number.MAX_SAFE_INTEGER),
                        )
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.student?.full_name ?? `Student #${a.student_id}`}
                              {a.student?.grade && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({a.student.grade})
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {a.pickup_latitude != null &&
                              a.pickup_longitude != null
                                ? `${Number(a.pickup_latitude).toFixed(4)}, ${Number(
                                    a.pickup_longitude,
                                  ).toFixed(4)}`
                                : 'Not set'}
                            </TableCell>
                            <TableCell>
                              {a.pickup_order != null ? (
                                <span className="text-xs">
                                  Stop {Number(a.pickup_order) + 1}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Un-ordered
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDeleteAssignment(a.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium">Add student to route</h3>
              <form onSubmit={handleAssignmentSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="assignment-student">Student *</Label>
                  <Select
                    value={assignmentForm.student_id ? String(assignmentForm.student_id) : ''}
                    onValueChange={(v) =>
                      setAssignmentForm((f) => ({
                        ...f,
                        student_id: v ? Number(v) : 0,
                      }))
                    }
                    disabled={unassignedStudents.length === 0}
                  >
                    <SelectTrigger id="assignment-student" aria-label="Select student to add">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedStudents.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.full_name}
                          {s.grade ? ` (${s.grade})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {unassignedStudents.length === 0
                      ? 'All students are already assigned to this route.'
                      : 'Pickup coordinates default to the student&apos;s home location.'}
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={assignmentSubmitLoading || !assignmentForm.student_id || unassignedStudents.length === 0}
                  >
                    {assignmentSubmitLoading && (
                      <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
                    )}
                    Add to route
                  </Button>
                </DialogFooter>
              </form>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium">Optimize pickup grouping</h3>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="optimize-radius">
                    Group students within ___ meters
                  </Label>
                  <Input
                    id="optimize-radius"
                    type="number"
                    min={50}
                    max={2000}
                    step={50}
                    value={optimizeRadiusMeters}
                    onChange={(e) =>
                      setOptimizeRadiusMeters(
                        Math.max(50, Number(e.target.value) || 50),
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Smaller values create more stops. Larger values group more
                    students together.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    selectedRouteForAssignments &&
                    handleOptimizeRoute(selectedRouteForAssignments)
                  }
                  disabled={
                    !selectedRouteForAssignments ||
                    assignments.length === 0 ||
                    optimizeLoadingRouteId === selectedRouteForAssignments?.id
                  }
                >
                  {optimizeLoadingRouteId === selectedRouteForAssignments?.id && (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  )}
                  Preview grouping
                </Button>
              </div>
            </div>

            {(optimizeMessage || directionsSummary) && (
              <div className="border-t pt-3 space-y-2 text-xs text-muted-foreground">
                {optimizeMessage && <p>{optimizeMessage}</p>}
                {directionsSummary && (
                  <p className="flex items-center gap-1">
                    <Map className="size-3" />
                    <span>{directionsSummary}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!optimizePreviewRoute}
        onOpenChange={(open) => !open && closeOptimizePreview()}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="optimize-preview-desc">
          <DialogHeader>
            <DialogTitle>
              Preview pickup grouping · {optimizePreviewRoute?.name}
            </DialogTitle>
            <DialogDescription id="optimize-preview-desc">
              Review each grouped stop, then adjust the representative stop
              coordinate before applying it to the route.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              Grouping radius: {optimizeRadiusMeters} meters ·{' '}
              {optimizePreviewWaypoints.length} grouped stops
            </div>

            {optimizePreviewWaypoints.length === 0 ? (
              <Empty className="rounded-md border border-dashed py-6">
                <EmptyHeader>
                  <EmptyTitle>No grouped stops found</EmptyTitle>
                  <EmptyDescription>
                    Add students with pickup coordinates before optimizing.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {optimizePreviewWaypoints.map((waypoint) => (
                  <div key={waypoint.sequence} className="rounded-md border p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          Stop {waypoint.sequence + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {waypoint.students.length} student
                          {waypoint.students.length === 1 ? '' : 's'} grouped
                        </p>
                      </div>
                      <Badge variant="outline">
                        {waypoint.latitude.toFixed(5)},{' '}
                        {waypoint.longitude.toFixed(5)}
                      </Badge>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-1">
                      {waypoint.students.map((student) => (
                        <Badge key={student.id} variant="secondary">
                          {student.full_name}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`stop-${waypoint.sequence}-lat`}>
                          Representative latitude
                        </Label>
                        <Input
                          id={`stop-${waypoint.sequence}-lat`}
                          type="number"
                          step="0.000001"
                          value={waypoint.latitude}
                          onChange={(e) =>
                            updatePreviewWaypoint(
                              waypoint.sequence,
                              'latitude',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`stop-${waypoint.sequence}-lng`}>
                          Representative longitude
                        </Label>
                        <Input
                          id={`stop-${waypoint.sequence}-lng`}
                          type="number"
                          step="0.000001"
                          value={waypoint.longitude}
                          onChange={(e) =>
                            updatePreviewWaypoint(
                              waypoint.sequence,
                              'longitude',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeOptimizePreview}
              disabled={optimizeApplyLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplyOptimizePreview}
              disabled={
                optimizeApplyLoading || optimizePreviewWaypoints.length === 0
              }
            >
              {optimizeApplyLoading && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Apply grouping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteAssignmentId != null}
        onOpenChange={(open) => !open && cancelDeleteAssignment()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student from route?</AlertDialogTitle>
            <AlertDialogDescription>
              This student will no longer be part of the selected route. You can
              always re-add them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAssignmentLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              disabled={deleteAssignmentLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAssignmentLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Route Run Dialog */}
      <Dialog open={createRunDialogOpen} onOpenChange={(open) => !open && closeCreateRun()}>
        <DialogContent className="sm:max-w-md" aria-describedby="run-form-desc">
          <DialogHeader>
            <DialogTitle>New route run</DialogTitle>
            <DialogDescription id="run-form-desc">
              Create a daily execution instance from a route template.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRun} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="run_route">Route template *</Label>
              <Select
                value={createRunForm.route_id ? String(createRunForm.route_id) : ''}
                onValueChange={(v) =>
                  setCreateRunForm((f) => ({ ...f, route_id: Number(v) }))
                }
                required
                disabled={routes.length === 0}
              >
                <SelectTrigger id="run_route" aria-label="Select route">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={String(route.id)}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {routes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No routes available. Create a route template first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="run_date">Run date *</Label>
              <Input
                id="run_date"
                type="date"
                value={createRunForm.run_date}
                onChange={(e) =>
                  setCreateRunForm((f) => ({ ...f, run_date: e.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreateRun} disabled={createRunLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRunLoading}>
                {createRunLoading && (
                  <Loader2 className="size-4 animate-spin mr-2" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Route Run Alert */}
      <AlertDialog
        open={deleteRunId != null}
        onOpenChange={(open) => !open && cancelDeleteRun()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete route run?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the daily run instance and its student roster. The route template will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRunLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRun}
              disabled={deleteRunLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRunLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeTab === 'templates' && (
      <Card className="border-muted/50 bg-muted/30">
        <CardContent className="flex gap-3 p-4">
          <Info className="size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">About routes</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Create a route per bus and set its time window (start/end).</li>
              <li>Assign students from the list; pickup order can be optimized.</li>
              <li>Use &quot;Optimize&quot; to reorder stops by proximity and reduce drive time.</li>
              <li>Get directions to see the full route on the map.</li>
              <li>Daily route runs are auto-created from templates at 01:00 UTC.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

