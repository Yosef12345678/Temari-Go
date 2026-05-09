import type { Request, Response } from 'express';

import { subscribeRealtimeEvents } from '../realtime/realtime.events';

export const streamRealtime = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const userId = req.user?.id ? Number(req.user.id) : null;
  const role = req.user?.role ?? 'unknown';

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ts: new Date().toISOString(), userId, role })}\n\n`);

  const unsubscribe = subscribeRealtimeEvents((event) => {
    const eventUserId = typeof event.payload?.userId === 'number' ? Number(event.payload.userId) : null;
    if (eventUserId !== null && userId !== null && eventUserId !== userId) return;
    res.write(`event: ${event.event}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
};
