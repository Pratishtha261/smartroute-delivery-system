const AStarAlgorithm = require('../utils/astarAlgorithm');
const BidirectionalDijkstra = require('../utils/bidirectionalDijkstra');
const GraphBuilder = require('../utils/graphBuilder');
const calculateHaversineDistance = require('../utils/haversineDistance');

exports.computeRoute = async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, algo = 'astar' } = req.query;

    const coords = [startLat, startLng, endLat, endLng].map(parseFloat);
    if (coords.some((c) => isNaN(c))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. All must be numbers.',
      });
    }

    const [lat1, lng1, lat2, lng2] = coords;

    if (
      Math.abs(lat1) > 90 ||
      Math.abs(lng1) > 180 ||
      Math.abs(lat2) > 90 ||
      Math.abs(lng2) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range. Latitude: [-90, 90], Longitude: [-180, 180]',
      });
    }

    const graph = GraphBuilder.generateGraph(lat1, lng1, lat2, lng2, 8);

    let result;

    if (algo === 'astar') {
      result = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
    } else if (algo === 'bidirectional') {
      result = BidirectionalDijkstra.findPath(graph, graph.startId, graph.endId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid algorithm. Choose: astar or bidirectional',
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        algorithm: result.algorithm,
        path: result.path,
        distance: parseFloat(result.distance.toFixed(2)),
        estimatedTime: result.estimatedTime,
        stats: result.stats,
        executionTime: result.executionTime,
      },
    });
  } catch (error) {
    console.error('Error computing route:', error);
    res.status(500).json({
      success: false,
      message: 'Error computing route',
      error: error.message,
    });
  }
};

exports.compareAlgorithms = async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    const coords = [startLat, startLng, endLat, endLng].map(parseFloat);
    if (coords.some((c) => isNaN(c))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. All must be numbers.',
      });
    }

    const [lat1, lng1, lat2, lng2] = coords;

    if (
      Math.abs(lat1) > 90 ||
      Math.abs(lng1) > 180 ||
      Math.abs(lat2) > 90 ||
      Math.abs(lng2) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range.',
      });
    }

    const graph = GraphBuilder.generateGraph(lat1, lng1, lat2, lng2, 8);

    const astarResult = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
    const dijkstraResult = BidirectionalDijkstra.findPath(graph, graph.startId, graph.endId);

    const comparison = {
      startCoordinates: { latitude: lat1, longitude: lng1 },
      endCoordinates: { latitude: lat2, longitude: lng2 },
      directDistance: parseFloat(
        calculateHaversineDistance(lat1, lng1, lat2, lng2).toFixed(2)
      ),

      algorithms: {
        astar: {
          success: astarResult.success,
          distance: parseFloat(astarResult.distance.toFixed(2)),
          estimatedTime: astarResult.estimatedTime,
          executionTime: astarResult.executionTime,
          stats: astarResult.stats,
          pathLength: astarResult.pathIds ? astarResult.pathIds.length : 0,
        },
        bidirectional: {
          success: dijkstraResult.success,
          distance: parseFloat(dijkstraResult.distance.toFixed(2)),
          estimatedTime: dijkstraResult.estimatedTime,
          executionTime: dijkstraResult.executionTime,
          stats: dijkstraResult.stats,
          pathLength: dijkstraResult.pathIds ? dijkstraResult.pathIds.length : 0,
        },
      },

      efficiency: {
        astarFaster: astarResult.executionTime < dijkstraResult.executionTime,
        timeDifference: Math.abs(
          astarResult.executionTime - dijkstraResult.executionTime
        ),
        distanceDifference: Math.abs(astarResult.distance - dijkstraResult.distance),
        astarNodesVisited: astarResult.stats.nodesExpanded || 0,
        dijkstraNodesVisited:
          dijkstraResult.stats.totalNodesVisited || 0,
      },

      recommendation: generateRecommendation(astarResult, dijkstraResult),
    };

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error comparing algorithms:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing algorithms',
      error: error.message,
    });
  }
};

exports.optimizeMultiStop = async (req, res) => {
  try {
    const { stops } = req.body;

    if (!stops || !Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 stops required',
      });
    }

    for (let i = 0; i < stops.length; i++) {
      const { latitude, longitude } = stops[i];
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid coordinates at stop ${i + 1}`,
        });
      }
    }

    const startTime = Date.now();
    const completeRoute = [];
    let totalDistance = 0;
    const segmentResults = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const graph = GraphBuilder.generateGraph(
        currentStop.latitude,
        currentStop.longitude,
        nextStop.latitude,
        nextStop.longitude,
        6 
      );

      const result = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: `Failed to compute route for segment ${i + 1}`,
          error: result.error,
        });
      }

      const segmentPath = result.path;
      if (completeRoute.length === 0) {
        completeRoute.push(...segmentPath);
      } else {
        completeRoute.push(...segmentPath.slice(1)); 
      }

      totalDistance += result.distance;

      segmentResults.push({
        fromStop: i,
        toStop: i + 1,
        distance: parseFloat(result.distance.toFixed(2)),
        time: result.estimatedTime,
      });
    }

    res.json({
      success: true,
      data: {
        stops,
        route: completeRoute,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        estimatedTotalTime: Math.round(totalDistance * 5),
        segments: segmentResults,
        executionTime: Date.now() - startTime,
        algorithm: 'A* Multi-Stop',
      },
    });
  } catch (error) {
    console.error('Error optimizing multi-stop route:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing route',
      error: error.message,
    });
  }
};

function generateRecommendation(astarResult, dijkstraResult) {
  const astarTime = astarResult.executionTime;
  const dijkstraTime = dijkstraResult.executionTime;
  const astarNodes = astarResult.stats.nodesExpanded || 0;
  const dijkstraNodes = dijkstraResult.stats.totalNodesVisited || 0;

  if (astarTime * 1.1 < dijkstraTime && astarNodes < dijkstraNodes) {
    return {
      algorithm: 'A*',
      reason: 'A* is significantly faster and explores fewer nodes due to heuristic guidance',
      speedup: (dijkstraTime / astarTime).toFixed(2) + 'x',
    };
  } else if (
    dijkstraTime * 1.1 < astarTime &&
    dijkstraNodes < astarNodes * 1.2
  ) {
    return {
      algorithm: 'Bidirectional Dijkstra',
      reason: 'Bidirectional search converges faster from both ends',
      speedup: (astarTime / dijkstraTime).toFixed(2) + 'x',
    };
  } else {
    return {
      algorithm: 'A*',
      reason:
        'A* is generally recommended for pathfinding with geographic coordinates',
      note: 'Performance is comparable; use A* for consistency',
    };
  }
}
