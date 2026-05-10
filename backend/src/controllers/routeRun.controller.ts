import { Request, Response } from 'express';
import { RouteRunService } from '../services/routeRun.service';

/**
 * Create a new route run from a route template.
 * POST /api/route-runs
 * Admin only
 */
export const createRouteRun = async (req: Request, res: Response) => {
  try {
    const { route_id, run_date, name, start_time, end_time } = req.body;

    const run = await RouteRunService.createRouteRun({
      route_id,
      run_date,
      name,
      start_time,
      end_time,
    });

    return res.status(201).json({
      success: true,
      data: run,
      message: 'Route run created successfully.',
    });
  } catch (error: any) {
    console.error('Create route run error:', error);

    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while creating the route run.',
    });
  }
};

/**
 * List route runs with optional filters.
 * GET /api/route-runs
 * Admin only
 */
export const getAllRouteRuns = async (req: Request, res: Response) => {
  try {
    const filters: import('../services/routeRun.service').RouteRunFilters = {
      route_id: req.query.route_id ? Number(req.query.route_id) : undefined,
      bus_id: req.query.bus_id ? Number(req.query.bus_id) : undefined,
      run_date: typeof req.query.run_date === 'string' ? req.query.run_date : undefined,
      status: typeof req.query.status === 'string' ? (req.query.status as any) : undefined,
    };

    const runs = await RouteRunService.getAllRouteRuns(filters);

    return res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error: any) {
    console.error('Get route runs error:', error);

    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching route runs.',
    });
  }
};

/**
 * Get a route run by ID.
 * GET /api/route-runs/:id
 * Admin only
 */
export const getRouteRunById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const run = await RouteRunService.getRouteRunById(Number(id));

    return res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error: any) {
    console.error('Get route run error:', error);

    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching the route run.',
    });
  }
};

/**
 * Delete a route run.
 * DELETE /api/route-runs/:id
 * Admin only
 */
export const deleteRouteRun = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await RouteRunService.deleteRouteRun(Number(id));

    return res.status(200).json({
      success: true,
      message: 'Route run deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete route run error:', error);

    if (error.status && error.code) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while deleting the route run.',
    });
  }
};
