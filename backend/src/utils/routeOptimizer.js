const calculateHaversineDistance = require('./haversineDistance');

/**
 * Priority weight mapping for route optimization
 * Higher values = delivered first
 */
const PRIORITY_WEIGHTS = {
  high: 1000,      // Emergency - highest priority
  medium: 500,     // Normal
  low: 100,        // Low priority
};

/**
 * Generate optimized route using nearest-neighbor algorithm with priority consideration
 * High-priority drops are prioritized in the route sequence
 * @param {object} pickupLocation - Starting location {latitude, longitude}
 * @param {array} dropLocations - Array of drop locations (with optional priority field)
 * @returns {array} Optimized route with sequence numbers
 */
const generateOptimizedRoute = (pickupLocation, dropLocations) => {
  if (!dropLocations || dropLocations.length === 0) {
    return [];
  }

  const route = [
    {
      ...pickupLocation,
      sequenceNumber: 0,
      type: 'pickup',
    },
  ];

  let unvisited = [...dropLocations];
  let currentLocation = pickupLocation;
  let sequenceNumber = 1;

  // Priority-aware nearest-neighbor algorithm
  while (unvisited.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    // Calculate score for each unvisited location
    // Score = priorityWeight - (distance * 0.1)
    // This balances priority with distance efficiency
    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );

      // Get priority weight, default to medium
      const priority = unvisited[i].priority || 'medium';
      const priorityWeight = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.medium;

      // Score calculation: priority matters more than distance
      const score = priorityWeight - (distance * 0.1);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    // Add best location to route
    const nextLocation = unvisited[bestIndex];
    const distance = calculateHaversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      nextLocation.latitude,
      nextLocation.longitude
    );

    route.push({
      ...nextLocation,
      sequenceNumber: sequenceNumber,
      type: 'drop',
      distance: distance,
      priority: nextLocation.priority || 'medium',
    });

    currentLocation = nextLocation;
    unvisited.splice(bestIndex, 1);
    sequenceNumber++;
  }

  return route;
};

module.exports = generateOptimizedRoute;
