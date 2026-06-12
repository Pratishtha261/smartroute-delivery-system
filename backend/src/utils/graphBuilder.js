const calculateHaversineDistance = require('./haversineDistance');

class GraphBuilder {
  
  static generateGraph(startLat, startLng, endLat, endLng, gridSize = 8) {
    const graph = {
      nodes: {},
      adjacencyList: {},
      startId: null,
      endId: null,
    };

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        
        const lat = startLat + (endLat - startLat) * (i / gridSize);
        const lng = startLng + (endLng - startLng) * (j / gridSize);

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

        if (i === 0 && j === 0) graph.startId = id;
        if (i === gridSize && j === gridSize) graph.endId = id;
      }
    }

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const nodeId = `${i}_${j}`;
        const node = graph.nodes[nodeId];

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

            const distance = calculateHaversineDistance(
              node.lat,
              node.lng,
              neighbor.lat,
              neighbor.lng
            );

            graph.adjacencyList[nodeId].push({
              to: neighborId,
              distance,
              weight: distance, 
            });
          }
        }
      }
    }

    return graph;
  }

  static extractPathCoordinates(pathIds, graph) {
    return pathIds.map((id) => {
      const node = graph.nodes[id];
      return {
        latitude: node.lat,
        longitude: node.lng,
      };
    });
  }

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

  static estimateTime(distance) {
    return distance * 5; 
  }
}

module.exports = GraphBuilder;
