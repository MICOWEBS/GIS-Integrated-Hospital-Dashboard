import { Router, Request, Response } from 'express';
import { RoutingService } from '../services/routing.service';

const router = Router();
const routingService = new RoutingService();

// Get route and ETA between two points
router.get('/route', async (req: Request, res: Response) => {
  try {
    const { fromLng, fromLat, toLng, toLat } = req.query;

    if (
      !fromLng ||
      !fromLat ||
      !toLng ||
      !toLat ||
      isNaN(Number(fromLng)) ||
      isNaN(Number(fromLat)) ||
      isNaN(Number(toLng)) ||
      isNaN(Number(toLat))
    ) {
      return res.status(400).json({
        error: 'Missing or invalid coordinates: fromLng, fromLat, toLng, toLat',
      });
    }

    const route = await routingService.getRoute(
      Number(fromLng),
      Number(fromLat),
      Number(toLng),
      Number(toLat)
    );

    return res.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    return res.status(500).json({ error: 'Failed to fetch route' });
  }
});

export default router;

