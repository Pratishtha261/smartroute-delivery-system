const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

/**
 * Route Computation Endpoints
 */

// Compute single route with specified algorithm
// GET /api/route/compute?startLat=28.7041&startLng=77.1025&endLat=28.5355&endLng=77.3910&algo=astar
router.get('/compute', routingController.computeRoute);

// Compare both algorithms on same route
// GET /api/route/compare?startLat=28.7041&startLng=77.1025&endLat=28.5355&endLng=77.3910
router.get('/compare', routingController.compareAlgorithms);

// Optimize multi-stop delivery route
// POST /api/route/optimize-multistop
// Body: { stops: [{latitude, longitude}, ...] }
router.post('/optimize-multistop', routingController.optimizeMultiStop);

module.exports = router;
