const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireDeliveryAccess } = require('../middleware/deliveryAccess');

router.post('/create', requireAuth, requireRole('manager'), deliveryController.createDelivery);

router.post('/assign-partner', requireAuth, requireRole('manager'), deliveryController.assignPartner);

router.get('/', requireAuth, requireRole('manager'), deliveryController.getAllDeliveries);

router.get('/priority/pending', requireAuth, requireRole('manager'), deliveryController.getPendingByPriority);

router.get('/priority/summary', requireAuth, requireRole('manager'), deliveryController.getPrioritySummary);

router.post('/emergency/assign-all', requireAuth, requireRole('manager'), deliveryController.emergencyAssignAll);

router.get('/me', requireAuth, requireRole('customer'), deliveryController.getMyDeliveries);

router.get('/track/:id', deliveryController.publicTrackDelivery);

router.get('/:deliveryId', requireAuth, requireDeliveryAccess, deliveryController.getDeliveryById);

router.get('/:deliveryId/route', requireAuth, requireDeliveryAccess, deliveryController.getDeliveryRoute);

router.get('/:deliveryId/optimize-route', requireAuth, requireDeliveryAccess, deliveryController.optimizeDeliveryRoute);

router.get('/:deliveryId/compare-algorithms', requireAuth, requireDeliveryAccess, deliveryController.compareRoutingAlgorithms);

router.post('/track', requireAuth, requireRole('partner'), requireDeliveryAccess, deliveryController.trackDelivery);

module.exports = router;
