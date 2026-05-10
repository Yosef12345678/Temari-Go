import { Request, Response } from 'express';
import { RouteRunAssignmentService } from '../services/routeRunAssignment.service';

/**
 * Assign student to a route run.
 * POST /api/route-run-assignments
 * Admin only
 */
export const createRouteRunAssignment = async (req: Request, res: Response) => {
  try {
    const { route_run_id, student_id, pickup_latitude, pickup_longitude, pickup_order } = req.body;

    const assignment = await RouteRunAssignmentService.createAssignment({
      route_run_id,
      student_id,
      pickup_latitude,
      pickup_longitude,
      pickup_order,
    });

    return res.status(201).json({
      success: true,
      data: assignment,
      message: 'Student assigned to route run successfully.',
    });
  } catch (error: any) {
    console.error('Create route run assignment error:', error);

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
      message: 'An error occurred while assigning the student to the route run.',
    });
  }
};

/**
 * Get all students assigned to a route run.
 * GET /api/route-run-assignments/run/:routeRunId
 * Admin only
 */
export const getAssignmentsByRunId = async (req: Request, res: Response) => {
  try {
    const { routeRunId } = req.params;

    const assignments = await RouteRunAssignmentService.getAssignmentsByRunId(Number(routeRunId));

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.error('Get route run assignments error:', error);

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
      message: 'An error occurred while fetching route run assignments.',
    });
  }
};

/**
 * Update assignment pickup info.
 * PUT /api/route-run-assignments/:id
 * Admin only
 */
export const updateRouteRunAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pickup_latitude, pickup_longitude, pickup_order } = req.body;

    const assignment = await RouteRunAssignmentService.updateAssignment(Number(id), {
      pickup_latitude,
      pickup_longitude,
      pickup_order,
    });

    return res.status(200).json({
      success: true,
      data: assignment,
      message: 'Route run assignment updated successfully.',
    });
  } catch (error: any) {
    console.error('Update route run assignment error:', error);

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
      message: 'An error occurred while updating the route run assignment.',
    });
  }
};

/**
 * Remove student from route run.
 * DELETE /api/route-run-assignments/:id
 * Admin only
 */
export const deleteRouteRunAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await RouteRunAssignmentService.deleteAssignment(Number(id));

    return res.status(200).json({
      success: true,
      message: 'Student removed from route run successfully.',
    });
  } catch (error: any) {
    console.error('Delete route run assignment error:', error);

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
      message: 'An error occurred while removing the student from the route run.',
    });
  }
};
