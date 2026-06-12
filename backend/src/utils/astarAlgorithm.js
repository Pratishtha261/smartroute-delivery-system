const calculateHaversineDistance = require('./haversineDistance');

/**
 * Priority Queue for A* algorithm
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    const qElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > qElement.priority) {
        this.items.splice(i, 0, qElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(qElement);
    }
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

/**
 * A* Algorithm - Primary routing algorithm
 * Uses Haversine distance as heuristic function
 * Optimal for real-world geographic pathfinding
 */
class AStarAlgorithm {
  /**
   * Find optimal path using A* algorithm
   * f(n) = g(n) + h(n)
   * g(n) = actual cost from start to node n
   * h(n) = heuristic estimate from node n to goal (Haversine distance)
   *
   * @param {object} graph - Graph with nodes and adjacencyList
   * @param {string} startId - Start node ID
   * @param {string} goalId - Goal node ID
   * @returns {object} Result with path, distance, time, nodes visited, performance metrics
   */
  static findPath(graph, startId, goalId) {
    const startTime = Date.now();
    const stats = {
      nodesVisited: 0,
      nodesExpanded: 0,
      queueSize: 0,
      maxQueueSize: 0,
    };

    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const gScore = new Map(); // Actual cost from start to node
    const fScore = new Map(); // g(n) + h(n)
    const cameFrom = new Map(); // For path reconstruction

    const startNode = graph.nodes[startId];
    const goalNode = graph.nodes[goalId];

    if (!startNode || !goalNode) {
      return {
        success: false,
        error: 'Start or goal node not found',
        path: [],
        distance: 0,
        estimatedTime: 0,
        stats: stats,
      };
    }

    // Initialize
    gScore.set(startId, 0);
    const h = this.heuristic(startNode, goalNode);
    fScore.set(startId, h);

    openSet.enqueue(startId, h);

    while (!openSet.isEmpty()) {
      stats.queueSize = openSet.size();
      stats.maxQueueSize = Math.max(stats.maxQueueSize, stats.queueSize);

      const { element: current } = openSet.dequeue();
      stats.nodesVisited++;

      if (current === goalId) {
        // Goal found - reconstruct path
        const path = this.reconstructPath(cameFrom, current);
        const distance = this.calculatePathDistance(path, graph);
        const estimatedTime = this.estimateTime(distance);

        return {
          success: true,
          path,
          pathIds: path.map((p) => p.id),
          distance,
          estimatedTime,
          stats: {
            ...stats,
            nodesExpanded: closedSet.size,
          },
          executionTime: Date.now() - startTime,
          algorithm: 'A*',
        };
      }

      closedSet.add(current);
      stats.nodesExpanded++;

      const currentNode = graph.nodes[current];
      const neighbors = graph.adjacencyList[current] || [];

      for (const edge of neighbors) {
        const neighbor = edge.to;

        if (closedSet.has(neighbor)) continue;

        const tentativeGScore = gScore.get(current) + edge.distance;

        if (!gScore.has(neighbor)) {
          gScore.set(neighbor, tentativeGScore);
        } else if (tentativeGScore >= gScore.get(neighbor)) {
          continue;
        }

        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);

        const neighborNode = graph.nodes[neighbor];
        const h = this.heuristic(neighborNode, goalNode);
        const f = tentativeGScore + h;
        fScore.set(neighbor, f);

        openSet.enqueue(neighbor, f);
      }
    }

    // No path found
    return {
      success: false,
      path: [],
      pathIds: [],
      distance: 0,
      estimatedTime: 0,
      error: 'No path found from start to goal',
      stats: {
        ...stats,
        nodesExpanded: closedSet.size,
      },
      executionTime: Date.now() - startTime,
      algorithm: 'A*',
    };
  }

  /**
   * Heuristic function: Haversine distance
   * Estimates straight-line distance to goal
   * Admissible: never overestimates actual distance
   */
  static heuristic(currentNode, goalNode) {
    return calculateHaversineDistance(
      currentNode.lat,
      currentNode.lng,
      goalNode.lat,
      goalNode.lng
    );
  }

  /**
   * Reconstruct path from start to goal
   */
  static reconstructPath(cameFrom, current) {
    const path = [];
    let node = current;

    while (cameFrom.has(node)) {
      path.unshift(node);
      node = cameFrom.get(node);
    }
    path.unshift(node); // Add start node

    return path;
  }

  /**
   * Calculate actual distance traveled along path
   */
  static calculatePathDistance(pathIds, graph) {
    let totalDistance = 0;
    for (let i = 0; i < pathIds.length - 1; i++) {
      const current = graph.nodes[pathIds[i]];
      const next = graph.nodes[pathIds[i + 1]];

      const distance = calculateHaversineDistance(
        current.lat,
        current.lng,
        next.lat,
        next.lng
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  /**
   * Estimate delivery time
   * Simple model: 5 minutes per kilometer (average city speed ~12 km/h)
   */
  static estimateTime(distance) {
    return Math.round(distance * 5);
  }

  /**
   * Convert path IDs to coordinates
   */
  static pathToCoordinates(pathIds, graph) {
    return pathIds.map((id) => {
      const node = graph.nodes[id];
      return {
        latitude: node.lat,
        longitude: node.lng,
      };
    });
  }
}

module.exports = AStarAlgorithm;
