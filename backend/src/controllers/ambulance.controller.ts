import { Request, Response } from 'express';
import { AmbulanceService } from '../services/ambulance.service';

const ambulanceService = new AmbulanceService();

export const getAllAmbulances = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const ambulances = await ambulanceService.getAllAmbulances();
    res.json(ambulances);
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    res.status(500).json({ error: 'Failed to fetch ambulances' });
  }
};

export const moveAmbulance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { longitude, latitude } = req.body;

    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      res.status(400).json({
        error: 'Invalid coordinates. Longitude must be -180 to 180, latitude must be -90 to 90',
      });
      return;
    }

    const ambulance = await ambulanceService.updateAmbulanceLocation(
      id,
      longitude,
      latitude
    );

    if (!ambulance) {
      res.status(404).json({ error: 'Ambulance not found' });
      return;
    }

    res.json(ambulance);
  } catch (error) {
    console.error('Error moving ambulance:', error);
    res.status(500).json({ error: 'Failed to move ambulance' });
  }
};

export const updateAmbulanceStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['available', 'busy', 'dispatched'].includes(status)) {
      res.status(400).json({
        error: 'Invalid status. Must be: available, busy, or dispatched',
      });
      return;
    }

    const ambulance = await ambulanceService.updateAmbulanceStatus(id, status);

    if (!ambulance) {
      res.status(404).json({ error: 'Ambulance not found' });
      return;
    }

    res.json(ambulance);
  } catch (error) {
    console.error('Error updating ambulance status:', error);
    res.status(500).json({ error: 'Failed to update ambulance status' });
  }
};

