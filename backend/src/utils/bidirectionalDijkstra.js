const calculateHaversineDistance = require('./haversineDistance');

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

class BidirectionalDijkstra {
  
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

    const forwardDist = new Map();
    const forwardParent = new Map();
    const forwardPQ = new PriorityQueue();
    const forwardVisited = new Set();

    forwardDist.set(startId, 0);
    forwardPQ.enqueue(startId, 0);

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
      
      if (!forwardPQ.isEmpty()) {
        const { element: current, priority: currentDist } = forwardPQ.dequeue();

        if (currentDist >= bestDistance) {
          break; 
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

      if (!backwardPQ.isEmpty()) {
        const { element: current, priority: currentDist } = backwardPQ.dequeue();

        if (currentDist >= bestDistance) {
          break; 
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

  static reconstructPath(forwardParent, backwardParent, meeting, start) {
    const path = [];

    let current = meeting;
    while (current !== undefined) {
      path.unshift(current);
      current = forwardParent.get(current);
    }

    current = backwardParent.get(meeting);
    while (current !== undefined) {
      path.push(current);
      current = backwardParent.get(current);
    }

    return path;
  }

  static estimateTime(distance) {
    return Math.round(distance * 5); 
  }
}

module.exports = BidirectionalDijkstra;
