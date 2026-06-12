#!/usr/bin/env node

/**
 * Routing System Test Script
 * Quick testing of A* and Bidirectional Dijkstra algorithms
 * Run: node scripts/test-routing.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testCases = [
  {
    name: 'Short Distance (5-10 km)',
    start: { latitude: 28.7041, longitude: 77.1025 },
    end: { latitude: 28.6139, longitude: 77.2090 },
  },
  {
    name: 'Medium Distance (20-30 km)',
    start: { latitude: 28.7041, longitude: 77.1025 },
    end: { latitude: 28.5355, longitude: 77.3910 },
  },
  {
    name: 'Diagonal Route',
    start: { latitude: 28.7041, longitude: 77.1025 },
    end: { latitude: 28.4500, longitude: 77.5000 },
  },
];

const multiStopTest = {
  name: 'Multi-Stop Delivery',
  stops: [
    { latitude: 28.7041, longitude: 77.1025 },
    { latitude: 28.6150, longitude: 77.2100 },
    { latitude: 28.5355, longitude: 77.3910 },
    { latitude: 28.6328, longitude: 77.2197 },
  ],
};

// Utility functions
const formatTime = (ms) => `${ms}ms`;
const formatDistance = (km) => `${km.toFixed(2)} km`;
const formatMetric = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
};

// Test single route
async function testSingleRoute(testCase, algorithm) {
  try {
    console.log(`\n  Testing ${algorithm}...`);
    const response = await axios.get(`${API_BASE}/route/compute`, {
      params: {
        startLat: testCase.start.latitude,
        startLng: testCase.start.longitude,
        endLat: testCase.end.latitude,
        endLng: testCase.end.longitude,
        algo: algorithm,
      },
    });

    const data = response.data.data;
    console.log(`    ✓ Distance: ${formatDistance(data.distance)}`);
    console.log(`    ✓ Execution Time: ${formatTime(data.executionTime)}`);
    console.log(`    ✓ Nodes Explored: ${data.stats.nodesExpanded || data.stats.totalNodesVisited}`);
    console.log(`    ✓ Path Nodes: ${data.path.length}`);
    console.log(`    ✓ Estimated Time: ${data.estimatedTime} min`);

    return data;
  } catch (error) {
    console.error(`    ✗ Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test algorithm comparison
async function testComparison(testCase) {
  try {
    console.log(`\n  Comparing algorithms...`);
    const response = await axios.get(`${API_BASE}/route/compare`, {
      params: {
        startLat: testCase.start.latitude,
        startLng: testCase.start.longitude,
        endLat: testCase.end.latitude,
        endLng: testCase.end.longitude,
      },
    });

    const data = response.data.data;
    console.log(`\n  📊 Performance Comparison:`);
    
    const astarTime = data.algorithms?.astar?.executionTime ?? data.astar?.executionTime ?? 0;
    const bidirectionalTime = data.algorithms?.bidirectional?.executionTime ?? data.bidirectional?.executionTime ?? 0;
    const timeDifference = data.efficiency?.timeDifference ?? Math.abs(astarTime - bidirectionalTime);
    const astarNodes = data.algorithms?.astar?.stats?.nodesExpanded ?? data.astar?.stats?.nodesExplored ?? 0;
    const bidirectionalNodes = data.algorithms?.bidirectional?.stats?.totalNodesVisited ?? data.bidirectional?.stats?.nodesExplored ?? 0;
    const distance = data.algorithms?.astar?.distance ?? data.astar?.distance ?? 0;

    console.log(`    A* Time:              ${formatTime(astarTime)}`);
    console.log(`    Bidirectional Time:   ${formatTime(bidirectionalTime)}`);
    console.log(`    Time Difference:      ${formatTime(timeDifference)}`);
    console.log(`    A* Nodes:             ${astarNodes}`);
    console.log(`    Bidirectional Nodes:  ${bidirectionalNodes}`);
    console.log(`    Distance (both):      ${formatDistance(distance)}`);

    if (data.recommendation) {
      const recAlgo = typeof data.recommendation === 'string' ? data.recommendation : data.recommendation.algorithm;
      console.log(`\n  💡 Recommendation: ${recAlgo}`);
      if (data.recommendation.reason) {
        console.log(`     ${data.recommendation.reason}`);
      }
      if (data.recommendation.speedup) {
        console.log(`     Speedup: ${data.recommendation.speedup}x`);
      }
    }

    return data;
  } catch (error) {
    console.error(`    ✗ Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test multi-stop optimization
async function testMultiStop() {
  try {
    console.log(`\n  🚚 Testing multi-stop optimization...`);
    const response = await axios.post(`${API_BASE}/route/optimize-multistop`, {
      stops: multiStopTest.stops,
    });

    const data = response.data.data;
    console.log(`    ✓ Total Distance: ${formatDistance(data.totalDistance)}`);
    console.log(`    ✓ Total Time: ${data.estimatedTotalTime ?? data.estimatedTime} min`);
    console.log(`    ✓ Execution Time: ${formatTime(data.executionTime)}`);
    
    if (data.segments) {
      console.log(`    ✓ Segments: ${data.segments.length}`);
      console.log(`\n    Segment Breakdown:`);
      data.segments.forEach((segment, idx) => {
        console.log(`      ${idx + 1}. ${segment.from || segment.fromStop} → ${segment.to || segment.toStop}: ${formatDistance(segment.distance)} (${segment.time} min)`);
      });
    } else {
      console.log(`    ✓ Optimized Route Nodes: ${data.optimizedRoute ? data.optimizedRoute.length : 0}`);
    }

    return data;
  } catch (error) {
    console.error(`    ✗ Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('         🛣️  ROUTING SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check if backend is running
  try {
    await axios.get(`${API_BASE}/health`);
  } catch (error) {
    console.error('❌ Backend is not running!');
    console.error('Please start the backend with: cd backend && npm run dev\n');
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;

  // Test each route
  for (const testCase of testCases) {
    console.log(`\n📍 Test: ${testCase.name}`);
    console.log(`   From: (${testCase.start.latitude}, ${testCase.start.longitude})`);
    console.log(`   To:   (${testCase.end.latitude}, ${testCase.end.longitude})`);

    // Test A*
    totalTests++;
    const astarResult = await testSingleRoute(testCase, 'astar');
    if (astarResult) passedTests++;

    // Test Bidirectional
    totalTests++;
    const bidirectionalResult = await testSingleRoute(testCase, 'bidirectional');
    if (bidirectionalResult) passedTests++;

    // Compare
    totalTests++;
    const comparisonResult = await testComparison(testCase);
    if (comparisonResult) passedTests++;
  }

  // Multi-stop test
  console.log(`\n📍 Multi-Stop Test: ${multiStopTest.name}`);
  multiStopTest.stops.forEach((stop, idx) => {
    console.log(`   Stop ${idx + 1}: (${stop.latitude}, ${stop.longitude})`);
  });

  totalTests++;
  const multiStopResult = await testMultiStop();
  if (multiStopResult) passedTests++;

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`\n✅ Test Results: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! System is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error.message);
  process.exit(1);
});
