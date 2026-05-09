import { Op } from 'sequelize';

import { db } from '../../models';

const { Bus, Route, RouteAssignment, Student } = db;

export type DriverJobStatus =
  | 'assigned'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

const ACTIVE_JOB_STATUSES: DriverJobStatus[] = ['assigned', 'accepted', 'arrived', 'picked_up'];

const VALID_TRANSITIONS: Record<DriverJobStatus, DriverJobStatus[]> = {
  assigned: ['accepted', 'cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['picked_up', 'cancelled'],
  picked_up: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function parseNumericId(raw: unknown, code: string): number {
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw { status: 400, code, message: 'Invalid numeric identifier.' };
  }
  return parsed;
}

function parseJobStatusFilter(rawStatus: unknown): DriverJobStatus[] | undefined {
  if (typeof rawStatus !== 'string' || !rawStatus.trim()) return undefined;
  const status = rawStatus.trim().toLowerCase();
  if (status === 'active') return ACTIVE_JOB_STATUSES;
  const normalized = status === 'pickup' ? 'picked_up' : status;
  const allowed: DriverJobStatus[] = ['assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'];
  if (!allowed.includes(normalized as DriverJobStatus)) {
    throw {
      status: 400,
      code: 'INVALID_STATUS_FILTER',
      message: 'status must be one of active, assigned, accepted, arrived, pickup, completed, cancelled.',
    };
  }
  return [normalized as DriverJobStatus];
}

async function getDriverBusIds(driverId: number): Promise<number[]> {
  const buses = await Bus.findAll({
    where: { driver_id: driverId },
    attributes: ['id'],
  });
  return buses.map((bus: any) => Number(bus.id));
}

export class DriverService {
  private static async resolveDriverScope(
    requesterIdRaw: unknown,
    requesterRole: string | undefined,
    targetDriverIdRaw?: unknown
  ): Promise<number> {
    const requesterId = parseNumericId(requesterIdRaw, 'INVALID_DRIVER_ID');
    if (requesterRole === 'admin') {
      if (targetDriverIdRaw === undefined || targetDriverIdRaw === null || targetDriverIdRaw === '') {
        throw {
          status: 400,
          code: 'MISSING_DRIVER_ID',
          message: 'driver_id is required for admin requests.',
        };
      }
      return parseNumericId(targetDriverIdRaw, 'INVALID_DRIVER_ID');
    }
    return requesterId;
  }

  static async getJobsForDriver(
    requesterIdRaw: unknown,
    requesterRole: string | undefined,
    statusRaw?: unknown,
    targetDriverIdRaw?: unknown
  ) {
    const driverId = await this.resolveDriverScope(requesterIdRaw, requesterRole, targetDriverIdRaw);
    const busIds = await getDriverBusIds(driverId);
    if (busIds.length === 0) return [];

    const statusFilter = parseJobStatusFilter(statusRaw);
    const where: Record<string, unknown> = { bus_id: { [Op.in]: busIds } };
    if (statusFilter) where.lifecycle_status = { [Op.in]: statusFilter };

    const routes = await Route.findAll({
      where,
      attributes: [
        'id',
        'bus_id',
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
          model: RouteAssignment,
          as: 'routeAssignments',
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

    return routes.map((route: any) => route.toJSON());
  }

  static async getJobForDriver(
    requesterIdRaw: unknown,
    requesterRole: string | undefined,
    jobIdRaw: unknown,
    targetDriverIdRaw?: unknown
  ) {
    const driverId = await this.resolveDriverScope(requesterIdRaw, requesterRole, targetDriverIdRaw);
    const jobId = parseNumericId(jobIdRaw, 'INVALID_JOB_ID');
    const busIds = await getDriverBusIds(driverId);
    if (busIds.length === 0) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    const route = await Route.findOne({
      where: { id: jobId, bus_id: { [Op.in]: busIds } },
      attributes: [
        'id',
        'bus_id',
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
          model: RouteAssignment,
          as: 'routeAssignments',
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

    if (!route) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    return route.toJSON();
  }

  static async transitionJobStatus(
    requesterIdRaw: unknown,
    requesterRole: string | undefined,
    jobIdRaw: unknown,
    targetStatus: DriverJobStatus,
    cancelReason?: unknown,
    targetDriverIdRaw?: unknown
  ) {
    const driverId = await this.resolveDriverScope(requesterIdRaw, requesterRole, targetDriverIdRaw);
    const jobId = parseNumericId(jobIdRaw, 'INVALID_JOB_ID');
    const busIds = await getDriverBusIds(driverId);
    if (busIds.length === 0) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    const route = await Route.findOne({
      where: { id: jobId, bus_id: { [Op.in]: busIds } },
    });
    if (!route) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    const currentStatus = ((route as any).lifecycle_status ?? 'assigned') as DriverJobStatus;
    if (currentStatus === targetStatus) return route.toJSON();

    const allowedNext = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowedNext.includes(targetStatus)) {
      throw {
        status: 409,
        code: 'INVALID_JOB_TRANSITION',
        message: `Cannot move job from ${currentStatus} to ${targetStatus}.`,
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

    await route.update(updates);
    return route.toJSON();
  }
}
