const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

router.get('/compute', routingController.computeRoute);

router.get('/compare', routingController.compareAlgorithms);

router.post('/optimize-multistop', routingController.optimizeMultiStop);

module.exports = router;
