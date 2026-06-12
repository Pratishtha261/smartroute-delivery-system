import React, { useCallback, useEffect, useRef, useState } from 'react';
import { deliveryAPI } from '../services/apiClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import '../styles/CustomerTracking.css';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const makeEquidistant = (points, stepDistanceKm = 0.005) => {
  const result = [];
  if (points.length < 2) return points;

  result.push(points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = haversineDistance(p1[0], p1[1], p2[0], p2[1]);

    if (dist > stepDistanceKm) {
      const steps = Math.ceil(dist / stepDistanceKm);
      for (let j = 1; j <= steps; j++) {
        const lat = p1[0] + (p2[0] - p1[0]) * (j / steps);
        const lng = p1[1] + (p2[1] - p1[1]) * (j / steps);
        result.push([lat, lng]);
      }
    } else {
      result.push(p2);
    }
  }
  return result;
};

const defaultMarker = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const partnerIcon = L.icon({
  iconUrl: '/scooter_icon.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  className: 'partner-icon-scooter',
});

const CustomerTracking = ({ deliveryId: propDeliveryId }) => {
  const [deliveryId, setDeliveryId] = useState(propDeliveryId || '');
  const [trackingData, setTrackingData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markerRefs = useRef([]);
  const partnerMarkerRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const pollingRef = useRef(null);
  const osrmRouteRef = useRef(null);

  const clearMapLayers = () => {
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];
    partnerMarkerRef.current?.remove();
    partnerMarkerRef.current = null;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const renderMap = useCallback((data) => {
    if (!mapRef.current || !data) return;
    clearMapLayers();

    const map = mapRef.current;
    const points = [data.pickupLocation, ...(data.dropLocations || [])].filter(Boolean);
    if (points.length === 0) return;

    const latlngs = points.map((point) => [point.latitude, point.longitude]);

    routeLayerRef.current = L.polyline(latlngs, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    const fetchOSRM = async () => {
      try {
        const waypoints = latlngs.map(ll => `${ll[1]},${ll[0]}`).join(';');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
        const json = await response.json();

        if (json.routes && json.routes.length > 0) {
          const geojsonRoute = json.routes[0].geometry;
          const roadPoints = geojsonRoute.coordinates.map(c => [c[1], c[0]]);
          osrmRouteRef.current = roadPoints;

          if (routeLayerRef.current) routeLayerRef.current.remove();

          routeLayerRef.current = L.polyline(roadPoints, {
            color: '#2563eb',
            weight: 6,
            opacity: 1.0,
          }).addTo(map);
        } else {
          osrmRouteRef.current = null;
        }
      } catch (e) {
        osrmRouteRef.current = null;
      }
    };

    fetchOSRM();

    points.forEach((point, index) => {
      const marker = L.marker([point.latitude, point.longitude], { icon: defaultMarker }).addTo(map);
      marker.bindPopup(index === 0 ? 'Pickup Location' : `Drop ${index}`).openPopup();
      markerRefs.current.push(marker);
    });

    if (data.assignedPartnerId?.currentLocation) {
      partnerMarkerRef.current = L.marker([
        data.assignedPartnerId.currentLocation.latitude,
        data.assignedPartnerId.currentLocation.longitude,
      ], { icon: partnerIcon }).addTo(map);
      const partnerTitle = data.assignedPartnerId.name || 'Delivery Partner';
      partnerMarkerRef.current.bindPopup(`${partnerTitle} (Live)`);
      markerRefs.current.push(partnerMarkerRef.current);
    }

    const bounds = L.latLngBounds(latlngs);
    if (partnerMarkerRef.current) bounds.extend(partnerMarkerRef.current.getLatLng());
    map.fitBounds(bounds, { padding: [30, 30] });
  }, []);

  const calculateDistance = useCallback((data) => {
    if (!data?.route?.length) return 0;
    let distance = 0;
    for (let i = 1; i < data.route.length; i += 1) {
      distance += haversineDistance(
        data.route[i - 1].latitude,
        data.route[i - 1].longitude,
        data.route[i].latitude,
        data.route[i].longitude
      );
    }
    return distance;
  }, []);

  const fetchTracking = useCallback(async (id) => {
    if (!id?.trim()) {
      setMessage('Please enter a Delivery ID');
      return null;
    }
    try {
      setLoading(true);
      setMessage('Loading delivery status...');
      const res = await deliveryAPI.publicTrackDelivery(id.trim());
      const data = res.data?.data;
      if (!data) {
        setMessage('Delivery not found. Check the ID and try again.');
        return null;
      }
      setTrackingData(data);
      setIsLive(['assigned', 'picked_up', 'in_transit'].includes(data.status));
      setTotalDistance(calculateDistance(data));
      setMessage('');
      return data;
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.message || error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculateDistance]);

  const startPolling = useCallback((id) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => fetchTracking(id), 5000);
  }, [fetchTracking]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    setIsAnimating(false);
    if (deliveryId) startPolling(deliveryId);
  }, [startPolling, deliveryId]);

  const startAnimation = useCallback(() => {
    if (!trackingData?.route?.length || !mapRef.current) return;

    stopPolling(); 

    let baseRoute;
    if (osrmRouteRef.current && osrmRouteRef.current.length > 0) {
      baseRoute = osrmRouteRef.current;
    } else {
      baseRoute = trackingData.route.map((stop) => [stop.latitude, stop.longitude]);
    }

    if (baseRoute.length < 2) return;

    const route = makeEquidistant(baseRoute, 0.002); 

    setIsAnimating(true);
    let index = 0;
    const animateStep = () => {
      if (!route[index] || !partnerMarkerRef.current) {
        setIsAnimating(false);
        if (deliveryId) startPolling(deliveryId);
        return;
      }
      partnerMarkerRef.current.setLatLng(route[index]);

      index += 1;
      if (index >= route.length) {
        setIsAnimating(false);
        if (deliveryId) startPolling(deliveryId);
        return;
      }
      animationTimeoutRef.current = setTimeout(animateStep, 20); 
    };

    if (!partnerMarkerRef.current) {
      partnerMarkerRef.current = L.marker(route[0], { icon: partnerIcon }).addTo(mapRef.current);
    }
    animateStep();
  }, [trackingData, stopPolling, startPolling, deliveryId]);

  const handleTrackSubmit = async (event) => {
    event.preventDefault();
    stopPolling();
    stopAnimation();
    const result = await fetchTracking(deliveryId);
    if (result && ['assigned', 'picked_up', 'in_transit'].includes(result.status)) {
      startPolling(deliveryId);
    }
  };

  useEffect(() => {
    if (trackingData && !isAnimating) {
      renderMap(trackingData);
    }
  }, [trackingData, renderMap, isAnimating]);

  useEffect(() => {
    if (trackingData && ['assigned', 'picked_up', 'in_transit'].includes(trackingData.status)) {
      
      const timer = setTimeout(() => {
        startAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [trackingData, startAnimation]);

  useEffect(() => {
    if (propDeliveryId) {
      setDeliveryId(propDeliveryId);
      fetchTracking(propDeliveryId).then((data) => {
        if (data && ['assigned', 'picked_up', 'in_transit'].includes(data.status)) {
          startPolling(propDeliveryId);
        }
      });
    }
    return () => {
      stopPolling();
      stopAnimation();
    };
  }, [propDeliveryId, fetchTracking, startPolling, stopPolling, stopAnimation]);

  const statusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="customer-tracking-container">
      <div className="tracking-content">
        <div className="tracking-left">
          <h2>Track Your Delivery</h2>
          <form className="tracking-form" onSubmit={handleTrackSubmit}>
            <input
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              placeholder="Enter Delivery ID"
              className="delivery-input"
            />
            <button type="submit" className="btn-track" disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {message && <div className="message-box error">{message}</div>}

          {trackingData && (
            <div className="tracking-info">
              <div className="status-section">
                <h4>Delivery Status</h4>
                <span className={`status-badge status-${trackingData.status}`}>{statusLabel(trackingData.status)}</span>
                <div className="priority-badge">Priority: {trackingData.priority?.toUpperCase() || 'MEDIUM'}</div>
                {isLive && <div className="live-badge">LIVE TRACKING</div>}
              </div>

              <div className="route-section">
                <h4>Route Overview</h4>
                <div className="route-item">
                  <strong>Pickup:</strong>
                  <span>{trackingData.pickupLocation?.address || `${trackingData.pickupLocation?.latitude}, ${trackingData.pickupLocation?.longitude}`}</span>
                </div>
                {trackingData.dropLocations?.map((drop, idx) => (
                  <div key={idx} className="route-item">
                    <strong>Drop {idx + 1}:</strong>
                    <span>{drop.address || `${drop.latitude}, ${drop.longitude}`}</span>
                  </div>
                ))}
              </div>

              <div className="distance-info">
                <div><strong>Estimated Distance:</strong> {totalDistance.toFixed(2)} km</div>
                <div><strong>Estimated ETA:</strong> {Math.max(5, Math.ceil(totalDistance * 3))} mins</div>
              </div>

              <div className="partner-section">
                <h4>Partner Details</h4>
                <div className="partner-card">
                  <div><strong>Name:</strong> {trackingData.assignedPartnerId?.name || 'Not assigned yet'}</div>
                  <div><strong>Phone:</strong> {trackingData.assignedPartnerId?.phoneNumber || 'N/A'}</div>
                </div>
              </div>

              <div className="navigation-controls">
                {!isAnimating ? (
                  <button type="button" className="btn-start-nav" onClick={startAnimation}>
                    Simulate Driver Route
                  </button>
                ) : (
                  <button type="button" className="btn-stop-nav" onClick={stopAnimation}>
                    Stop Simulation
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="tracking-right">
          <h3>Live Map</h3>
          <div ref={mapContainerRef} className="tracking-map" />
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
