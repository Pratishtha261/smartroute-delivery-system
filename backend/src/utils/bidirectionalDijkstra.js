const calculateHaversineDistance = require('./haversineDistance');

/**
 * Priority Queue for Dijkstra algorithms
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
 * Bidirectional Dijkstra Algorithm
 * Searches from both start and end simultaneously
 * Typically faster than unidirectional Dijkstra
 */
class BidirectionalDijkstra {
  /**
   * Find shortest path using Bidirectional Dijkstra
   * @param {object} graph - Graph with nodes and adjacencyList
   * @param {string} startId - Start node ID
   * @param {string} goalId - Goal node ID
   * @returns {object} Result with path, distance, time, stats
   */
  static findPath(graph, startId, goalId) {
    const startTime = Date.now();
    const stats = {
      forwardNodesVisited: 0,
      backwardNodesVisited: 0,
      totalNodesVisited: 0,
      maxQueueSize: 0,
    };

    const startNode = graph.nodes[startId];
    const goalNode = graph.nodes[goalId];

    if (!startNode || !goalNode) {
      return {
        success: false,
        error: 'Start or goal node not found',
        path: [],
        pathIds: [],
        distance: 0,
        estimatedTime: 0,
        stats,
      };
    }

    // Forward search (from start)
    const forwardDist = new Map();
    const forwardParent = new Map();
    const forwardPQ = new PriorityQueue();
    const forwardVisited = new Set();

    forwardDist.set(startId, 0);
    forwardPQ.enqueue(startId, 0);

    // Backward search (from goal)
    const backwardDist = new Map();
    const backwardParent = new Map();
    const backwardPQ = new PriorityQueue();
    const backwardVisited = new Set();

    backwardDist.set(goalId, 0);
    backwardPQ.enqueue(goalId, 0);

    let bestPath = null;
    let bestDistance = Infinity;
    let bestMeetingNode = null;

    while (!forwardPQ.isEmpty() || !backwardPQ.isEmpty()) {
      // Forward step
      if (!forwardPQ.isEmpty()) {
        const { element: current, priority: currentDist } = forwardPQ.dequeue();

        if (currentDist >= bestDistance) {
          break; // Early termination
        }

        if (!forwardVisited.has(current)) {
          forwardVisited.add(current);
          stats.forwardNodesVisited++;

          const neighbors = graph.adjacencyList[current] || [];

          for (const edge of neighbors) {
            const neighbor = edge.to;
            const newDist = currentDist + edge.distance;

            if (!forwardDist.has(neighbor) || newDist < forwardDist.get(neighbor)) {
              forwardDist.set(neighbor, newDist);
              forwardParent.set(neighbor, current);
              forwardPQ.enqueue(neighbor, newDist);

              // Check if backward search reached this node
              if (backwardDist.has(neighbor)) {
                const totalDist = newDist + backwardDist.get(neighbor);
                if (totalDist < bestDistance) {
                  bestDistance = totalDist;
                  bestMeetingNode = neighbor;
                }
              }
            }
          }
        }
      }

      // Backward step
      if (!backwardPQ.isEmpty()) {
        const { element: current, priority: currentDist } = backwardPQ.dequeue();

        if (currentDist >= bestDistance) {
          break; // Early termination
        }

        if (!backwardVisited.has(current)) {
          backwardVisited.add(current);
          stats.backwardNodesVisited++;

          const neighbors = graph.adjacencyList[current] || [];

          for (const edge of neighbors) {
            const neighbor = edge.to;
            const newDist = currentDist + edge.distance;

            if (!backwardDist.has(neighbor) || newDist < backwardDist.get(neighbor)) {
              backwardDist.set(neighbor, newDist);
              backwardParent.set(neighbor, current);
              backwardPQ.enqueue(neighbor, newDist);

              // Check if forward search reached this node
              if (forwardDist.has(neighbor)) {
                const totalDist = newDist + forwardDist.get(neighbor);
                if (totalDist < bestDistance) {
                  bestDistance = totalDist;
                  bestMeetingNode = neighbor;
                }
              }
            }
          }
        }
      }

      stats.maxQueueSize = Math.max(
        stats.maxQueueSize,
        forwardPQ.size() + backwardPQ.size()
      );
    }

    stats.totalNodesVisited = stats.forwardNodesVisited + stats.backwardNodesVisited;

    if (bestMeetingNode === null) {
      return {
        success: false,
        path: [],
        pathIds: [],
        distance: 0,
        estimatedTime: 0,
        error: 'No path found',
        stats,
        executionTime: Date.now() - startTime,
        algorithm: 'Bidirectional Dijkstra',
      };
    }

    // Reconstruct path
    const pathIds = this.reconstructPath(
      forwardParent,
      backwardParent,
      bestMeetingNode,
      startId
    );

    const path = pathIds.map((id) => {
      const node = graph.nodes[id];
      return {
        latitude: node.lat,
        longitude: node.lng,
      };
    });

    const estimatedTime = this.estimateTime(bestDistance);

    return {
      success: true,
      path,
      pathIds,
      distance: bestDistance,
      estimatedTime,
      stats: {
        ...stats,
        meetingNode: bestMeetingNode,
      },
      executionTime: Date.now() - startTime,
      algorithm: 'Bidirectional Dijkstra',
    };
  }

  /**
   * Reconstruct path from forward and backward parent maps
   */
  static reconstructPath(forwardParent, backwardParent, meeting, start) {
    const path = [];

    // From start to meeting node (forward)
    let current = meeting;
    while (current !== undefined) {
      path.unshift(current);
      current = forwardParent.get(current);
    }

    // From meeting to goal (backward)
    current = backwardParent.get(meeting);
    while (current !== undefined) {
      path.push(current);
      current = backwardParent.get(current);
    }

    return path;
  }

  /**
   * Estimate delivery time
   */
  static estimateTime(distance) {
    return Math.round(distance * 5); // 5 min per km
  }
}

module.exports = BidirectionalDijkstra;
