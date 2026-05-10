import { db } from '../../models';

const { RouteRunAssignment, RouteRun, Student } = db;

export interface CreateRouteRunAssignmentInput {
  route_run_id: number;
  student_id: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_order?: number;
}

export interface UpdateRouteRunAssignmentInput {
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_order?: number;
}

export class RouteRunAssignmentService {
  /**
   * Assign a student to a route run.
   */
  static async createAssignment(input: CreateRouteRunAssignmentInput) {
    const routeRunId = Number(input.route_run_id);
    const studentId = Number(input.student_id);
    if (Number.isNaN(routeRunId) || Number.isNaN(studentId)) {
      throw {
        status: 400,
        code: 'INVALID_IDS',
        message: 'route_run_id and student_id are required and must be valid numbers.',
      };
    }

    const run = await RouteRun.findByPk(routeRunId);
    if (!run) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      throw { status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
    }

    const existing = await RouteRunAssignment.findOne({
      where: { route_run_id: routeRunId, student_id: studentId },
    });
    if (existing) {
      throw {
        status: 400,
        code: 'STUDENT_ALREADY_ASSIGNED',
        message: 'Student is already assigned to this route run.',
      };
    }

    const assignment = await RouteRunAssignment.create({
      route_run_id: routeRunId,
      student_id: studentId,
      pickup_latitude:
        input.pickup_latitude != null && !Number.isNaN(Number(input.pickup_latitude))
          ? Number(input.pickup_latitude)
          : undefined,
      pickup_longitude:
        input.pickup_longitude != null && !Number.isNaN(Number(input.pickup_longitude))
          ? Number(input.pickup_longitude)
          : undefined,
      pickup_order:
        input.pickup_order != null && !Number.isNaN(Number(input.pickup_order))
          ? Number(input.pickup_order)
          : undefined,
    });

    const withStudent = await RouteRunAssignment.findByPk(assignment.id, {
      attributes: ['id', 'route_run_id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'grade', 'parent_id'],
          required: false,
        },
      ],
    });

    return withStudent!.toJSON();
  }

  /**
   * Get all students assigned to a route run.
   */
  static async getAssignmentsByRunId(routeRunId: number) {
    const id = Number(routeRunId);
    if (Number.isNaN(id)) {
      throw { status: 400, code: 'INVALID_RUN_ID', message: 'route_run_id must be a valid number.' };
    }

    const run = await RouteRun.findByPk(id);
    if (!run) {
      throw { status: 404, code: 'RUN_NOT_FOUND', message: 'Route run not found.' };
    }

    const assignments = await RouteRunAssignment.findAll({
      where: { route_run_id: id },
      attributes: ['id', 'route_run_id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
      order: [
        ['pickup_order', 'ASC NULLS LAST'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'grade', 'parent_id'],
          required: false,
        },
      ],
    });

    return assignments.map((a: any) => a.toJSON());
  }

  /**
   * Update assignment pickup info.
   */
  static async updateAssignment(id: number, input: UpdateRouteRunAssignmentInput) {
    const assignmentId = Number(id);
    if (Number.isNaN(assignmentId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Assignment id must be a valid number.' };
    }

    const assignment = await RouteRunAssignment.findByPk(assignmentId);
    if (!assignment) {
      throw { status: 404, code: 'ASSIGNMENT_NOT_FOUND', message: 'Route run assignment not found.' };
    }

    const updates: any = {};
    if (input.pickup_latitude !== undefined) {
      updates.pickup_latitude =
        input.pickup_latitude != null && !Number.isNaN(Number(input.pickup_latitude))
          ? Number(input.pickup_latitude)
          : null;
    }
    if (input.pickup_longitude !== undefined) {
      updates.pickup_longitude =
        input.pickup_longitude != null && !Number.isNaN(Number(input.pickup_longitude))
          ? Number(input.pickup_longitude)
          : null;
    }
    if (input.pickup_order !== undefined) {
      updates.pickup_order =
        input.pickup_order != null && !Number.isNaN(Number(input.pickup_order))
          ? Number(input.pickup_order)
          : null;
    }

    await assignment.update(updates);

    const updated = await RouteRunAssignment.findByPk(assignmentId, {
      attributes: ['id', 'route_run_id', 'student_id', 'pickup_latitude', 'pickup_longitude', 'pickup_order'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'grade', 'parent_id'],
          required: false,
        },
      ],
    });

    return updated!.toJSON();
  }

  /**
   * Remove a student from a route run.
   */
  static async deleteAssignment(id: number) {
    const assignmentId = Number(id);
    if (Number.isNaN(assignmentId)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Assignment id must be a valid number.' };
    }

    const assignment = await RouteRunAssignment.findByPk(assignmentId);
    if (!assignment) {
      throw { status: 404, code: 'ASSIGNMENT_NOT_FOUND', message: 'Route run assignment not found.' };
    }

    await assignment.destroy();
    return { deleted: true, id: assignmentId };
  }
}
