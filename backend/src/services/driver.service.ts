import { Op } from 'sequelize';

import { db } from '../../models';
import { publishRealtimeEvent } from '../realtime/realtime.events';
import { AlcoholCheckService } from './alcoholCheck.service';
import { RouteRunService, type RouteRunStatus } from './routeRun.service';

const { Bus, RouteRun } = db;

export type DriverJobStatus = RouteRunStatus;

function parseNumericId(raw: unknown, code: string): number {
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw { status: 400, code, message: 'Invalid numeric identifier.' };
  }
  return parsed;
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

    const today = new Date().toISOString().slice(0, 10);
    return RouteRunService.getRunsForDriverBuses(busIds, today, statusRaw);
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

    try {
      return await RouteRunService.getRouteRunByIdForBuses(jobId, busIds);
    } catch (err: any) {
      if (err?.code === 'RUN_NOT_FOUND') {
        throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
      }
      throw err;
    }
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

    const scoped = await RouteRun.findOne({
      where: { id: jobId, bus_id: { [Op.in]: busIds } },
      attributes: ['id'],
    });
    if (!scoped) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    if (targetStatus === 'accepted') {
      const passed = await AlcoholCheckService.hasPassedRouteCheck(jobId, driverId);
      if (!passed) {
        throw {
          status: 409,
          code: 'ALCOHOL_TEST_REQUIRED',
          message: 'Complete a passing pre-route alcohol test before accepting this route.',
        };
      }
    }

    const reason = typeof cancelReason === 'string' ? cancelReason : undefined;
    let output: Awaited<ReturnType<typeof RouteRunService.transitionStatus>>;
    try {
      output = await RouteRunService.transitionStatus(jobId, targetStatus, reason);
    } catch (err: any) {
      if (err?.code === 'INVALID_RUN_TRANSITION') {
        throw {
          status: err.status ?? 409,
          code: 'INVALID_JOB_TRANSITION',
          message: typeof err.message === 'string' ? err.message.replace(/\brun\b/gi, 'job') : 'Invalid job transition.',
        };
      }
      throw err;
    }

    publishRealtimeEvent('driver.job.updated', {
      routeId: output.id,
      status: output.lifecycle_status,
      busId: output.bus_id,
      updatedAt: output.updated_at ?? new Date().toISOString(),
    });

    return output;
  }

  static async startAlcoholCheck(
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

    const scoped = await RouteRun.findOne({
      where: { id: jobId, bus_id: { [Op.in]: busIds } },
      attributes: ['id'],
    });
    if (!scoped) {
      throw { status: 404, code: 'JOB_NOT_FOUND', message: 'Job not found for this driver.' };
    }

    return AlcoholCheckService.startForRouteRun(jobId, driverId);
  }

  static async getAlcoholCheck(
    requesterIdRaw: unknown,
    requesterRole: string | undefined,
    jobIdRaw: unknown,
    targetDriverIdRaw?: unknown
  ) {
    const driverId = await this.resolveDriverScope(requesterIdRaw, requesterRole, targetDriverIdRaw);
    const jobId = parseNumericId(jobIdRaw, 'INVALID_JOB_ID');
    return AlcoholCheckService.getForRouteRun(jobId, driverId);
  }
}
