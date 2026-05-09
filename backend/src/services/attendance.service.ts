import { db } from '../../models';
const { Attendance, RFIDCard, Student, Bus, Geofence, Route, RouteAssignment, ParentAbsence } = db;
import type { Bus as BusModel } from '../../models/bus.model';
import { Op } from 'sequelize';
import { findMatchingGeofence, type GeofenceData } from '../utils/geofence';
import { NotificationService } from './notification.service';
import { publishRealtimeEvent } from '../realtime/realtime.events';

export interface AttendanceScanInput {
	rfid_tag: string;
	timestamp?: string | Date;
	latitude: number;
	longitude: number;
	vehicle_id?: string;
	bus_id?: number;
	event_id?: string | null;
}

export interface AttendanceScanResult {
	success: boolean;
	attendanceType: 'boarding' | 'exiting';
	studentId: number;
	studentName: string;
	geofenceId?: number;
	geofenceName?: string;
	message: string;
}

export interface BufferedAttendanceRecord {
	event_id: string | null;
	input: Partial<AttendanceScanInput> & { rfid_tag?: string };
}

export interface ManualAttendanceInput {
	studentId: number;
	busId: number;
	type?: 'boarding' | 'exiting';
	timestamp?: string | Date;
	latitude?: number;
	longitude?: number;
	driverId: number;
}

export interface ParentAbsenceInput {
	studentId: number;
	parentId: number;
	absenceDate: string;
	reason?: string;
}

export class AttendanceService {
	static async resolveAllowedBusIdsForUser(userId: number, role: string): Promise<number[] | null> {
		if (role === 'admin') return null;
		if (role !== 'driver') return [];
		const buses = await Bus.findAll({
			where: { driver_id: userId },
			attributes: ['id'],
		});
		return buses.map((b) => Number(b.id));
	}

	/**
	 * Process RFID scan and create attendance record
	 */
	static async processScan(input: AttendanceScanInput): Promise<AttendanceScanResult> {
		// 1. Validate and find RFID card
		const rfidCard = await RFIDCard.findOne({
			where: { rfid_tag: input.rfid_tag, active: true },
			include: [
				{
					model: Student,
					include: [
						{
							model: db.User,
							as: 'parent',
						},
					],
				},
			],
		});

		if (!rfidCard) {
			throw {
				status: 404,
				code: 'RFID_NOT_FOUND',
				message: 'RFID card not found or inactive.',
			};
		}

		const student = rfidCard.student;
		if (!student) {
			throw {
				status: 404,
				code: 'STUDENT_NOT_FOUND',
				message: 'Student associated with RFID card not found.',
			};
		}

		// 2. Find bus by vehicle_id or bus_id
		let bus: BusModel | null = null;
		if (input.bus_id) {
			bus = await Bus.findByPk(input.bus_id);
		} else if (input.vehicle_id) {
			bus = await Bus.findOne({ where: { bus_number: input.vehicle_id } });
		}

		if (!bus) {
			throw {
				status: 404,
				code: 'BUS_NOT_FOUND',
				message: 'Bus not found.',
			};
		}

		// 3. Get relevant geofences for this bus
		const geofences = await Geofence.findAll({
			where: {
				bus_id: bus.id,
			},
		});

		// Get school geofence only by bus's school (no legacy bus_id lookup)
		const schoolGeofence = (bus as any).school_id
			? await Geofence.findOne({
					where: { type: 'school', school_id: (bus as any).school_id },
			  })
			: null;

		// Get student's home geofence
		const homeGeofence = await Geofence.findOne({
			where: {
				type: 'home',
				student_id: student.id,
				bus_id: bus.id,
			},
		});

		// Combine all relevant geofences
		const allGeofences: GeofenceData[] = [];
		if (schoolGeofence) {
			allGeofences.push({
				id: schoolGeofence.id,
				type: schoolGeofence.type,
				latitude: Number(schoolGeofence.latitude),
				longitude: Number(schoolGeofence.longitude),
				radius_meters: schoolGeofence.radius_meters || 50,
				bus_id: schoolGeofence.bus_id || undefined,
			});
		}
		if (homeGeofence) {
			allGeofences.push({
				id: homeGeofence.id,
				type: homeGeofence.type,
				latitude: Number(homeGeofence.latitude),
				longitude: Number(homeGeofence.longitude),
				radius_meters: homeGeofence.radius_meters || 50,
				student_id: homeGeofence.student_id || undefined,
				bus_id: homeGeofence.bus_id || undefined,
			});
		}

		// 4. Determine attendance type using geofencing
		let attendanceType: 'boarding' | 'exiting' = 'boarding';
		let matchedGeofence: GeofenceData | null = null;

		if (allGeofences.length > 0) {
			matchedGeofence = findMatchingGeofence(
				input.latitude,
				input.longitude,
				allGeofences
			);

			if (matchedGeofence) {
				// If within school geofence, student is exiting
				// If within home geofence, student is boarding
				attendanceType = matchedGeofence.type === 'school' ? 'exiting' : 'boarding';
			} else {
				// If not in any geofence, use time-based heuristics
				// Morning scans are typically boarding, afternoon are exiting
				const hour = new Date(input.timestamp || Date.now()).getHours();
				attendanceType = hour < 12 ? 'boarding' : 'exiting';
			}
		} else {
			// No geofences configured, use time-based heuristics
			const hour = new Date(input.timestamp || Date.now()).getHours();
			attendanceType = hour < 12 ? 'boarding' : 'exiting';
		}

		// 5. Create attendance record
		const attendance = await Attendance.create({
			student_id: student.id,
			bus_id: bus.id,
			rfid_card_id: rfidCard.id,
			type: attendanceType,
			timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
			latitude: input.latitude,
			longitude: input.longitude,
			geofence_id: matchedGeofence?.id,
			manual_override: false,
			event_id: input.event_id ?? null,
		});

		// 6. Send notification to parent
		// Reload student with parent to ensure we have the relationship
		const studentWithParent = await Student.findByPk(student.id, {
			include: [{ model: db.User, as: 'parent' }],
		});

		if (studentWithParent && (studentWithParent as any).parent) {
			const parent = (studentWithParent as any).parent;
			const locationName = matchedGeofence
				? matchedGeofence.type === 'school'
					? 'School'
					: 'Home'
				: undefined;

			await NotificationService.sendAttendanceNotification(
				parent.id,
				student.full_name,
				attendanceType,
				locationName
			);
		}

		// 7. Return result
		const result = {
			success: true,
			attendanceType,
			studentId: student.id,
			studentName: student.full_name,
			geofenceId: matchedGeofence?.id,
			geofenceName: matchedGeofence
				? matchedGeofence.type === 'school'
					? 'School'
					: 'Home'
				: undefined,
			message: `Attendance recorded: ${student.full_name} ${attendanceType === 'boarding' ? 'boarded' : 'exited'} the bus`,
		};
		publishRealtimeEvent('attendance.scan', {
			busId: bus.id,
			studentId: student.id,
			studentName: student.full_name,
			type: attendanceType,
			timestamp: new Date(input.timestamp || Date.now()).toISOString(),
		});
		return result;
	}

	/**
	 * Process a batch of buffered attendance records
	 * Used for offline sync from microcontrollers
	 */
	static async syncBufferedRecords(records: BufferedAttendanceRecord[]) {
		const results: Array<{
			event_id: string | null;
			status: 'stored' | 'duplicate' | 'failed' | 'invalid';
			code?: string;
			message?: string;
		}> = [];

		for (const record of records) {
			const { event_id, input } = record;

			// Validate presence of required fields
			if (
				!input ||
				!input.rfid_tag ||
				input.latitude === undefined ||
				input.longitude === undefined ||
				(!input.vehicle_id && !input.bus_id)
			) {
				results.push({
					event_id,
					status: 'invalid',
					code: 'MISSING_FIELDS',
					message:
						'rfid_tag, latitude, longitude and either vehicle_id or bus_id are required.',
				});
				continue;
			}

			// Persistent duplicate detection (idempotency): if event_id is provided, dedupe.
			if (event_id) {
				const existing = await Attendance.findOne({ where: { event_id } });
				if (existing) {
					results.push({ event_id, status: 'duplicate' });
					continue;
				}
			}

			try {
				const scanInput: AttendanceScanInput = {
					rfid_tag: input.rfid_tag,
					timestamp: input.timestamp,
					latitude: Number(input.latitude),
					longitude: Number(input.longitude),
					vehicle_id: input.vehicle_id,
					bus_id: input.bus_id,
					event_id,
				};

				await this.processScan(scanInput);

				results.push({
					event_id,
					status: 'stored',
				});
			} catch (error: any) {
				// Unique index on event_id can race under concurrency; treat as duplicate.
				if (
					event_id &&
					(error?.name === 'SequelizeUniqueConstraintError' ||
						error?.original?.code === '23505')
				) {
					results.push({ event_id, status: 'duplicate' });
					continue;
				}

				// Map known application errors to failed status with code/message
				if (error && error.code) {
					results.push({
						event_id,
						status: 'failed',
						code: error.code,
						message: error.message,
					});
				} else {
					results.push({
						event_id,
						status: 'failed',
						code: 'INTERNAL_ERROR',
						message: 'Unexpected error while processing record.',
					});
				}
			}
		}

		return {
			total: records.length,
			stored: results.filter((r) => r.status === 'stored').length,
			invalid: results.filter((r) => r.status === 'invalid').length,
			failed: results.filter((r) => r.status === 'failed').length,
			results,
		};
	}

	/**
	 * Create manual attendance record by driver for a student on their bus
	 */
	static async createManualAttendance(
		input: ManualAttendanceInput
	): Promise<AttendanceScanResult> {
		const { studentId, busId, type, timestamp, latitude, longitude, driverId } = input;

		// 1. Ensure bus belongs to this driver
		const bus: BusModel | null = await Bus.findOne({
			where: {
				id: busId,
				driver_id: driverId,
			},
		});

		if (!bus) {
			throw {
				status: 403,
				code: 'FORBIDDEN_BUS',
				message: 'You are not assigned to this bus.',
			};
		}

		// 2. Ensure student exists
		const student = await Student.findByPk(studentId);
		if (!student) {
			throw {
				status: 404,
				code: 'STUDENT_NOT_FOUND',
				message: 'Student not found.',
			};
		}

		// 3. Ensure student is assigned to a route on this bus
		const assignment = await RouteAssignment.findOne({
			where: { student_id: studentId },
		});

		if (!assignment) {
			throw {
				status: 403,
				code: 'STUDENT_NOT_ASSIGNED_TO_ROUTE',
				message: 'Student is not assigned to any route.',
			};
		}

		const route = await Route.findByPk(assignment.route_id);

		if (!route || route.bus_id !== bus.id) {
			throw {
				status: 403,
				code: 'STUDENT_NOT_ON_DRIVER_BUS',
				message: 'Student is not assigned to your bus route.',
			};
		}

		// 4. Determine attendance type and geofence (if coordinates provided)
		let attendanceType: 'boarding' | 'exiting' = type || 'boarding';
		let matchedGeofence: GeofenceData | null = null;

		if (latitude !== undefined && longitude !== undefined) {
			// Get relevant geofences for this bus
			const geofences = await Geofence.findAll({
				where: {
					bus_id: bus.id,
				},
			});

			// Get school geofence only by bus's school (no legacy bus_id lookup)
			const schoolGeofence = (bus as any).school_id
				? await Geofence.findOne({
						where: { type: 'school', school_id: (bus as any).school_id },
				  })
				: null;

			// Get student's home geofence
			const homeGeofence = await Geofence.findOne({
				where: {
					type: 'home',
					student_id: student.id,
					bus_id: bus.id,
				},
			});

			const allGeofences: GeofenceData[] = [];
			if (schoolGeofence) {
				allGeofences.push({
					id: schoolGeofence.id,
					type: schoolGeofence.type,
					latitude: Number(schoolGeofence.latitude),
					longitude: Number(schoolGeofence.longitude),
					radius_meters: schoolGeofence.radius_meters || 50,
					bus_id: schoolGeofence.bus_id || undefined,
				});
			}
			if (homeGeofence) {
				allGeofences.push({
					id: homeGeofence.id,
					type: homeGeofence.type,
					latitude: Number(homeGeofence.latitude),
					longitude: Number(homeGeofence.longitude),
					radius_meters: homeGeofence.radius_meters || 50,
					student_id: homeGeofence.student_id || undefined,
					bus_id: homeGeofence.bus_id || undefined,
				});
			}

			if (allGeofences.length > 0) {
				matchedGeofence = findMatchingGeofence(
					latitude,
					longitude,
					allGeofences
				);

				if (!type) {
					if (matchedGeofence) {
						attendanceType =
							matchedGeofence.type === 'school' ? 'exiting' : 'boarding';
					} else {
						const hour = new Date(timestamp || Date.now()).getHours();
						attendanceType = hour < 12 ? 'boarding' : 'exiting';
					}
				}
			} else if (!type) {
				const hour = new Date(timestamp || Date.now()).getHours();
				attendanceType = hour < 12 ? 'boarding' : 'exiting';
			}
		} else if (!type) {
			// No coordinates and no explicit type: fall back to time-based heuristic
			const hour = new Date(timestamp || Date.now()).getHours();
			attendanceType = hour < 12 ? 'boarding' : 'exiting';
		}

		// 5. Create attendance record with manual_override = true
		const attendance = await Attendance.create({
			student_id: student.id,
			bus_id: bus.id,
			rfid_card_id: null,
			type: attendanceType,
			timestamp: timestamp ? new Date(timestamp) : new Date(),
			latitude: latitude !== undefined ? latitude : null,
			longitude: longitude !== undefined ? longitude : null,
			geofence_id: matchedGeofence?.id,
			manual_override: true,
		});

		// 6. Send notification to parent (same behavior as RFID scans)
		const studentWithParent = await Student.findByPk(student.id, {
			include: [{ model: db.User, as: 'parent' }],
		});

		if (studentWithParent && (studentWithParent as any).parent) {
			const parent = (studentWithParent as any).parent;
			const locationName = matchedGeofence
				? matchedGeofence.type === 'school'
					? 'School'
					: 'Home'
				: undefined;

			await NotificationService.sendAttendanceNotification(
				parent.id,
				student.full_name,
				attendanceType,
				locationName
			);
		}

		const result = {
			success: true,
			attendanceType,
			studentId: student.id,
			studentName: student.full_name,
			geofenceId: matchedGeofence?.id,
			geofenceName: matchedGeofence
				? matchedGeofence.type === 'school'
					? 'School'
					: 'Home'
				: undefined,
			message: `Manual attendance recorded: ${student.full_name} ${attendanceType === 'boarding' ? 'boarded' : 'exited'} the bus`,
		};
		publishRealtimeEvent('attendance.manual', {
			busId: bus.id,
			studentId: student.id,
			studentName: student.full_name,
			type: attendanceType,
			timestamp: new Date(timestamp || Date.now()).toISOString(),
		});
		return result;
	}

	/**
	 * Get attendance history for a student
	 */
	static async getStudentAttendance(
		studentId: number,
		startDate?: Date,
		endDate?: Date,
		allowedBusIds?: number[] | null
	) {
		const where: any = { student_id: studentId };
		if (Array.isArray(allowedBusIds)) {
			where.bus_id = { [Op.in]: allowedBusIds.length > 0 ? allowedBusIds : [-1] };
		}
		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) where.timestamp[Op.gte] = startDate;
			if (endDate) where.timestamp[Op.lte] = endDate;
		}

		return await Attendance.findAll({
			where,
			include: [
				{ model: Bus, attributes: ['id', 'bus_number'] },
				{ model: Geofence, attributes: ['id', 'name', 'type'] },
			],
			order: [['timestamp', 'DESC']],
		});
	}

	/**
	 * Get current onboard students for a bus
	 */
	static async getBusAttendance(busId: number, date?: Date) {
		const targetDate = date || new Date();
		const startOfDay = new Date(targetDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(targetDate);
		endOfDay.setHours(23, 59, 59, 999);

		// Verify bus exists
		const bus = await Bus.findByPk(busId);
		if (!bus) {
			throw {
				status: 404,
				code: 'BUS_NOT_FOUND',
				message: 'Bus not found.',
			};
		}

		// Get all attendance records for the target date
		const attendances = await Attendance.findAll({
			where: {
				bus_id: busId,
				timestamp: {
					[Op.between]: [startOfDay, endOfDay],
				},
			},
			include: [
				{ model: Student, attributes: ['id', 'full_name', 'grade'] },
			],
			order: [['timestamp', 'DESC']],
		});

		// Calculate onboard students (boarding - exiting)
		const onboardMap = new Map<number, number>();
		attendances.forEach((attendance) => {
			const studentId = attendance.student_id;
			const current = onboardMap.get(studentId) || 0;
			if (attendance.type === 'boarding') {
				onboardMap.set(studentId, current + 1);
			} else {
				onboardMap.set(studentId, Math.max(0, current - 1));
			}
		});

		// Get onboard student IDs
		const onboardStudentIds: number[] = [];
		onboardMap.forEach((count, studentId) => {
			if (count > 0) {
				onboardStudentIds.push(studentId);
			}
		});

		// Get detailed information for onboard students
		const onboardStudents = await Student.findAll({
			where: {
				id: {
					[Op.in]: onboardStudentIds,
				},
			},
			attributes: ['id', 'full_name', 'grade'],
			order: [['full_name', 'ASC']],
		});

		// Get total students assigned to this bus (via routes)
		const routes = await Route.findAll({
			where: { bus_id: busId },
		});

		const routeIds = routes.map(route => route.id);
		const totalAssignedStudents = routeIds.length > 0 
			? await RouteAssignment.count({
				where: {
					route_id: {
						[Op.in]: routeIds,
					},
				},
				distinct: true,
				col: 'student_id',
			})
			: 0;

		const expectedStudents = routeIds.length > 0
			? await Student.findAll({
				where: {
					id: {
						[Op.in]: await RouteAssignment.findAll({
							where: { route_id: { [Op.in]: routeIds } },
							attributes: ['student_id'],
							raw: true,
						}).then((rows: any[]) => rows.map((x) => Number(x.student_id))),
					},
				},
				attributes: ['id', 'full_name', 'grade'],
				order: [['full_name', 'ASC']],
			})
			: [];
		const onboardSet = new Set(onboardStudentIds);
		const absenceDate = targetDate.toISOString().split('T')[0];
		const absences = await ParentAbsence.findAll({
			where: {
				absence_date: absenceDate,
				student_id: { [Op.in]: expectedStudents.map((s) => s.id) },
			},
			attributes: ['student_id'],
			raw: true,
		});
		const absentSet = new Set(absences.map((x: any) => Number(x.student_id)));
		const startRef = routes[0]?.start_time ? new Date(routes[0].start_time as any) : new Date(targetDate);
		const assignmentRows = routeIds.length > 0
			? await RouteAssignment.findAll({
				where: { route_id: { [Op.in]: routeIds } },
				attributes: ['student_id', 'pickup_order'],
				raw: true,
			})
			: [];
		const assignmentMap = new Map<number, number>();
		assignmentRows.forEach((r: any) => assignmentMap.set(Number(r.student_id), Number(r.pickup_order ?? 0)));
		const now = new Date();
		const missedPickups = expectedStudents.filter((s) => {
			if (onboardSet.has(s.id) || absentSet.has(s.id)) return false;
			const pickupOrder = assignmentMap.get(s.id) ?? 0;
			const stopDeadline = new Date(startRef.getTime() + (pickupOrder * 7 + 10) * 60 * 1000);
			return now.getTime() > stopDeadline.getTime();
		});

		const response = {
			bus: {
				id: bus.id,
				bus_number: bus.bus_number,
			},
			date: targetDate.toISOString().split('T')[0],
			statistics: {
				totalAssignedStudents,
				currentOnboardCount: onboardStudents.length,
				missedPickupCount: missedPickups.length,
				reportedAbsentCount: absentSet.size,
			},
			expectedStudents: expectedStudents.map((student) => ({
				id: student.id,
				full_name: student.full_name,
				grade: student.grade,
				boarded: onboardSet.has(student.id),
				absent: absentSet.has(student.id),
			})),
			onboardStudents: onboardStudents.map(student => ({
				id: student.id,
				full_name: student.full_name,
				grade: student.grade,
			})),
			attendances: attendances.map(attendance => ({
				id: attendance.id,
				student_id: attendance.student_id,
				type: attendance.type,
				timestamp: attendance.timestamp,
				latitude: attendance.latitude,
				longitude: attendance.longitude,
				manual_override: attendance.manual_override,
				student: attendance.student ? {
					id: attendance.student.id,
					full_name: attendance.student.full_name,
					grade: attendance.student.grade,
				} : null,
			})),
		};
		if (missedPickups.length > 0) {
			publishRealtimeEvent('attendance.missed_pickup', {
				busId: bus.id,
				missedPickupCount: missedPickups.length,
			});
		}
		return response;
	}

	/**
	 * Get all attendance records with filters
	 */
	static async getAllAttendance(filters: {
		studentId?: number;
		busId?: number;
		startDate?: Date;
		endDate?: Date;
		type?: 'boarding' | 'exiting';
		limit?: number;
		offset?: number;
		allowedBusIds?: number[] | null;
	}) {
		const where: any = {};

		if (filters.studentId) {
			where.student_id = filters.studentId;
		}

		if (filters.busId) {
			where.bus_id = filters.busId;
		}
		if (Array.isArray(filters.allowedBusIds)) {
			where.bus_id = where.bus_id
				? where.bus_id
				: {
					[Op.in]: filters.allowedBusIds.length > 0 ? filters.allowedBusIds : [-1],
				};
		}

		if (filters.type) {
			where.type = filters.type;
		}

		if (filters.startDate || filters.endDate) {
			where.timestamp = {};
			if (filters.startDate) where.timestamp[Op.gte] = filters.startDate;
			if (filters.endDate) where.timestamp[Op.lte] = filters.endDate;
		}

		const { count, rows } = await Attendance.findAndCountAll({
			where,
			include: [
				{
					model: Student,
					attributes: ['id', 'full_name', 'grade'],
				},
				{
					model: Bus,
					attributes: ['id', 'bus_number'],
				},
				{
					model: Geofence,
					attributes: ['id', 'name', 'type'],
				},
			],
			order: [['timestamp', 'DESC']],
			limit: filters.limit || 50,
			offset: filters.offset || 0,
		});

		return {
			total: count,
			attendances: rows,
		};
	}

	static async reportParentAbsence(input: ParentAbsenceInput) {
		const student = await Student.findByPk(input.studentId);
		if (!student) {
			throw { status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
		}
		if (Number(student.parent_id) !== Number(input.parentId)) {
			throw { status: 403, code: 'FORBIDDEN_PARENT', message: 'Student is not assigned to this parent.' };
		}

		const [absence] = await ParentAbsence.findOrCreate({
			where: { student_id: input.studentId, absence_date: input.absenceDate },
			defaults: {
				student_id: input.studentId,
				parent_id: input.parentId,
				absence_date: input.absenceDate,
				reason: input.reason ?? null,
				status: 'reported',
			},
		});

		const assignments = await RouteAssignment.findAll({
			where: { student_id: input.studentId },
			attributes: ['route_id'],
			raw: true,
		});
		const routeIds = assignments.map((a: any) => Number(a.route_id));
		const routes = routeIds.length > 0
			? await Route.findAll({ where: { id: { [Op.in]: routeIds } }, attributes: ['id', 'bus_id'] })
			: [];
		const busIds = Array.from(new Set(routes.map((r: any) => Number(r.bus_id))));
		const buses = busIds.length > 0
			? await Bus.findAll({ where: { id: { [Op.in]: busIds } }, attributes: ['id', 'driver_id', 'bus_number'] })
			: [];
		for (const bus of buses as any[]) {
			if (!bus.driver_id) continue;
			await NotificationService.sendNotification({
				userId: Number(bus.driver_id),
				type: 'parent_absence',
				message: `${student.full_name} was reported absent for ${input.absenceDate}.`,
				data: {
					studentId: student.id,
					studentName: student.full_name,
					busId: bus.id,
					busNumber: bus.bus_number,
					absenceDate: input.absenceDate,
					reason: input.reason ?? null,
				},
			});
		}
		publishRealtimeEvent('notification.created', {
			type: 'parent_absence',
			studentId: student.id,
			absenceDate: input.absenceDate,
		});
		return absence;
	}

	static async getDriverAbsences(driverId: number, date?: string) {
		const targetDate = date || new Date().toISOString().split('T')[0];
		const buses = await Bus.findAll({ where: { driver_id: driverId }, attributes: ['id'] });
		const busIds = buses.map((b: any) => Number(b.id));
		if (busIds.length === 0) return [];
		const routes = await Route.findAll({ where: { bus_id: { [Op.in]: busIds } }, attributes: ['id', 'bus_id'] });
		const routeToBus = new Map<number, number>();
		routes.forEach((r: any) => routeToBus.set(Number(r.id), Number(r.bus_id)));
		const routeIds = Array.from(routeToBus.keys());
		if (routeIds.length === 0) return [];
		const assignments = await RouteAssignment.findAll({
			where: { route_id: { [Op.in]: routeIds } },
			attributes: ['student_id', 'route_id'],
			raw: true,
		});
		const studentToBus = new Map<number, number>();
		assignments.forEach((a: any) => studentToBus.set(Number(a.student_id), Number(routeToBus.get(Number(a.route_id)))));
		const studentIds = Array.from(studentToBus.keys());
		if (studentIds.length === 0) return [];
		const absences = await ParentAbsence.findAll({
			where: { absence_date: targetDate, student_id: { [Op.in]: studentIds } },
			include: [{ model: Student, attributes: ['id', 'full_name', 'grade'] }],
			order: [['created_at', 'DESC']],
		});
		return absences.map((a: any) => ({
			id: a.id,
			student_id: a.student_id,
			student_name: a.student?.full_name ?? null,
			grade: a.student?.grade ?? null,
			bus_id: studentToBus.get(Number(a.student_id)) ?? null,
			absence_date: a.absence_date,
			reason: a.reason,
			status: a.status,
		}));
	}
}

