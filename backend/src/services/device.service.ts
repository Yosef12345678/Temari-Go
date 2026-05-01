import crypto from 'crypto';
import { db } from '../../models';

const { Device, Bus } = db;

function sha256Hex(input: string): string {
	return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function generateRawDeviceKey(): string {
	// 32 random bytes -> 64 hex chars. Easy to copy/paste and send as header.
	return crypto.randomBytes(32).toString('hex');
}

export interface CreateDeviceInput {
	name: string;
	bus_id?: number | null;
}

export interface ListDevicesOptions {
	active?: boolean;
	busId?: number;
	page?: number;
	pageSize?: number;
}

export class DeviceService {
	static async listDevices(options: ListDevicesOptions = {}) {
		const { active, busId, page = 1, pageSize = 50 } = options;

		const where: any = {};
		if (active !== undefined) where.active = active;
		if (busId !== undefined) where.bus_id = Number(busId);

		const limit = Math.max(1, Math.min(pageSize, 200));
		const offset = Math.max(0, (Math.max(page, 1) - 1) * limit);

		const { rows, count } = await Device.findAndCountAll({
			where,
			limit,
			offset,
			attributes: ['id', 'name', 'active', 'bus_id', 'created_at', 'updated_at'],
			order: [['id', 'ASC']],
		});

		return {
			items: rows.map((d: any) => d.toJSON()),
			total: count,
			page: Math.max(page, 1),
			pageSize: limit,
			totalPages: Math.max(1, Math.ceil(count / limit)),
		};
	}

	static async getDevice(id: number) {
		const device = await Device.findByPk(id, {
			attributes: ['id', 'name', 'active', 'bus_id', 'created_at', 'updated_at'],
		});
		if (!device) {
			throw { status: 404, code: 'DEVICE_NOT_FOUND', message: 'Device not found.' };
		}
		return device.toJSON();
	}

	static async createDevice(input: CreateDeviceInput) {
		const name = typeof input.name === 'string' ? input.name.trim() : '';
		if (!name) {
			throw { status: 400, code: 'MISSING_NAME', message: 'name is required.' };
		}

		let busId: number | null = null;
		if (input.bus_id !== undefined && input.bus_id !== null && String(input.bus_id).trim() !== '') {
			busId = Number(input.bus_id);
			const bus = await Bus.findByPk(busId);
			if (!bus) {
				throw { status: 400, code: 'BUS_NOT_FOUND', message: 'Bus not found.' };
			}
		}

		// In the extremely unlikely case of a hash collision (unique constraint), retry a few times.
		for (let attempt = 0; attempt < 5; attempt++) {
			const rawKey = generateRawDeviceKey();
			const apiKeyHash = sha256Hex(rawKey);
			try {
				const device = await Device.create({
					name,
					api_key_hash: apiKeyHash,
					active: true,
					bus_id: busId,
				});

				return {
					device: {
						id: device.id,
						name: device.name,
						active: device.active,
						bus_id: (device as any).bus_id ?? null,
						created_at: (device as any).created_at,
						updated_at: (device as any).updated_at,
					},
					rawKey,
				};
			} catch (err: any) {
				const msg = String(err?.message ?? '');
				// Sequelize unique constraint errors vary by dialect; keep it defensive.
				if (msg.toLowerCase().includes('unique') || err?.name === 'SequelizeUniqueConstraintError') {
					continue;
				}
				throw err;
			}
		}

		throw {
			status: 500,
			code: 'DEVICE_KEY_GENERATION_FAILED',
			message: 'Could not generate a unique device key.',
		};
	}

	static async rotateDeviceKey(deviceId: number) {
		const device = await Device.findByPk(deviceId);
		if (!device) {
			throw { status: 404, code: 'DEVICE_NOT_FOUND', message: 'Device not found.' };
		}

		for (let attempt = 0; attempt < 5; attempt++) {
			const rawKey = generateRawDeviceKey();
			const apiKeyHash = sha256Hex(rawKey);
			try {
				(device as any).api_key_hash = apiKeyHash;
				await device.save();
				return {
					device: {
						id: device.id,
						name: device.name,
						active: device.active,
						bus_id: (device as any).bus_id ?? null,
						created_at: (device as any).created_at,
						updated_at: (device as any).updated_at,
					},
					rawKey,
				};
			} catch (err: any) {
				const msg = String(err?.message ?? '');
				if (msg.toLowerCase().includes('unique') || err?.name === 'SequelizeUniqueConstraintError') {
					continue;
				}
				throw err;
			}
		}

		throw {
			status: 500,
			code: 'DEVICE_KEY_ROTATION_FAILED',
			message: 'Could not rotate device key.',
		};
	}

	static async setDeviceActive(deviceId: number, active: boolean) {
		const device = await Device.findByPk(deviceId);
		if (!device) {
			throw { status: 404, code: 'DEVICE_NOT_FOUND', message: 'Device not found.' };
		}
		(device as any).active = Boolean(active);
		await device.save();
		return device.toJSON();
	}

	static async setDeviceBus(deviceId: number, bus_id: number | null) {
		const device = await Device.findByPk(deviceId);
		if (!device) {
			throw { status: 404, code: 'DEVICE_NOT_FOUND', message: 'Device not found.' };
		}

		if (bus_id === null) {
			(device as any).bus_id = null;
			await device.save();
			return device.toJSON();
		}

		const busIdNum = Number(bus_id);
		const bus = await Bus.findByPk(busIdNum);
		if (!bus) {
			throw { status: 400, code: 'BUS_NOT_FOUND', message: 'Bus not found.' };
		}
		(device as any).bus_id = busIdNum;
		await device.save();
		return device.toJSON();
	}
}

