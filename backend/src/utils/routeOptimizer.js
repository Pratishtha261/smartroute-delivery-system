const calculateHaversineDistance = require('./haversineDistance');

const PRIORITY_WEIGHTS = {
  high: 1000,      
  medium: 500,     
  low: 100,        
};

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

  while (unvisited.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );

      const priority = unvisited[i].priority || 'medium';
      const priorityWeight = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.medium;

      const score = priorityWeight - (distance * 0.1);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

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
