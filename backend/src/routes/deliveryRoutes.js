const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireDeliveryAccess } = require('../middleware/deliveryAccess');

// Create delivery
router.post('/create', requireAuth, requireRole('manager'), deliveryController.createDelivery);

// Assign partner to delivery
router.post('/assign-partner', requireAuth, requireRole('manager'), deliveryController.assignPartner);

// Get all deliveries
router.get('/', requireAuth, requireRole('manager'), deliveryController.getAllDeliveries);

// Priority-based endpoints (must come before dynamic :deliveryId route)
// Get pending deliveries sorted by priority (HIGH first)
router.get('/priority/pending', requireAuth, requireRole('manager'), deliveryController.getPendingByPriority);

// Get priority summary dashboard
router.get('/priority/summary', requireAuth, requireRole('manager'), deliveryController.getPrioritySummary);

// Emergency mode: bulk assign high-priority deliveries
router.post('/emergency/assign-all', requireAuth, requireRole('manager'), deliveryController.emergencyAssignAll);

// Customer's deliveries
router.get('/me', requireAuth, requireRole('customer'), deliveryController.getMyDeliveries);

// Public track delivery
router.get('/track/:id', deliveryController.publicTrackDelivery);

// Get delivery by ID
router.get('/:deliveryId', requireAuth, requireDeliveryAccess, deliveryController.getDeliveryById);

// Get delivery route
router.get('/:deliveryId/route', requireAuth, requireDeliveryAccess, deliveryController.getDeliveryRoute);

// Get optimized route using A* or Bidirectional Dijkstra
router.get('/:deliveryId/optimize-route', requireAuth, requireDeliveryAccess, deliveryController.optimizeDeliveryRoute);

// Compare routing algorithms for delivery
router.get('/:deliveryId/compare-algorithms', requireAuth, requireDeliveryAccess, deliveryController.compareRoutingAlgorithms);

// Track delivery (live updates)
router.post('/track', requireAuth, requireRole('partner'), requireDeliveryAccess, deliveryController.trackDelivery);

module.exports = router;
