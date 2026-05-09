import { db } from '../../models';

import { NotificationService } from './notification.service';
import { publishRealtimeEvent } from '../realtime/realtime.events';

const { User, Role, Bus } = db;

type TriggerSOSInput = {
  driverId: number;
  role: string;
  latitude?: number;
  longitude?: number;
  reason?: string;
};

export class SOSService {
  static async trigger(input: TriggerSOSInput) {
    if (input.role !== 'driver' && input.role !== 'admin') {
      throw { status: 403, code: 'FORBIDDEN', message: 'Only drivers can send SOS alerts.' };
    }

    const bus = await Bus.findOne({
      where: { driver_id: input.driverId },
      attributes: ['id', 'bus_number'],
    });

    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const admins = adminRole
      ? await User.findAll({ where: { role_id: adminRole.id }, attributes: ['id'] })
      : [];

    const message = `SOS: Driver ${input.driverId} reported an emergency${bus ? ` on bus ${bus.bus_number}` : ''}.`;
    for (const admin of admins) {
      await NotificationService.sendNotification({
        userId: admin.id,
        type: 'sos_alert',
        message,
        data: {
          driverId: input.driverId,
          busId: bus?.id ?? null,
          busNumber: bus?.bus_number ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          reason: input.reason ?? null,
          timestamp: new Date().toISOString(),
          urgent: true,
        },
      });
    }

    const payload = {
      driverId: input.driverId,
      busId: bus?.id ?? null,
      busNumber: bus?.bus_number ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      reason: input.reason ?? null,
    };
    publishRealtimeEvent('safety.sos', payload);

    return payload;
  }
}
