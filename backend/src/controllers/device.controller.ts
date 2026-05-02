import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';

export const listDevices = async (req: Request, res: Response) => {
	try {
		const { active, busId, page, pageSize } = req.query;

		const parsedActive =
			active === undefined
				? undefined
				: String(active).toLowerCase() === 'true'
					? true
					: String(active).toLowerCase() === 'false'
						? false
						: undefined;

		const result = await DeviceService.listDevices({
			active: parsedActive,
			busId: busId !== undefined ? Number(busId) : undefined,
			page: page !== undefined ? Number(page) : undefined,
			pageSize: pageSize !== undefined ? Number(pageSize) : undefined,
		});

		return res.status(200).json({ success: true, data: result });
	} catch (error: any) {
		console.error('List devices error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while listing devices.' });
	}
};

export const getDevice = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const device = await DeviceService.getDevice(Number(id));
		return res.status(200).json({ success: true, data: device });
	} catch (error: any) {
		console.error('Get device error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while fetching device.' });
	}
};

export const createDevice = async (req: Request, res: Response) => {
	try {
		const { name, bus_id } = req.body;
		const result = await DeviceService.createDevice({
			name,
			bus_id: bus_id === undefined ? undefined : bus_id === null ? null : Number(bus_id),
		});

		return res.status(201).json({
			success: true,
			data: result.device,
			rawKey: result.rawKey,
			message: 'Device created. Store the rawKey securely; it will not be shown again.',
		});
	} catch (error: any) {
		console.error('Create device error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while creating device.' });
	}
};

export const rotateDeviceKey = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const result = await DeviceService.rotateDeviceKey(Number(id));
		return res.status(200).json({
			success: true,
			data: result.device,
			rawKey: result.rawKey,
			message: 'Device key rotated. Store the new rawKey securely; it will not be shown again.',
		});
	} catch (error: any) {
		console.error('Rotate device key error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while rotating device key.' });
	}
};

export const setDeviceActive = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { active } = req.body;
		if (active === undefined) {
			return res.status(400).json({ success: false, code: 'MISSING_ACTIVE', message: 'active is required.' });
		}
		const updated = await DeviceService.setDeviceActive(Number(id), Boolean(active));
		return res.status(200).json({ success: true, data: updated });
	} catch (error: any) {
		console.error('Set device active error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while updating device.' });
	}
};

export const setDeviceBus = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { bus_id } = req.body;
		if (bus_id === undefined) {
			return res.status(400).json({ success: false, code: 'MISSING_BUS_ID', message: 'bus_id is required (number or null).' });
		}

		const updated = await DeviceService.setDeviceBus(Number(id), bus_id === null ? null : Number(bus_id));
		return res.status(200).json({ success: true, data: updated });
	} catch (error: any) {
		console.error('Set device bus error:', error);
		if (error.status && error.code) {
			return res.status(error.status).json({ success: false, code: error.code, message: error.message });
		}
		return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'An error occurred while updating device bus binding.' });
	}
};

