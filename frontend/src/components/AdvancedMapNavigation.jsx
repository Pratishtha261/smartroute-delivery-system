import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  StreetViewPanorama,
  Autocomplete
} from '@react-google-maps/api';
import { Play, Navigation, Map as MapIcon, RefreshCcw } from 'lucide-react';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 28.6139,
  lng: 77.2090, 
};

const defaultOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

const generateRoadGraph = (startLat, startLng, endLat, endLng) => {
  const GRID_SIZE = 5;
  const graph = { nodes: {}, adjacencyList: {} };
  
  for (let i = 0; i <= GRID_SIZE; i++) {
    for (let j = 0; j <= GRID_SIZE; j++) {
      const lat = startLat + (endLat - startLat) * (i / GRID_SIZE);
      const lng = startLng + (endLng - startLng) * (j / GRID_SIZE);
      
      let noiseLat = 0, noiseLng = 0;
      if (!(i === 0 && j === 0) && !(i === GRID_SIZE && j === GRID_SIZE)) {
         noiseLat = (Math.random() - 0.5) * 0.005;
         noiseLng = (Math.random() - 0.5) * 0.005;
      }
      
      const id = `${i}_${j}`;
      graph.nodes[id] = { id, lat: lat + noiseLat, lng: lng + noiseLng };
      graph.adjacencyList[id] = [];
    }
  }

  const getDist = (lat1, lon1, lat2, lon2) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a)); 
  };

  for (let i = 0; i <= GRID_SIZE; i++) {
    for (let j = 0; j <= GRID_SIZE; j++) {
      const u = `${i}_${j}`;
      const neighbors = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1], [i+1, j+1], [i-1, j-1]];
      
      neighbors.forEach(([ni, nj]) => {
        if (ni >= 0 && ni <= GRID_SIZE && nj >= 0 && nj <= GRID_SIZE) {
          const v = `${ni}_${nj}`;
          const dist = getDist(graph.nodes[u].lat, graph.nodes[u].lng, graph.nodes[v].lat, graph.nodes[v].lng);
          const weight = dist * (1 + Math.random() * 0.2); 
          graph.adjacencyList[u].push({ node: v, weight });
        }
      });
    }
  }
  return { graph, getDist };
};

class PriorityQueue {
  constructor() { this.items = []; }
  enqueue(element, priority) {
    let contain = false;
    const qElement = { element, priority };
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > qElement.priority) {
        this.items.splice(i, 0, qElement);
        contain = true;
        break;
      }
    }
    if (!contain) this.items.push(qElement);
  }
  dequeue() { return this.items.shift(); }
  isEmpty() { return this.items.length === 0; }
}

const computeBidirectionalDijkstra = (startLat, startLng, endLat, endLng) => {
  const { graph, getDist } = generateRoadGraph(startLat, startLng, endLat, endLng);
  const startNode = '0_0';
  const endNode = '5_5';

  const forwardDist = { [startNode]: 0 };
  const backwardDist = { [endNode]: 0 };
  const forwardParent = {};
  const backwardParent = {};
  const forwardPQ = new PriorityQueue();
  const backwardPQ = new PriorityQueue();

  forwardPQ.enqueue(startNode, 0);
  backwardPQ.enqueue(endNode, 0);

  let mu = Infinity;
  let bestMeetingNode = null;

  const forwardVisited = new Set();
  const backwardVisited = new Set();

  while (!forwardPQ.isEmpty() && !backwardPQ.isEmpty()) {
    const { element: uF, priority: dF } = forwardPQ.dequeue();
    const { element: uB, priority: dB } = backwardPQ.dequeue();

    if (dF + dB >= mu) break;

    if (!forwardVisited.has(uF)) {
      forwardVisited.add(uF);
      const neighborsF = graph.adjacencyList[uF] || [];
      for (let edge of neighborsF) {
        const v = edge.node;
        const newDist = forwardDist[uF] + edge.weight;
        if (forwardDist[v] === undefined || newDist < forwardDist[v]) {
          forwardDist[v] = newDist;
          forwardParent[v] = uF;
          forwardPQ.enqueue(v, newDist);
          if (backwardVisited.has(v)) {
            if (forwardDist[v] + backwardDist[v] < mu) {
              mu = forwardDist[v] + backwardDist[v];
              bestMeetingNode = v;
            }
          }
        }
      }
    }

    if (!backwardVisited.has(uB)) {
      backwardVisited.add(uB);
      const neighborsB = graph.adjacencyList[uB] || [];
      for (let edge of neighborsB) {
        const v = edge.node;
        const newDist = backwardDist[uB] + edge.weight;
        if (backwardDist[v] === undefined || newDist < backwardDist[v]) {
          backwardDist[v] = newDist;
          backwardParent[v] = uB;
          backwardPQ.enqueue(v, newDist);
          if (forwardVisited.has(v)) {
            if (forwardDist[v] + backwardDist[v] < mu) {
              mu = forwardDist[v] + backwardDist[v];
              bestMeetingNode = v;
            }
          }
        }
      }
    }
  }

  if (!bestMeetingNode) return { path: [{lat: startLat, lng: startLng}, {lat: endLat, lng: endLng}], distance: getDist(startLat, startLng, endLat, endLng) };

  const path = [];
  let curr = bestMeetingNode;
  while (curr) { path.unshift(graph.nodes[curr]); curr = forwardParent[curr]; }
  curr = backwardParent[bestMeetingNode];
  while (curr) { path.push(graph.nodes[curr]); curr = backwardParent[curr]; }

  const alternativeRoutes = [];
  for (let i = 0; i < 2; i++) {
     const altPath = [];
     let altCurr = '0_0';
     altPath.push(graph.nodes[altCurr]);
     while(altCurr !== '5_5') {
       const neighbors = graph.adjacencyList[altCurr];
       const next = neighbors[Math.floor(Math.random() * neighbors.length)].node;
       altPath.push(graph.nodes[next]);
       if(altPath.length > 15) { altPath.push(graph.nodes['5_5']); break; } 
       altCurr = next;
     }
     alternativeRoutes.push(altPath);
  }

  return { path: path.map(n => ({ lat: n.lat, lng: n.lng })), distance: mu, alternativeRoutes };
};

const deliveryIconSvg = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`;

const AdvancedMapNavigation = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', 
    libraries,
  });

  const [map, setMap] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [shortestRoute, setShortestRoute] = useState([]);
  const [altRoutes, setAltRoutes] = useState([]);
  const [distance, setDistance] = useState(0);

  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [streetViewPosition, setStreetViewPosition] = useState(null);
  const animationRef = useRef(null);

  const pickupAutocompleteRef = useRef(null);
  const dropAutocompleteRef = useRef(null);

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const handlePickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place.geometry) {
        setPickup({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    }
  };

  const handleDropPlaceChanged = () => {
    if (dropAutocompleteRef.current) {
      const place = dropAutocompleteRef.current.getPlace();
      if (place.geometry) {
        setDrop({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    }
  };

  const calculateRoute = () => {
    if (!pickup || !drop) return;

    if (isAnimating) stopAnimation();

    const result = computeBidirectionalDijkstra(pickup.lat, pickup.lng, drop.lat, drop.lng);
    setShortestRoute(result.path);
    setAltRoutes(result.alternativeRoutes || []);
    setDistance(result.distance);

    if (map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      result.path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds);
    }
  };

  const startAnimation = () => {
    if (shortestRoute.length === 0) return;
    setIsAnimating(true);
    let step = 0;
    
    const animate = () => {
      if (step < shortestRoute.length) {
        setCurrentPosition(shortestRoute[step]);
        setStreetViewPosition(shortestRoute[step]);
        step++;
        animationRef.current = setTimeout(animate, 800); 
      } else {
        setIsAnimating(false);
      }
    };
    
    animate();
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) clearTimeout(animationRef.current);
    setCurrentPosition(null);
  };

  if (loadError) return <div className="p-8 text-red-500">Error loading maps. Check API key.</div>;
  if (!isLoaded) return <div className="p-8">Loading Maps...</div>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-800 font-sans">
      {}
      <div className="w-full md:w-1/3 p-6 bg-white shadow-xl z-10 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Navigation size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Routing</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
            <Autocomplete
              onLoad={(autoC) => (pickupAutocompleteRef.current = autoC)}
              onPlaceChanged={handlePickupPlaceChanged}
            >
              <input
                type="text"
                placeholder="Search pickup..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </Autocomplete>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Drop Location</label>
            <Autocomplete
              onLoad={(autoC) => (dropAutocompleteRef.current = autoC)}
              onPlaceChanged={handleDropPlaceChanged}
            >
              <input
                type="text"
                placeholder="Search drop..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </Autocomplete>
          </div>

          <button
            onClick={calculateRoute}
            disabled={!pickup || !drop}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapIcon size={20} /> Generate Routes
          </button>
        </div>

        {shortestRoute.length > 0 && (
          <div className="mt-8 space-y-4 animate-fade-in">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Route Details</h3>
              <p className="text-blue-800 text-sm">Shortest Distance: <strong>{distance.toFixed(2)} km</strong></p>
              <p className="text-blue-800 text-sm">Estimated ETA: <strong>{Math.ceil(distance * 3)} mins</strong></p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startAnimation}
                disabled={isAnimating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play size={20} /> Start Delivery
              </button>
              
              <button
                onClick={stopAnimation}
                disabled={!isAnimating}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
            
            <div className="mt-4">
               <h4 className="font-semibold text-sm mb-2">Legend</h4>
               <div className="flex items-center gap-2 text-sm"><div className="w-4 h-1 bg-blue-600 rounded"></div> Shortest Path</div>
               <div className="flex items-center gap-2 text-sm mt-1"><div className="w-4 h-1 bg-gray-400 rounded"></div> Alternative Routes</div>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="w-full md:w-2/3 h-[50vh] md:h-screen relative flex flex-col">
        {}
        {isAnimating && streetViewPosition && (
           <div className="h-1/3 w-full border-b-4 border-blue-600 shadow-lg relative z-20">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={streetViewPosition}
                zoom={14}
              >
                 <StreetViewPanorama
                    position={streetViewPosition}
                    visible={true}
                    options={{ disableDefaultUI: true, enableCloseButton: false }}
                 />
              </GoogleMap>
              <div className="absolute top-2 left-2 bg-black/60 text-white px-3 py-1 rounded text-xs font-bold z-30">
                LIVE STREET VIEW
              </div>
           </div>
        )}

        <div className={`w-full ${isAnimating ? 'h-2/3' : 'h-full'}`}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={pickup || center}
            zoom={12}
            options={defaultOptions}
            onLoad={handleMapLoad}
          >
            {}
            {pickup && <Marker position={pickup} label="P" />}
            
            {}
            {drop && <Marker position={drop} label="D" />}

            {}
            {altRoutes.map((route, idx) => (
              <Polyline
                key={idx}
                path={route}
                options={{ strokeColor: '#9ca3af', strokeOpacity: 0.5, strokeWeight: 3, borderStyle: 'dashed' }}
              />
            ))}

            {/* Shortest Route */}
            {shortestRoute.length > 0 && (
              <Polyline
                path={shortestRoute}
                options={{ strokeColor: '#3b82f6', strokeOpacity: 1, strokeWeight: 5 }}
              />
            )}

            {/* Delivery Boy Animated Marker */}
            {currentPosition && (
              <Marker
                position={currentPosition}
                icon={{
                  url: deliveryIconSvg,
                  scaledSize: window.google ? new window.google.maps.Size(40, 40) : null,
                  anchor: window.google ? new window.google.maps.Point(20, 20) : null
                }}
                zIndex={999}
              />
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMapNavigation;
