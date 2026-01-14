import { Router, Request, Response } from 'express';
import { IncidentService } from '../services/incident.service';
import { IncidentPriority, IncidentStatus } from '../entities/Incident';

const router = Router();
const incidentService = new IncidentService();

// Get all incidents
router.get('/', async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const incidents = await incidentService.getAllIncidents();
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Get incident by ID
router.get('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Create incident
router.post('/', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { address, longitude, latitude, priority, notes } = req.body;

    if (!address || longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: address, longitude, latitude',
      });
    }

    const incident = await incidentService.createIncident(
      address,
      parseFloat(longitude),
      parseFloat(latitude),
      priority || IncidentPriority.MEDIUM,
      notes
    );

    // Emit WebSocket event
    try {
      const { getSocketServer } = await import('../websocket/socket');
      const io = getSocketServer();
      io.emit('incident:created', incident);
    } catch (error) {
      // Socket server might not be initialized, ignore
    }

    res.status(201).json(incident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Auto-dispatch incident
router.post('/:id/dispatch', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const dispatchResult = await incidentService.autoDispatch(req.params.id);

    // Emit WebSocket events
    try {
      const { getSocketServer } = await import('../websocket/socket');
      const io = getSocketServer();
      io.emit('incident:dispatched', dispatchResult);
      io.emit('ambulance:status-updated', dispatchResult.assignedAmbulance);
    } catch (error) {
      // Socket server might not be initialized, ignore
    }

    res.json(dispatchResult);
  } catch (error: any) {
    console.error('Error dispatching incident:', error);
    res.status(500).json({
      error: error.message || 'Failed to dispatch incident',
    });
  }
});

// Update incident status
router.patch('/:id/status', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { status } = req.body;
    if (!status || !Object.values(IncidentStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const incident = await incidentService.updateIncidentStatus(
      req.params.id,
      status
    );

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Emit WebSocket event
    try {
      const { getSocketServer } = await import('../websocket/socket');
      const io = getSocketServer();
      io.emit('incident:status-updated', incident);
    } catch (error) {
    }

    res.json(incident);
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ error: 'Failed to update incident status' });
  }
});

export default router;

