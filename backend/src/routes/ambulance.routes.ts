import { Router } from 'express';
import { getAllAmbulances, moveAmbulance, updateAmbulanceStatus } from '../controllers/ambulance.controller';

const router = Router();

router.get('/', getAllAmbulances);
router.post('/:id/move', moveAmbulance);
router.patch('/:id/status', updateAmbulanceStatus);

export default router;

