import { EventEmitter } from 'events';

export type RealtimeEvent =
  | 'driver.job.updated'
  | 'attendance.scan'
  | 'attendance.manual'
  | 'attendance.missed_pickup'
  | 'location.updated'
  | 'location.speed_violation'
  | 'safety.alcohol_test'
  | 'safety.alcohol_check.started'
  | 'safety.alcohol_check.completed'
  | 'safety.motion_alert'
  | 'safety.sos'
  | 'notification.created';

export type RealtimeEnvelope = {
  event: RealtimeEvent;
  ts: string;
  payload: Record<string, unknown>;
};

const emitter = new EventEmitter();
emitter.setMaxListeners(1000);

export function publishRealtimeEvent(event: RealtimeEvent, payload: Record<string, unknown>): void {
  emitter.emit(
    'event',
    {
      event,
      ts: new Date().toISOString(),
      payload,
    } satisfies RealtimeEnvelope
  );
}

export function subscribeRealtimeEvents(handler: (event: RealtimeEnvelope) => void): () => void {
  emitter.on('event', handler);
  return () => emitter.off('event', handler);
}
