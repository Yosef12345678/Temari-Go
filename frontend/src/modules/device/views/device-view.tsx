"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { deviceAPI, type Device } from "@/lib/device-api";
import { busAPI, type Bus } from "@/lib/bus-api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Cpu, KeyRound, Plus, RefreshCw, Shield, Copy } from "lucide-react";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function DeviceView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const token = useMemo(() => authClient.getAccessToken() ?? undefined, [user]);

  const [devices, setDevices] = useState<Device[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createBusId, setCreateBusId] = useState<string>("unbound");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [secretDialog, setSecretDialog] = useState<{
    title: string;
    deviceName: string;
    rawKey: string;
  } | null>(null);

  const [rotateDeviceId, setRotateDeviceId] = useState<number | null>(null);
  const [rotateLoading, setRotateLoading] = useState(false);

  const [bindingDeviceId, setBindingDeviceId] = useState<number | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setDevices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [deviceRes, busRes] = await Promise.all([
        deviceAPI.list(token, { page: 1, pageSize: 200 }),
        busAPI.getAll(token, { page: 1, pageSize: 200 }).then((r) => r.items),
      ]);
      setDevices(Array.isArray(deviceRes?.items) ? deviceRes.items : []);
      setBuses(Array.isArray(busRes) ? busRes : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load devices";
      setError(msg);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const busMap = useMemo(() => {
    const m: Record<number, string> = {};
    buses.forEach((b) => {
      m[b.id] = b.bus_number;
    });
    return m;
  }, [buses]);

  const openCreate = () => {
    setCreateName("");
    setCreateBusId("unbound");
    setCreateError(null);
    setCreateLoading(false);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateLoading(false);
    setCreateError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const name = createName.trim();
    if (!name) {
      setCreateError("Device name is required.");
      return;
    }

    const bus_id =
      createBusId === "unbound" ? null : createBusId ? Number(createBusId) : null;

    setCreateLoading(true);
    try {
      const result = await deviceAPI.create({ name, bus_id }, token);
      setDevices((prev) => [result.device, ...prev]);
      setSecretDialog({
        title: "Device created",
        deviceName: result.device.name,
        rawKey: result.rawKey,
      });
      toast.success("Device created");
      closeCreate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create device";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const confirmRotate = (id: number) => setRotateDeviceId(id);
  const cancelRotate = () => {
    setRotateDeviceId(null);
    setRotateLoading(false);
  };

  const handleRotate = async () => {
    if (rotateDeviceId == null) return;
    setRotateLoading(true);
    try {
      const result = await deviceAPI.rotateKey(rotateDeviceId, token);
      setDevices((prev) =>
        prev.map((d) => (d.id === rotateDeviceId ? { ...d, ...result.device } : d)),
      );
      setSecretDialog({
        title: "Device key rotated",
        deviceName: result.device.name,
        rawKey: result.rawKey,
      });
      toast.success("Key rotated");
      cancelRotate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rotate key";
      setError(msg);
      toast.error(msg);
      setRotateLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleBindBus = async (deviceId: number, next: string) => {
    setBindingDeviceId(deviceId);
    setError(null);
    try {
      const bus_id = next === "unbound" ? null : Number(next);
      const updated = await deviceAPI.setBus(deviceId, bus_id, token);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updated } : d)));
      toast.success("Bus binding updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update binding";
      setError(msg);
      toast.error(msg);
    } finally {
      setBindingDeviceId(null);
    }
  };

  const handleToggleActive = async (deviceId: number, nextActive: boolean) => {
    setActiveDeviceId(deviceId);
    setError(null);
    try {
      const updated = await deviceAPI.setActive(deviceId, nextActive, token);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updated } : d)));
      toast.success(nextActive ? "Device activated" : "Device deactivated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update device";
      setError(msg);
      toast.error(msg);
    } finally {
      setActiveDeviceId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
          <Shield className="size-4" />
          Admin access required.
        </div>
      </div>
    );
  }

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
            <BreadcrumbPage>Devices</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Cpu className="size-6 text-primary" aria-hidden />
            Devices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Provision microcontroller devices, rotate keys, and bind them to a bus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh devices"
          >
            <RefreshCw className="size-4" aria-hidden />
            <span className="ml-2">Refresh</span>
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            <span className="ml-2">New device</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cpu className="size-5" />
            All devices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${devices.length} device${devices.length !== 1 ? "s" : ""}`}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No devices yet.</p>
              <Button className="mt-3" size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                <span className="ml-2">Create first device</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    <th className="px-4 py-2.5">ID</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Bus</th>
                    <th className="px-4 py-2.5">Active</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const busLabel =
                      d.bus_id != null ? busMap[Number(d.bus_id)] ?? `#${d.bus_id}` : null;
                    const busyBinding = bindingDeviceId === d.id;
                    const busyActive = activeDeviceId === d.id;
                    return (
                      <tr key={d.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2 font-mono text-muted-foreground">{d.id}</td>
                        <td className="px-4 py-2 font-medium">{d.name}</td>
                        <td className="px-4 py-2">
                          <Select
                            value={d.bus_id != null ? String(d.bus_id) : "unbound"}
                            onValueChange={(v) => void handleBindBus(d.id, v)}
                            disabled={busyBinding}
                          >
                            <SelectTrigger className="h-8 w-[160px]" aria-label="Bind to bus">
                              <SelectValue placeholder="Unbound" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unbound">Unbound</SelectItem>
                              {buses.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  {b.bus_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {busLabel && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Bound to {busLabel}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!!d.active}
                              onCheckedChange={(v) => void handleToggleActive(d.id, v)}
                              disabled={busyActive}
                            />
                            <Badge variant={d.active ? "secondary" : "outline"} className="font-normal">
                              {d.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {formatDate(d.created_at)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmRotate(d.id)}
                          >
                            <KeyRound className="size-4" />
                            <span className="ml-2">Rotate key</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent className="sm:max-w-md" aria-describedby="device-create-desc">
          <DialogHeader>
            <DialogTitle>Create device</DialogTitle>
            <DialogDescription id="device-create-desc">
              A raw key will be generated once. Store it securely and configure the device to send it as{" "}
              <span className="font-mono">x-device-key</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <Alert variant="destructive">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="device-name">Name *</Label>
              <Input
                id="device-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. ESP32-BUS-001"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-bus">Bind to bus</Label>
              <Select value={createBusId} onValueChange={setCreateBusId}>
                <SelectTrigger id="device-bus">
                  <SelectValue placeholder="Unbound" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unbound">Unbound</SelectItem>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.bus_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Binding a device to a bus prevents sending data for other buses.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreate} disabled={createLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={rotateDeviceId != null} onOpenChange={(open) => !open && cancelRotate()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate device key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the existing key. Update the device firmware immediately after rotating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rotateLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate} disabled={rotateLoading}>
              {rotateLoading ? "Rotating…" : "Rotate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={secretDialog != null} onOpenChange={(open) => !open && setSecretDialog(null)}>
        <DialogContent className="sm:max-w-lg" aria-describedby="device-secret-desc">
          <DialogHeader>
            <DialogTitle>{secretDialog?.title ?? "Device key"}</DialogTitle>
            <DialogDescription id="device-secret-desc">
              This raw key is shown only once. Store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Device</p>
              <p className="text-sm font-medium">{secretDialog?.deviceName ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <Label>Raw key</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={secretDialog?.rawKey ?? ""}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleCopy(secretDialog?.rawKey ?? "")}
                  aria-label="Copy raw key"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send it in requests as header{" "}
                <span className="font-mono">x-device-key</span>.
              </p>
              <div className="rounded-md border p-3 text-xs">
                <p className="text-muted-foreground">Example:</p>
                <p className="mt-1 font-mono">
                  x-device-key: {secretDialog?.rawKey?.slice(0, 10) ?? ""}…
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSecretDialog(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

