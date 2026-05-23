import { Op } from 'sequelize';
import { db } from '../../models';
import { publishRealtimeEvent } from '../realtime/realtime.events';
import {
  alcoholCheckScheduleMeta,
  isWithinAlcoholCheckSchedule,
} from '../utils/alcoholCheckSchedule';

const { AlcoholCheckSession, RouteRun, Bus } = db;

const DEFAULT_WINDOW_SECONDS = 60;
const WINDOW_SECONDS = Number(process.env.ALCOHOL_CHECK_WINDOW_SECONDS) || DEFAULT_WINDOW_SECONDS;

export class AlcoholCheckService {
  static async startForRouteRun(routeRunId: number, driverId: number) {
    if (!isWithinAlcoholCheckSchedule()) {
      throw {
        status: 403,
        code: 'ALCOHOL_CHECK_OUTSIDE_SCHEDULE',
        message: 'Alcohol checks are only available 06:00–07:00 and 15:00–16:00 East Africa Time.',
      };
    }

    const run = await RouteRun.findByPk(routeRunId);
    if (!run) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }

    if ((run as any).lifecycle_status !== 'assigned') {
      throw { status: 409, code: 'ALCOHOL_CHECK_NOT_AVAILABLE', message: 'Alcohol check can only be requested before accepting the route.' };
    }

    const bus = await Bus.findByPk((run as any).bus_id);
    if (!bus || Number((bus as any).driver_id) !== Number(driverId)) {
      throw { status: 403, code: 'JOB_NOT_ASSIGNED_TO_DRIVER', message: 'This route is not assigned to the current driver.' };
    }

    const passedSession = await AlcoholCheckSession.findOne({
      where: { route_run_id: routeRunId, driver_id: driverId, status: 'passed' },
      order: [['updated_at', 'DESC']],
    });
    if (passedSession) return this.formatSession(passedSession);

    await AlcoholCheckSession.update(
      { status: 'expired' },
      {
        where: {
          route_run_id: routeRunId,
          driver_id: driverId,
          status: 'pending',
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );

    const expiresAt = new Date(Date.now() + WINDOW_SECONDS * 1000);
    const [session] = await AlcoholCheckSession.findOrCreate({
      where: { route_run_id: routeRunId, driver_id: driverId, status: 'pending' },
      defaults: {
        route_run_id: routeRunId,
        driver_id: driverId,
        bus_id: (run as any).bus_id,
        status: 'pending',
        expires_at: expiresAt,
      },
    });

    if ((session as any).expires_at < new Date()) {
      await session.update({ expires_at: expiresAt, bus_id: (run as any).bus_id, alcohol_test_id: null });
    }

    publishRealtimeEvent('safety.alcohol_check.started', {
      routeRunId,
      busId: (run as any).bus_id,
      driverId,
      expiresAt: (session as any).expires_at,
    });

    return this.formatSession(session);
  }

  static async getForRouteRun(routeRunId: number, driverId: number) {
    const meta = alcoholCheckScheduleMeta();
    const session = await AlcoholCheckSession.findOne({
      where: { route_run_id: routeRunId, driver_id: driverId },
      order: [['created_at', 'DESC']],
    });
    if (!session) {
      return { session: null, ...meta };
    }
    const formatted = await this.expireIfNeeded(session);
    return { session: formatted, ...meta };
  }

  static async getActiveForDeviceBus(busId: number) {
    if (!isWithinAlcoholCheckSchedule()) {
      return null;
    }
    await AlcoholCheckSession.update(
      { status: 'expired' },
      {
        where: {
          bus_id: busId,
          status: 'pending',
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );

    const session = await AlcoholCheckSession.findOne({
      where: {
        bus_id: busId,
        status: 'pending',
        expires_at: { [Op.gte]: new Date() },
      },
      order: [['created_at', 'DESC']],
    });

    return session ? this.formatSession(session) : null;
  }

  static async hasPassedRouteCheck(routeRunId: number, driverId: number) {
    const session = await AlcoholCheckSession.findOne({
      where: { route_run_id: routeRunId, driver_id: driverId, status: 'passed' },
      order: [['updated_at', 'DESC']],
    });
    return Boolean(session);
  }

  static async attachDeviceReading(busId: number, driverId: number, alcoholTestId: number, passed: boolean) {
    await AlcoholCheckSession.update(
      { status: 'expired' },
      {
        where: {
          bus_id: busId,
          driver_id: driverId,
          status: 'pending',
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );

    const session = await AlcoholCheckSession.findOne({
      where: {
        bus_id: busId,
        driver_id: driverId,
        status: 'pending',
        expires_at: { [Op.gte]: new Date() },
      },
      order: [['created_at', 'DESC']],
    });

    if (!session) return null;

    await session.update({
      status: passed ? 'passed' : 'failed',
      alcohol_test_id: alcoholTestId,
    });

    publishRealtimeEvent('safety.alcohol_check.completed', {
      routeRunId: (session as any).route_run_id,
      busId,
      driverId,
      status: passed ? 'passed' : 'failed',
      alcoholTestId,
    });

    return this.formatSession(session);
  }

  private static async expireIfNeeded(session: any) {
    if (session.status === 'pending' && session.expires_at < new Date()) {
      await session.update({ status: 'expired' });
    }
    return this.formatSession(session);
  }

  private static formatSession(session: any) {
    const json = session.toJSON ? session.toJSON() : session;
    return {
      id: json.id,
      route_run_id: json.route_run_id,
      driver_id: json.driver_id,
      bus_id: json.bus_id,
      status: json.status,
      expires_at: json.expires_at,
      alcohol_test_id: json.alcohol_test_id ?? null,
      window_seconds: WINDOW_SECONDS,
      ...alcoholCheckScheduleMeta(),
    };
  }
}
