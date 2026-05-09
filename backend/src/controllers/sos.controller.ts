import type { Request, Response } from 'express';

import { SOSService } from '../services/sos.service';

export const triggerSOS = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Access denied.' });
    }

    const result = await SOSService.trigger({
      driverId: Number(req.user.id),
      role: req.user.role,
      latitude: req.body?.latitude !== undefined ? Number(req.body.latitude) : undefined,
      longitude: req.body?.longitude !== undefined ? Number(req.body.longitude) : undefined,
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    });

    return res.status(201).json({ success: true, data: result, message: 'Emergency alert sent.' });
  } catch (error: any) {
    if (error?.status && error?.code) {
      return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    }
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Unable to trigger SOS alert.',
    });
  }
};
