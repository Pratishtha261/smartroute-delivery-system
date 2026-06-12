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

class AStarAlgorithm {
  
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
    const gScore = new Map(); 
    const fScore = new Map(); 
    const cameFrom = new Map(); 

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

  static heuristic(currentNode, goalNode) {
    return calculateHaversineDistance(
      currentNode.lat,
      currentNode.lng,
      goalNode.lat,
      goalNode.lng
    );
  }

  static reconstructPath(cameFrom, current) {
    const path = [];
    let node = current;

    while (cameFrom.has(node)) {
      path.unshift(node);
      node = cameFrom.get(node);
    }
    path.unshift(node); 

    return path;
  }

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

  static estimateTime(distance) {
    return Math.round(distance * 5);
  }

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
