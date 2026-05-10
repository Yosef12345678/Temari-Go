import { Op } from 'sequelize';
import { db } from '../../models';

const { RouteRun, RouteRunAssignment, Route, RouteAssignment, Bus, Student } = db;

export type RouteRunStatus =
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

const ACTIVE_STATUSES: RouteRunStatus[] = ['assigned', 'accepted', 'arrived', 'picked_up'];

const VALID_TRANSITIONS: Record<RouteRunStatus, RouteRunStatus[]> = {
  assigned: ['accepted', 'cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['picked_up', 'cancelled'],
  picked_up: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export interface CreateRouteRunInput {
  route_id: number;
  run_date: string; // YYYY-MM-DD
  name?: string;
  start_time?: string;
  end_time?: string;
}

export interface RouteRunFilters {
  route_id?: number;
  bus_id?: number;
  run_date?: string;
  status?: RouteRunStatus | 'active';
}

function parseNumericId(raw: unknown, code: string): number {
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw { status: 400, code, message: 'Invalid numeric identifier.' };
  }
  return parsed;
}

function parseStatusFilter(rawStatus: unknown): RouteRunStatus[] | undefined {
  if (typeof rawStatus !== 'string' || !rawStatus.trim()) return undefined;
  const status = rawStatus.trim().toLowerCase();
  if (status === 'active') return ACTIVE_STATUSES;
  const normalized = status === 'pickup' ? 'picked_up' : status;
  const allowed: RouteRunStatus[] = ['assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'];
  if (!allowed.includes(normalized as RouteRunStatus)) {
    throw {
      status: 400,
      code: 'INVALID_STATUS_FILTER',
      message: 'status must be one of active, assigned, accepted, arrived, pickup, completed, cancelled.',
    };
  }
  return [normalized as RouteRunStatus];
}

function withETAs(run: any) {
  const json = run.toJSON ? run.toJSON() : run;
  const assignments = Array.isArray(json.routeRunAssignments) ? json.routeRunAssignments : [];
  const sorted = [...assignments].sort((a, b) => (a.pickup_order ?? 0) - (b.pickup_order ?? 0));
  let cumulativeMinutes = 8;
  const stops = sorted.map((item: any) => {
    cumulativeMinutes += 6;
    return {
      assignment_id: item.id,
      student_id: item.student_id,
      pickup_order: item.pickup_order ?? null,
      eta_minutes: cumulativeMinutes,
      eta_at: new Date(Date.now() + cumulativeMinutes * 60 * 1000).toISOString(),
      student_name: item.student?.full_name ?? null,
      pickup_latitude: item.pickup_latitude ?? null,
      pickup_longitude: item.pickup_longitude ?? null,
    };
  });

  return {
    ...json,
    route_stops_eta: stops,
    traffic_multiplier: 1.0,
  };
}

const RUN_DETAIL_ATTRIBUTES = [
  'id',
  'route_id',
  'bus_id',
  'run_date',
  'name',
  'start_time',
  'end_time',
  'lifecycle_status',
  'accepted_at',
  'arrived_at',
  'picked_up_at',
  'completed_at',
  'cancelled_at',
  'cancel_reason',
  'updated_at',
] as const;

const RUN_DETAIL_INCLUDE = [
  {
    model: Bus,
    as: 'bus',
    attributes: ['id', 'bus_number'],
  },
  {
    model: RouteRunAssignment,
    as: 'routeRunAssignments',
    attributes: ['id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
    required: false,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'full_name', 'grade'],
        required: false,
      },
    ],
  },
];

async function findRouteRunDetail(where: Record<string, unknown>) {
  const run = await RouteRun.findOne({
    where,
    attributes: [...RUN_DETAIL_ATTRIBUTES],
    include: RUN_DETAIL_INCLUDE,
  });
  if (!run) {
    throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
  }
  return withETAs(run);
}

export class RouteRunService {
  /**
   * Create a new RouteRun from a Route template, copying assignments.
   */
  static async createRouteRun(input: CreateRouteRunInput) {
    const routeId = parseNumericId(input.route_id, 'INVALID_ROUTE_ID');
    const runDate = input.run_date;
    if (!runDate || !/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
      throw { status: 400, code: 'INVALID_RUN_DATE', message: 'run_date must be YYYY-MM-DD.' };
    }

    const route = await Route.findByPk(routeId, {
      include: [
        {
          model: RouteAssignment,
          as: 'routeAssignments',
          required: false,
          include: [{ model: Student, as: 'student', attributes: ['id', 'full_name', 'grade'], required: false }],
        },
      ],
    });
    if (!route) {
      throw { status: 404, code: 'ROUTE_NOT_FOUND', message: 'Route template not found.' };
    }

    const existing = await RouteRun.findOne({ where: { route_id: routeId, run_date: runDate } });
    if (existing) {
      throw { status: 409, code: 'RUN_ALREADY_EXISTS', message: 'A run already exists for this route and date.' };
    }

    const run = await RouteRun.create({
      route_id: routeId,
      bus_id: (route as any).bus_id,
      run_date: runDate,
      name: input.name?.trim() || (route as any).name,
      start_time: input.start_time ?? (route as any).start_time ?? undefined,
      end_time: input.end_time ?? (route as any).end_time ?? undefined,
      lifecycle_status: 'assigned',
    });

    // Copy template assignments into run assignments
    const templateAssignments = (route as any).routeAssignments ?? [];
    for (const ta of templateAssignments) {
      await RouteRunAssignment.create({
        route_run_id: run.id,
        student_id: ta.student_id,
        pickup_latitude: ta.pickup_latitude ?? undefined,
        pickup_longitude: ta.pickup_longitude ?? undefined,
        pickup_order: ta.pickup_order ?? undefined,
      });
    }

    const created = await RouteRun.findByPk(run.id, {
      attributes: [
        'id',
        'route_id',
        'bus_id',
        'run_date',
        'name',
        'start_time',
        'end_time',
        'lifecycle_status',
        'accepted_at',
        'arrived_at',
        'picked_up_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'updated_at',
      ],
      include: [
        {
          model: Bus,
          as: 'bus',
          attributes: ['id', 'bus_number'],
        },
        {
          model: RouteRunAssignment,
          as: 'routeRunAssignments',
          attributes: ['id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'full_name', 'grade'],
              required: false,
            },
          ],
        },
      ],
    });

    return withETAs(created);
  }

  /**
   * List route runs with optional filters.
   */
  static async getAllRouteRuns(filters?: RouteRunFilters) {
    const where: Record<string, unknown> = {};
    if (filters?.route_id != null) where.route_id = Number(filters.route_id);
    if (filters?.bus_id != null) where.bus_id = Number(filters.bus_id);
    if (filters?.run_date != null) where.run_date = filters.run_date;

    const statusFilter = filters?.status ? parseStatusFilter(filters.status) : undefined;
    if (statusFilter) where.lifecycle_status = { [Op.in]: statusFilter };

    const runs = await RouteRun.findAll({
      where: Object.keys(where).length ? where : undefined,
      attributes: [
        'id',
        'route_id',
        'bus_id',
        'run_date',
        'name',
        'start_time',
        'end_time',
        'lifecycle_status',
        'accepted_at',
        'arrived_at',
        'picked_up_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'updated_at',
      ],
      include: [
        {
          model: Bus,
          as: 'bus',
          attributes: ['id', 'bus_number'],
        },
        {
          model: RouteRunAssignment,
          as: 'routeRunAssignments',
          attributes: ['id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'full_name', 'grade'],
              required: false,
            },
          ],
        },
      ],
      order: [['run_date', 'DESC'], ['updated_at', 'DESC']],
    });

    return runs.map((r: any) => withETAs(r));
  }

  /**
   * Get a single route run by ID with full details.
   */
  static async getRouteRunById(id: number) {
    return findRouteRunDetail({ id });
  }

  /**
   * Same as getRouteRunById but restricted to runs assigned to one of the given buses (driver scope).
   */
  static async getRouteRunByIdForBuses(id: number, busIds: number[]) {
    if (busIds.length === 0) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }
    return findRouteRunDetail({ id, bus_id: { [Op.in]: busIds } });
  }

  /**
   * Delete a route run and its assignments.
   */
  static async deleteRouteRun(id: number) {
    const run = await RouteRun.findByPk(id);
    if (!run) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }

    await RouteRunAssignment.destroy({ where: { route_run_id: id } });
    await run.destroy();
    return { deleted: true, id };
  }

  /**
   * Transition a route run's lifecycle status.
   */
  static async transitionStatus(
    runId: number,
    targetStatus: RouteRunStatus,
    cancelReason?: string
  ) {
    const run = await RouteRun.findByPk(runId);
    if (!run) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }

    const currentStatus = ((run as any).lifecycle_status ?? 'assigned') as RouteRunStatus;
    if (currentStatus === targetStatus) return findRouteRunDetail({ id: runId });

    const allowedNext = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowedNext.includes(targetStatus)) {
      throw {
        status: 409,
        code: 'INVALID_RUN_TRANSITION',
        message: `Cannot move run from ${currentStatus} to ${targetStatus}.`,
      };
    }

    const now = new Date();
    const updates: Record<string, unknown> = { lifecycle_status: targetStatus };
    if (targetStatus === 'accepted') updates.accepted_at = now;
    if (targetStatus === 'arrived') updates.arrived_at = now;
    if (targetStatus === 'picked_up') updates.picked_up_at = now;
    if (targetStatus === 'completed') updates.completed_at = now;
    if (targetStatus === 'cancelled') {
      const reason = typeof cancelReason === 'string' ? cancelReason.trim() : '';
      updates.cancelled_at = now;
      updates.cancel_reason = reason || null;
    }

    await run.update(updates);
    return findRouteRunDetail({ id: runId });
  }

  /**
   * Get active runs for a driver's buses.
   */
  static async getRunsForDriverBuses(
    busIds: number[],
    runDate?: string,
    statusRaw?: unknown
  ) {
    if (busIds.length === 0) return [];

    const dateFilter = runDate && /^\d{4}-\d{2}-\d{2}$/.test(runDate) ? runDate : new Date().toISOString().slice(0, 10);
    const statusFilter = parseStatusFilter(statusRaw);

    const where: Record<string, unknown> = {
      bus_id: { [Op.in]: busIds },
      run_date: dateFilter,
    };
    if (statusFilter) where.lifecycle_status = { [Op.in]: statusFilter };

    const runs = await RouteRun.findAll({
      where,
      attributes: [
        'id',
        'route_id',
        'bus_id',
        'run_date',
        'name',
        'start_time',
        'end_time',
        'lifecycle_status',
        'accepted_at',
        'arrived_at',
        'picked_up_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'updated_at',
      ],
      include: [
        {
          model: Bus,
          as: 'bus',
          attributes: ['id', 'bus_number'],
        },
        {
          model: RouteRunAssignment,
          as: 'routeRunAssignments',
          attributes: ['id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'full_name', 'grade'],
              required: false,
            },
          ],
        },
      ],
      order: [['updated_at', 'DESC']],
    });

    return runs.map((r: any) => withETAs(r));
  }

  /**
   * Auto-create tomorrow's runs from all routes that have at least one assignment.
   */
  static async autoCreateRunsForDate(targetDate: string) {
    const routes = await Route.findAll({
      include: [
        {
          model: RouteAssignment,
          as: 'routeAssignments',
          required: true,
          attributes: ['id'],
        },
      ],
    });

    const results: { created: number; skipped: number; errors: string[] } = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const route of routes) {
      try {
        await this.createRouteRun({
          route_id: (route as any).id,
          run_date: targetDate,
        });
        results.created++;
      } catch (err: any) {
        if (err.code === 'RUN_ALREADY_EXISTS') {
          results.skipped++;
        } else {
          results.errors.push(`Route ${(route as any).id}: ${err.message ?? String(err)}`);
        }
      }
    }

    return results;
  }
}
