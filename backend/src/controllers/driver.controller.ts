import { Request, Response } from 'express';

import { DriverJobStatus, DriverService } from '../services/driver.service';

export const getDriverJobs = async (req: Request, res: Response) => {
  try {
    const data = await DriverService.getJobsForDriver(
      req.user?.id,
      req.user?.role,
      req.query.status,
      req.query.driver_id
    );
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Get driver jobs error:', error);
    if (error.status && error.code) {
      return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    }
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching driver jobs.',
    });
  }
};

export const getDriverJobById = async (req: Request, res: Response) => {
  try {
    const data = await DriverService.getJobForDriver(
      req.user?.id,
      req.user?.role,
      req.params.jobId,
      req.query.driver_id
    );
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Get driver job by id error:', error);
    if (error.status && error.code) {
      return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    }
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching the job.',
    });
  }
};

export const updateDriverJobStatus = async (
  req: Request,
  res: Response,
  targetStatus: DriverJobStatus
) => {
  try {
    const data = await DriverService.transitionJobStatus(
      req.user?.id,
      req.user?.role,
      req.params.jobId,
      targetStatus,
      req.body?.reason,
      req.body?.driver_id
    );
    return res.status(200).json({
      success: true,
      data,
      message: `Job moved to ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error('Update driver job status error:', error);
    if (error.status && error.code) {
      return res.status(error.status).json({ success: false, code: error.code, message: error.message });
    }
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while updating job status.',
    });
  }
};
