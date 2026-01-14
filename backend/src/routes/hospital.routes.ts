import { Router } from 'express';
import { getAllHospitals, getNearestAmbulance } from '../controllers/hospital.controller';

const router = Router();

router.get('/', getAllHospitals);
router.get('/:id/nearest-ambulance', getNearestAmbulance);

export default router;

