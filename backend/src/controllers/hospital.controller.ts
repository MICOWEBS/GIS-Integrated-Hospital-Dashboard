import { Request, Response } from 'express';
import { HospitalService } from '../services/hospital.service';
import { SpatialService } from '../services/spatial.service';

const hospitalService = new HospitalService();
const spatialService = new SpatialService();

export const getAllHospitals = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

export const getNearestAmbulance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await spatialService.findNearestAmbulanceToHospital(id);

    if (!result) {
      res.status(404).json({
        error: 'No available ambulance found or hospital not found',
      });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error finding nearest ambulance:', error);
    res.status(500).json({ error: 'Failed to find nearest ambulance' });
  }
};

