const calculateHaversineDistance = require('./haversineDistance');

/**
 * Build a geographic grid-based graph for routing algorithms
 * Nodes represent locations in a geographic grid
 * Edges represent roads with distance weights
 */
class GraphBuilder {
  /**
   * Generate a graph between start and end locations
   * @param {number} startLat
   * @param {number} startLng
   * @param {number} endLat
   * @param {number} endLng
   * @param {number} gridSize - Number of nodes in each dimension (default 8x8)
   * @returns {object} Graph with nodes and adjacency list
   */
  static generateGraph(startLat, startLng, endLat, endLng, gridSize = 8) {
    const graph = {
      nodes: {},
      adjacencyList: {},
      startId: null,
      endId: null,
    };

    // Create nodes in a grid pattern
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        // Linear interpolation between start and end
        const lat = startLat + (endLat - startLat) * (i / gridSize);
        const lng = startLng + (endLng - startLng) * (j / gridSize);

        // Add slight noise for realism (except start/end points)
        let noiseLat = 0,
          noiseLng = 0;
        if (
          !(i === 0 && j === 0) &&
          !(i === gridSize && j === gridSize)
        ) {
          noiseLat = (Math.random() - 0.5) * 0.002;
          noiseLng = (Math.random() - 0.5) * 0.002;
        }

        const id = `${i}_${j}`;
        graph.nodes[id] = {
          id,
          lat: lat + noiseLat,
          lng: lng + noiseLng,
          i,
          j,
        };

        graph.adjacencyList[id] = [];

        // Track start and end nodes
        if (i === 0 && j === 0) graph.startId = id;
        if (i === gridSize && j === gridSize) graph.endId = id;
      }
    }

    // Create edges (connections between adjacent nodes)
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const nodeId = `${i}_${j}`;
        const node = graph.nodes[nodeId];

        // Connect to 8 neighbors (including diagonals)
        const neighbors = [
          [i + 1, j],
          [i - 1, j],
          [i, j + 1],
          [i, j - 1],
          [i + 1, j + 1],
          [i + 1, j - 1],
          [i - 1, j + 1],
          [i - 1, j - 1],
        ];

        for (const [ni, nj] of neighbors) {
          if (ni >= 0 && ni <= gridSize && nj >= 0 && nj <= gridSize) {
            const neighborId = `${ni}_${nj}`;
            const neighbor = graph.nodes[neighborId];

            // Calculate real distance using Haversine
            const distance = calculateHaversineDistance(
              node.lat,
              node.lng,
              neighbor.lat,
              neighbor.lng
            );

            // Add edge with distance as weight
            graph.adjacencyList[nodeId].push({
              to: neighborId,
              distance,
              weight: distance, // For compatibility with different algo names
            });
          }
        }
      }
    }

    return graph;
  }

  /**
   * Extract path coordinates from node IDs
   * @param {string[]} pathIds - Array of node IDs
   * @param {object} graph - Graph object
   * @returns {array} Array of {lat, lng} coordinates
   */
  static extractPathCoordinates(pathIds, graph) {
    return pathIds.map((id) => {
      const node = graph.nodes[id];
      return {
        latitude: node.lat,
        longitude: node.lng,
      };
    });
  }

  /**
   * Calculate total distance of a path
   * @param {string[]} pathIds - Array of node IDs
   * @param {object} graph - Graph object
   * @returns {number} Total distance in kilometers
   */
  static calculatePathDistance(pathIds, graph) {
    let totalDistance = 0;
    for (let i = 0; i < pathIds.length - 1; i++) {
      const fromNode = graph.nodes[pathIds[i]];
      const toNode = graph.nodes[pathIds[i + 1]];

      const distance = calculateHaversineDistance(
        fromNode.lat,
        fromNode.lng,
        toNode.lat,
        toNode.lng
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  /**
   * Estimate time for a path (simple model: 5 minutes per km)
   * @param {number} distance - Distance in kilometers
   * @returns {number} Estimated time in minutes
   */
  static estimateTime(distance) {
    return distance * 5; // 5 minutes per km (avg city speed ~12 km/h)
  }
}

module.exports = GraphBuilder;
