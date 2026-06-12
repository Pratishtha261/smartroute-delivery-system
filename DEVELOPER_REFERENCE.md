# Developer Reference - Code Patterns & Examples

## Working Code Examples

### Using A* Algorithm

```javascript
// Basic usage
const AStarAlgorithm = require('./utils/astarAlgorithm');
const GraphBuilder = require('./utils/graphBuilder');

// Generate a geographic grid graph
const graph = GraphBuilder.generateGraph(
  28.7041, 77.1025,  // Start: Raj Kumar, Delhi
  28.5355, 77.3910,  // End: Arun Patel, Delhi region
  8                   // 8x8 grid = 81 nodes
);

// Find optimal path using A*
const result = AStarAlgorithm.findPath(
  graph,
  graph.startId,    // "0_0"
  graph.endId       // "8_8"
);

// Check result
if (result.success) {
  console.log(`✓ Path found!`);
  console.log(`  Distance: ${result.distance.toFixed(2)} km`);
  console.log(`  Time: ${result.estimatedTime} minutes`);
  console.log(`  Nodes explored: ${result.stats.nodesExpanded}`);
  console.log(`  Execution time: ${result.executionTime} ms`);
  
  // Access the path
  result.path.forEach((point, idx) => {
    console.log(`  Step ${idx}: (${point.latitude}, ${point.longitude})`);
  });
} else {
  console.log(`✗ No path found: ${result.error}`);
}
```

### Using Bidirectional Dijkstra

```javascript
const BidirectionalDijkstra = require('./utils/bidirectionalDijkstra');
const GraphBuilder = require('./utils/graphBuilder');

const graph = GraphBuilder.generateGraph(28.7041, 77.1025, 28.5355, 77.3910);

const result = BidirectionalDijkstra.findPath(
  graph,
  graph.startId,
  graph.endId
);

if (result.success) {
  console.log(`Path found by Bidirectional Dijkstra:`);
  console.log(`  Distance: ${result.distance.toFixed(2)} km`);
  console.log(`  Forward nodes visited: ${result.stats.forwardNodesVisited}`);
  console.log(`  Backward nodes visited: ${result.stats.backwardNodesVisited}`);
  console.log(`  Total nodes: ${result.stats.totalNodesVisited}`);
}
```

### Comparing Algorithms

```javascript
// Controller method example
async function compareAlgorithms(req, res) {
  const { startLat, startLng, endLat, endLng } = req.query;
  
  // Build graph once
  const graph = GraphBuilder.generateGraph(
    startLat, startLng,
    endLat, endLng
  );
  
  // Run both algorithms
  const astarResult = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
  const dijkstraResult = BidirectionalDijkstra.findPath(graph, graph.startId, graph.endId);
  
  // Analyze results
  if (astarResult.executionTime < dijkstraResult.executionTime) {
    recommendation = {
      algorithm: 'A*',
      speedup: (dijkstraResult.executionTime / astarResult.executionTime).toFixed(2)
    };
  } else {
    recommendation = {
      algorithm: 'Bidirectional Dijkstra',
      speedup: (astarResult.executionTime / dijkstraResult.executionTime).toFixed(2)
    };
  }
  
  res.json({
    success: true,
    data: {
      astar: {distance, time, nodes},
      dijkstra: {distance, time, nodes},
      recommendation
    }
  });
}
```

### Multi-Stop Optimization

```javascript
// Optimize delivery with multiple stops
async function optimizeDeliveryRoute(req, res) {
  const delivery = await Delivery.findById(deliveryId);
  
  // Build stops array: pickup + drops
  const stops = [
    delivery.pickupLocation,
    ...delivery.dropLocations
  ];
  
  let totalDistance = 0;
  const completeRoute = [];
  
  // Process each segment
  for (let i = 0; i < stops.length - 1; i++) {
    const currentStop = stops[i];
    const nextStop = stops[i + 1];
    
    // Build graph for segment
    const graph = GraphBuilder.generateGraph(
      currentStop.latitude,
      currentStop.longitude,
      nextStop.latitude,
      nextStop.longitude,
      6  // Smaller grid for multi-stop
    );
    
    // Find path using A*
    const result = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
    
    // Accumulate results
    if (i === 0) {
      completeRoute.push(...result.path);
    } else {
      completeRoute.push(...result.path.slice(1)); // Skip duplicate start
    }
    
    totalDistance += result.distance;
  }
  
  res.json({
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalTime: Math.round(totalDistance * 5),
    route: completeRoute
  });
}
```

### Frontend API Usage

```javascript
// React component example
import { routingAPI } from '../services/apiClient';
import { useState } from 'react';

export function RoutingComponent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Compute route
  const handleComputeRoute = async () => {
    setLoading(true);
    try {
      const response = await routingAPI.computeRoute(
        28.7041, 77.1025,  // Start
        28.5355, 77.3910,  // End
        'astar'            // Algorithm
      );
      setResult(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Display results
  return (
    <div>
      <button onClick={handleComputeRoute} disabled={loading}>
        {loading ? 'Computing...' : 'Compute Route'}
      </button>
      
      {result && (
        <div>
          <h3>{result.algorithm}</h3>
          <p>Distance: {result.distance} km</p>
          <p>Time: {result.estimatedTime} min</p>
          <p>Nodes explored: {result.stats.nodesExpanded}</p>
          <p>Execution time: {result.executionTime} ms</p>
        </div>
      )}
    </div>
  );
}
```

### Comparison Results Processing

```javascript
// Process comparison data
const comparison = await routingAPI.compareAlgorithms(startLat, startLng, endLat, endLng);

const data = comparison.data.data;

// Analyze efficiency
console.log('Performance Analysis:');
console.log(`A* was ${data.efficiency.astarFaster ? 'faster' : 'slower'}`);
console.log(`Time difference: ${data.efficiency.timeDifference} ms`);
console.log(`Distance difference: ${data.efficiency.distanceDifference} km`);

// Get recommendation
console.log(`Recommended: ${data.recommendation.algorithm}`);
console.log(`Speedup: ${data.recommendation.speedup}x`);
```

---

## API Response Structures

### Single Route Response

```json
{
  "success": true,
  "data": {
    "algorithm": "A*",
    "path": [
      {"latitude": 28.7041, "longitude": 77.1025},
      {"latitude": 28.7032, "longitude": 77.1038},
      ...
    ],
    "distance": 32.45,
    "estimatedTime": 162,
    "stats": {
      "nodesVisited": 47,
      "nodesExpanded": 42,
      "queueSize": 5,
      "maxQueueSize": 12
    },
    "executionTime": 15
  }
}
```

### Comparison Response

```json
{
  "success": true,
  "data": {
    "algorithms": {
      "astar": {
        "success": true,
        "distance": 32.45,
        "estimatedTime": 162,
        "executionTime": 15,
        "stats": {
          "nodesVisited": 47,
          "nodesExpanded": 42,
          "queueSize": 5,
          "maxQueueSize": 12
        },
        "pathLength": 47
      },
      "bidirectional": {
        "success": true,
        "distance": 32.45,
        "estimatedTime": 162,
        "executionTime": 18,
        "stats": {
          "forwardNodesVisited": 24,
          "backwardNodesVisited": 19,
          "totalNodesVisited": 43,
          "maxQueueSize": 10
        },
        "pathLength": 47
      }
    },
    "efficiency": {
      "astarFaster": true,
      "timeDifference": 3,
      "distanceDifference": 0,
      "astarNodesVisited": 42,
      "dijkstraNodesVisited": 43
    },
    "recommendation": {
      "algorithm": "A*",
      "reason": "A* is 1.2x faster and explores similar nodes",
      "speedup": "1.20"
    }
  }
}
```

### Multi-Stop Response

```json
{
  "success": true,
  "data": {
    "stops": [
      {"latitude": 28.7041, "longitude": 77.1025},
      {"latitude": 28.6150, "longitude": 77.2100},
      {"latitude": 28.5355, "longitude": 77.3910}
    ],
    "route": [...],
    "totalDistance": 45.32,
    "estimatedTotalTime": 226,
    "segments": [
      {
        "from": "pickup",
        "to": "drop_1",
        "distance": 14.20,
        "time": 71,
        "algorithm": "A*",
        "nodesExplored": 39
      },
      {
        "from": "drop_1",
        "to": "final_drop",
        "distance": 31.12,
        "time": 155,
        "algorithm": "A*",
        "nodesExplored": 44
      }
    ],
    "executionTime": 32,
    "algorithm": "A* Multi-Stop"
  }
}
```

---

## Graph Structure Details

### Node Structure

```javascript
{
  "0_0": {
    id: "0_0",
    lat: 28.7041,      // Latitude
    lng: 77.1025,      // Longitude
    i: 0,              // Grid row
    j: 0               // Grid column
  },
  "0_1": {
    id: "0_1",
    lat: 28.7040,
    lng: 77.1027,
    i: 0,
    j: 1
  },
  // ... 79 more nodes for 8x8 grid
}
```

### Adjacency List Structure

```javascript
{
  "0_0": [
    {
      to: "0_1",
      distance: 0.234,   // km (Haversine)
      weight: 0.234      // Same as distance
    },
    {
      to: "1_0",
      distance: 0.256,
      weight: 0.256
    },
    {
      to: "1_1",
      distance: 0.331,   // Diagonal
      weight: 0.331
    }
    // ... up to 8 neighbors
  ],
  "0_1": [
    // ...edges...
  ],
  // ... more nodes ...
}
```

### Distance Calculation

```javascript
// Haversine formula used for all distances
const R = 6371; // Earth's radius in km
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;

const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = R * c; // in kilometers
```

---

## Priority Queue Implementation

```javascript
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    const qElement = { element, priority };
    let added = false;

    // Insert at correct position to maintain sorted order
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

// Usage in A*:
const openSet = new PriorityQueue();
openSet.enqueue(startId, 0);

while (!openSet.isEmpty()) {
  const { element: current, priority } = openSet.dequeue();
  // ...process current node...
}
```

---

## Error Handling Patterns

```javascript
// Validation in controller
if (!startLat || !startLng || !endLat || !endLng) {
  return res.status(400).json({
    success: false,
    message: 'Missing coordinates'
  });
}

// Coordinate range validation
if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
  return res.status(400).json({
    success: false,
    message: 'Coordinates out of valid range'
  });
}

// Algorithm validation
if (!['astar', 'bidirectional'].includes(algo)) {
  return res.status(400).json({
    success: false,
    message: 'Invalid algorithm. Choose: astar or bidirectional'
  });
}

// Path validation in frontend
try {
  const result = await routingAPI.computeRoute(...);
  if (!result.data.success) {
    throw new Error(result.data.message);
  }
  // Use result
} catch (error) {
  setError(error.message);
}
```

---

## Performance Optimization Tips

### 1. Grid Size Tuning
```javascript
// Smaller grid for quick local routes
const graph = GraphBuilder.generateGraph(lat1, lng1, lat2, lng2, 6);

// Larger grid for complex routes
const graph = GraphBuilder.generateGraph(lat1, lng1, lat2, lng2, 12);
```

### 2. Caching Results
```javascript
const routeCache = new Map();
const cacheKey = `${startLat}_${startLng}_${endLat}_${endLng}`;

if (routeCache.has(cacheKey)) {
  return routeCache.get(cacheKey);
}

const result = AStarAlgorithm.findPath(graph, startId, endId);
routeCache.set(cacheKey, result);
```

### 3. Batch Processing
```javascript
// Process multiple routes efficiently
const routes = stops.map((stop, i) => ({
  from: i === 0 ? pickup : stops[i-1],
  to: stop
}));

const results = routes.map(route => {
  const graph = GraphBuilder.generateGraph(...);
  return AStarAlgorithm.findPath(graph, startId, endId);
});
```

---

## Testing Patterns

```javascript
// Test A* algorithm
async function testAStar() {
  const graph = GraphBuilder.generateGraph(
    28.7041, 77.1025,
    28.5355, 77.3910
  );
  
  const result = AStarAlgorithm.findPath(graph, graph.startId, graph.endId);
  
  assert(result.success === true, 'Should find path');
  assert(result.path.length > 0, 'Path should not be empty');
  assert(result.distance > 0, 'Distance should be positive');
  assert(result.executionTime < 50, 'Should complete in <50ms');
  
  console.log('✓ A* test passed');
}

// Test API endpoint
async function testAPIEndpoint() {
  const response = await axios.get(`/api/route/compute`, {
    params: {
      startLat: 28.7041,
      startLng: 77.1025,
      endLat: 28.5355,
      endLng: 77.3910,
      algo: 'astar'
    }
  });
  
  assert(response.status === 200, 'Should return 200 OK');
  assert(response.data.success === true, 'Should be successful');
  assert(response.data.data.path.length > 0, 'Should have path');
  
  console.log('✓ API endpoint test passed');
}
```

---

## Integration Checklist

When integrating into your system:

- [ ] All files created/updated without errors
- [ ] Backend server starts successfully
- [ ] Frontend compiles without errors
- [ ] Can login and access /routing route
- [ ] Can compute single routes
- [ ] Algorithm comparison works
- [ ] Multi-stop optimization works
- [ ] Test suite passes (`node scripts/test-routing.js`)
- [ ] No console errors
- [ ] API responses match documentation
- [ ] Performance metrics accurate
- [ ] Database integrations work
- [ ] Error handling works

---

## Maintenance Notes

- Monitor execution times for performance degradation
- Cache frequently computed routes if needed
- Update grid size based on geographic requirements
- Add logging for debugging in production
- Regular testing with new coordinate sets

---

*Last Updated: April 2025*
