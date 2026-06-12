import React, { useState, useEffect } from 'react';
import { routingAPI } from '../services/apiClient';
import '../styles/RoutingVisualization.css';

/**
 * Routing Visualization Component
 * Displays and compares A* and Bidirectional Dijkstra algorithms
 * Shows route computation time, distance, and nodes explored
 */
const RoutingVisualization = () => {
  const [startCoords, setStartCoords] = useState({ latitude: 28.7041, longitude: 77.1025 });
  const [endCoords, setEndCoords] = useState({ latitude: 28.5355, longitude: 77.3910 });

  const [astarRoute, setAstarRoute] = useState(null);
  const [dijkstraRoute, setDijkstraRoute] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('compute');

  // Test stops for multi-stop optimization
  const [multiStopMode, setMultiStopMode] = useState(false);
  const [stops, setStops] = useState([
    { latitude: 28.7041, longitude: 77.1025 },
    { latitude: 28.6150, longitude: 77.2100 },
    { latitude: 28.5355, longitude: 77.3910 },
  ]);

  /**
   * Compute single route with A* algorithm
   */
  const handleComputeAStar = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await routingAPI.computeRoute(
        startCoords.latitude,
        startCoords.longitude,
        endCoords.latitude,
        endCoords.longitude,
        'astar'
      );
      setAstarRoute(result.data.data);
    } catch (err) {
      setError(`A* Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compute single route with Bidirectional Dijkstra
   */
  const handleComputeBidirectional = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await routingAPI.computeRoute(
        startCoords.latitude,
        startCoords.longitude,
        endCoords.latitude,
        endCoords.longitude,
        'bidirectional'
      );
      setDijkstraRoute(result.data.data);
    } catch (err) {
      setError(`Bidirectional Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compare both algorithms on same route
   */
  const handleCompareAlgorithms = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await routingAPI.compareAlgorithms(
        startCoords.latitude,
        startCoords.longitude,
        endCoords.latitude,
        endCoords.longitude
      );
      setComparison(result.data.data);
      // Also get individual routes
      await handleComputeAStar();
      await handleComputeBidirectional();
    } catch (err) {
      setError(`Comparison Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Optimize multi-stop route
   */
  const handleOptimizeMultiStop = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await routingAPI.optimizeMultiStop(stops);
      setAstarRoute({
        ...result.data.data,
        algorithm: 'A* Multi-Stop',
      });
    } catch (err) {
      setError(`Multi-Stop Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add stop to multi-stop list
   */
  const addStop = () => {
    setStops([
      ...stops,
      { latitude: 28.6100 + Math.random() * 0.1, longitude: 77.2000 + Math.random() * 0.1 },
    ]);
  };

  /**
   * Remove stop from list
   */
  const removeStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  /**
   * Update stop coordinates
   */
  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = parseFloat(value);
    setStops(newStops);
  };

  return (
    <div className="routing-container">
      <div className="routing-header">
        <h1>🗺️ Routing Algorithm Comparison</h1>
        <p>A* vs Bidirectional Dijkstra for Delivery Optimization</p>
      </div>

      <div className="routing-tabs">
        <button
          className={`tab-button ${activeTab === 'compute' ? 'active' : ''}`}
          onClick={() => setActiveTab('compute')}
        >
          Single Route
        </button>
        <button
          className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          Algorithm Comparison
        </button>
        <button
          className={`tab-button ${activeTab === 'multistop' ? 'active' : ''}`}
          onClick={() => setActiveTab('multistop')}
        >
          Multi-Stop Optimization
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Single Route Tab */}
      {activeTab === 'compute' && (
        <div className="routing-content">
          <div className="input-section">
            <h3>Route Parameters</h3>
            <div className="coord-group">
              <label>Start Coordinates:</label>
              <input
                type="number"
                placeholder="Latitude"
                value={startCoords.latitude}
                onChange={(e) =>
                  setStartCoords({ ...startCoords, latitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={startCoords.longitude}
                onChange={(e) =>
                  setStartCoords({ ...startCoords, longitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>

            <div className="coord-group">
              <label>End Coordinates:</label>
              <input
                type="number"
                placeholder="Latitude"
                value={endCoords.latitude}
                onChange={(e) =>
                  setEndCoords({ ...endCoords, latitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={endCoords.longitude}
                onChange={(e) =>
                  setEndCoords({ ...endCoords, longitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>

            <div className="button-group">
              <button
                onClick={handleComputeAStar}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Computing A*...' : 'Compute A* Route'}
              </button>
              <button
                onClick={handleComputeBidirectional}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? 'Computing...' : 'Compute Bidirectional Route'}
              </button>
            </div>
          </div>

          <div className="results-section">
            <div className="route-result">
              {astarRoute && (
                <div className="algorithm-result">
                  <h4>⭐ A* Algorithm</h4>
                  <div className="metric">
                    <span className="label">Algorithm:</span>
                    <span className="value">{astarRoute.algorithm}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Distance:</span>
                    <span className="value">{astarRoute.distance.toFixed(2)} km</span>
                  </div>
                  <div className="metric">
                    <span className="label">Estimated Time:</span>
                    <span className="value">{astarRoute.estimatedTime} min</span>
                  </div>
                  <div className="metric">
                    <span className="label">Nodes Explored:</span>
                    <span className="value">{astarRoute.stats.nodesExpanded}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Execution Time:</span>
                    <span className="value">{astarRoute.executionTime} ms</span>
                  </div>
                  <div className="metric">
                    <span className="label">Path Nodes:</span>
                    <span className="value">{astarRoute.path.length}</span>
                  </div>
                </div>
              )}

              {dijkstraRoute && (
                <div className="algorithm-result">
                  <h4>🔄 Bidirectional Dijkstra</h4>
                  <div className="metric">
                    <span className="label">Algorithm:</span>
                    <span className="value">{dijkstraRoute.algorithm}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Distance:</span>
                    <span className="value">{dijkstraRoute.distance.toFixed(2)} km</span>
                  </div>
                  <div className="metric">
                    <span className="label">Estimated Time:</span>
                    <span className="value">{dijkstraRoute.estimatedTime} min</span>
                  </div>
                  <div className="metric">
                    <span className="label">Nodes Explored:</span>
                    <span className="value">{dijkstraRoute.stats.totalNodesVisited}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Execution Time:</span>
                    <span className="value">{dijkstraRoute.executionTime} ms</span>
                  </div>
                  <div className="metric">
                    <span className="label">Path Nodes:</span>
                    <span className="value">{dijkstraRoute.path.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Comparison Tab */}
      {activeTab === 'compare' && (
        <div className="routing-content">
          <div className="input-section">
            <h3>Compare Algorithms</h3>
            <div className="coord-group">
              <label>Start Coordinates:</label>
              <input
                type="number"
                placeholder="Latitude"
                value={startCoords.latitude}
                onChange={(e) =>
                  setStartCoords({ ...startCoords, latitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={startCoords.longitude}
                onChange={(e) =>
                  setStartCoords({ ...startCoords, longitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>

            <div className="coord-group">
              <label>End Coordinates:</label>
              <input
                type="number"
                placeholder="Latitude"
                value={endCoords.latitude}
                onChange={(e) =>
                  setEndCoords({ ...endCoords, latitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={endCoords.longitude}
                onChange={(e) =>
                  setEndCoords({ ...endCoords, longitude: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>

            <button
              onClick={handleCompareAlgorithms}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Comparing...' : 'Compare Both Algorithms'}
            </button>
          </div>

          {comparison && (
            <div className="comparison-results">
              <div className="comparison-header">
                <h3>Performance Comparison</h3>
                {comparison.recommendation && (
                  <div className="recommendation">
                    <p>
                      <strong>Recommended: {comparison.recommendation.algorithm}</strong>
                    </p>
                    <p>{comparison.recommendation.reason}</p>
                    <p>Speedup: {comparison.recommendation.speedup}x</p>
                  </div>
                )}
              </div>

              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>A*</th>
                      <th>Bidirectional Dijkstra</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Distance</td>
                      <td>{comparison.algorithms.astar.distance.toFixed(2)} km</td>
                      <td>{comparison.algorithms.bidirectional.distance.toFixed(2)} km</td>
                      <td>
                        {Math.abs(
                          comparison.algorithms.astar.distance -
                            comparison.algorithms.bidirectional.distance
                        ).toFixed(2)}{' '}
                        km
                      </td>
                    </tr>
                    <tr>
                      <td>Execution Time</td>
                      <td>{comparison.algorithms.astar.executionTime} ms</td>
                      <td>{comparison.algorithms.bidirectional.executionTime} ms</td>
                      <td>{comparison.efficiency.timeDifference.toFixed(0)} ms</td>
                    </tr>
                    <tr>
                      <td>Nodes Visited</td>
                      <td>{comparison.algorithms.astar.stats.nodesExpanded}</td>
                      <td>{comparison.algorithms.bidirectional.stats.totalNodesVisited}</td>
                      <td>
                        {Math.abs(
                          comparison.algorithms.astar.stats.nodesExpanded -
                            comparison.algorithms.bidirectional.stats.totalNodesVisited
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Path Length</td>
                      <td>{comparison.algorithms.astar.pathLength} nodes</td>
                      <td>{comparison.algorithms.bidirectional.pathLength} nodes</td>
                      <td>
                        {Math.abs(
                          comparison.algorithms.astar.pathLength -
                            comparison.algorithms.bidirectional.pathLength
                        )}{' '}
                        nodes
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="efficiency-analysis">
                <h4>Efficiency Analysis</h4>
                <p>
                  <strong>Faster Algorithm:</strong>{' '}
                  {comparison.efficiency.astarFaster ? 'A*' : 'Bidirectional Dijkstra'}
                </p>
                <p>
                  <strong>Time Advantage:</strong> {comparison.efficiency.timeDifference.toFixed(2)}{' '}
                  ms
                </p>
                <p>
                  <strong>Distance Difference:</strong>{' '}
                  {comparison.efficiency.distanceDifference.toFixed(2)} km
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Stop Optimization Tab */}
      {activeTab === 'multistop' && (
        <div className="routing-content">
          <div className="input-section">
            <h3>Multi-Stop Route Optimization</h3>
            <p className="info-text">Define multiple stops to optimize the delivery route</p>

            <div className="stops-list">
              <h4>Delivery Stops</h4>
              {stops.map((stop, index) => (
                <div key={index} className="stop-input">
                  <span className="stop-number">Stop {index + 1}</span>
                  <input
                    type="number"
                    placeholder="Latitude"
                    value={stop.latitude}
                    onChange={(e) => updateStop(index, 'latitude', e.target.value)}
                    step="0.0001"
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    value={stop.longitude}
                    onChange={(e) => updateStop(index, 'longitude', e.target.value)}
                    step="0.0001"
                  />
                  {stops.length > 2 && (
                    <button
                      onClick={() => removeStop(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addStop} className="btn btn-secondary btn-sm">
                + Add Stop
              </button>
            </div>

            <button
              onClick={handleOptimizeMultiStop}
              disabled={loading || stops.length < 2}
              className="btn btn-success"
            >
              {loading ? 'Optimizing...' : 'Optimize Multi-Stop Route'}
            </button>
          </div>

          {astarRoute && astarRoute.algorithm === 'A* Multi-Stop' && (
            <div className="multistop-results">
              <h4>Optimized Route</h4>
              <div className="metric">
                <span className="label">Total Distance:</span>
                <span className="value">{astarRoute.totalDistance.toFixed(2)} km</span>
              </div>
              <div className="metric">
                <span className="label">Estimated Total Time:</span>
                <span className="value">{astarRoute.estimatedTotalTime} minutes</span>
              </div>
              <div className="metric">
                <span className="label">Execution Time:</span>
                <span className="value">{astarRoute.executionTime} ms</span>
              </div>

              <div className="segments">
                <h5>Route Segments</h5>
                {astarRoute.segments &&
                  astarRoute.segments.map((segment, idx) => (
                    <div key={idx} className="segment">
                      <strong>
                        {segment.from} → {segment.to}
                      </strong>
                      <span className="distance">{segment.distance.toFixed(2)} km</span>
                      <span className="time">{segment.estimatedTime} min</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="routing-footer">
        <p className="info-text">
          💡 A* uses heuristic guidance (Haversine distance) for faster pathfinding. Bidirectional
          Dijkstra searches from both ends. Use A* for most deliveries.
        </p>
      </div>
    </div>
  );
};

export default RoutingVisualization;
