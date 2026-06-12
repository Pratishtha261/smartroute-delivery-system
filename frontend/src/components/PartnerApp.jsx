import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/PartnerApp.css';

const API = 'http://localhost:5000';

const defaultMarkerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const partnerIcon = L.icon({
  iconUrl: '/scooter_icon.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const pickupIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  className: 'pickup-marker',
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateTotalDistance = (route) => {
  if (!route || route.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < route.length; i += 1) {
    total += calculateDistance(route[i - 1].latitude, route[i - 1].longitude, route[i].latitude, route[i].longitude);
  }
  return total;
};

export default function PartnerApp() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [error, setError] = useState('');
  const [reachedLocation, setReachedLocation] = useState(false);

  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markerLayerRef = useRef([]);
  const navigationIntervalRef = useRef(null);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }), []);

  const fetchDeliveries = useCallback(async () => {
    try {
      setError('');
      const res = await axios.get(`${API}/api/partners/me/deliveries`, { headers: authHeaders() });
      const fetchedDeliveries = res.data.data || [];
      setDeliveries(fetchedDeliveries);
      
      if (selectedDelivery) {
        const updatedSelected = fetchedDeliveries.find(d => d._id === selectedDelivery._id);
        if (updatedSelected) {
          setSelectedDelivery(updatedSelected);
        } else {
          setSelectedDelivery(null);
        }
      } else if (fetchedDeliveries.length > 0) {
        setSelectedDelivery(fetchedDeliveries[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching orders.');
    }
  }, [authHeaders, selectedDelivery]);

  const updateLocation = useCallback(async (latitude, longitude) => {
    setPartnerLocation({ latitude, longitude });
    if (mapRef.current) {
      mapRef.current.panTo([latitude, longitude]);
    }
    try {
      await axios.post(`${API}/api/partners/update-location`, { latitude, longitude }, { headers: authHeaders() });
    } catch (err) {
      console.error('Failed to update location to backend');
    }
  }, [authHeaders]);

  const handleAcceptReject = async (deliveryId, action) => {
    try {
      setError('');
      await axios.post(`${API}/api/partner/accept`, { deliveryId, action }, { headers: authHeaders() });
      await fetchDeliveries();
      if (action === 'reject' && selectedDelivery?._id === deliveryId) setSelectedDelivery(null);
    } catch (err) {
      console.error(err);
      setError(`Failed to ${action} order.`);
    }
  };

  const updateStatus = async (deliveryId, status) => {
    try {
      setError('');
      await axios.post(
        `${API}/api/deliveries/track`,
        { deliveryId, status, latitude: partnerLocation?.latitude || 0, longitude: partnerLocation?.longitude || 0 },
        { headers: authHeaders() }
      );
      setReachedLocation(false);
      await fetchDeliveries();
    } catch (err) {
      console.error(err);
      setError(`Failed to update status to ${status}.`);
    }
  };

  const clearRouteLayers = () => {
    routeLayerRef.current?.remove();
    markerLayerRef.current.forEach((layer) => layer.remove());
    markerLayerRef.current = [];
  };

  const showRoute = useCallback((delivery) => {
    if (!mapRef.current) return;
    clearRouteLayers();

    const points = [];
    if (partnerLocation) {
      points.push([partnerLocation.latitude, partnerLocation.longitude]);
    }

    if (delivery.status === 'accepted' || delivery.status === 'assigned') {
      if (delivery.pickupLocation) {
        points.push([delivery.pickupLocation.latitude, delivery.pickupLocation.longitude]);
      }
    } else if (delivery.status === 'picked_up' || delivery.status === 'in_transit') {
      if (delivery.dropLocations && delivery.dropLocations.length > 0) {
        points.push([delivery.dropLocations[0].latitude, delivery.dropLocations[0].longitude]);
      }
    } else {
      
      if (delivery.pickupLocation) points.push([delivery.pickupLocation.latitude, delivery.pickupLocation.longitude]);
      delivery.dropLocations?.forEach(drop => points.push([drop.latitude, drop.longitude]));
    }

    if (points.length < 2) return;

    const drawRealRoute = async () => {
      try {
        const waypoints = points.map(ll => `${ll[1]},${ll[0]}`).join(';');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const geojsonRoute = data.routes[0].geometry;
          routeLayerRef.current = L.geoJSON(geojsonRoute, {
            style: { color: '#3b82f6', weight: 6, opacity: 0.9 }
          }).addTo(mapRef.current);
        } else {
          routeLayerRef.current = L.polyline(points, { color: '#3b82f6', weight: 6, opacity: 0.9, dashArray: '10, 10' }).addTo(mapRef.current);
        }
      } catch (e) {
        routeLayerRef.current = L.polyline(points, { color: '#3b82f6', weight: 6, opacity: 0.9, dashArray: '10, 10' }).addTo(mapRef.current);
      }
    };
    
    drawRealRoute();

    if (delivery.pickupLocation) {
      const pickupMarker = L.marker([delivery.pickupLocation.latitude, delivery.pickupLocation.longitude], { icon: pickupIcon })
        .addTo(mapRef.current).bindPopup('Pickup Location');
      markerLayerRef.current.push(pickupMarker);
    }

    delivery.dropLocations?.forEach((drop, idx) => {
      const dropMarker = L.marker([drop.latitude, drop.longitude], { icon: defaultMarkerIcon })
        .addTo(mapRef.current).bindPopup(`Drop Location`);
      markerLayerRef.current.push(dropMarker);
    });

    if (partnerLocation) {
      const partnerMarker = L.marker([partnerLocation.latitude, partnerLocation.longitude], { icon: partnerIcon, zIndexOffset: 1000 })
        .addTo(mapRef.current).bindPopup('📍 You are here');
      markerLayerRef.current.push(partnerMarker);
    }

  }, [partnerLocation]);

  useEffect(() => {
    fetchDeliveries();

    const interval = setInterval(() => {
      fetchDeliveries();
    }, 5000);

    const container = L.DomUtil.get('partner-map');
    if (container != null) {
      container._leaflet_id = null;
    }

    const mapInstance = L.map('partner-map', { zoomControl: false }).setView([28.7041, 77.1025], 10);
    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
    }).addTo(mapInstance);

    mapRef.current = mapInstance;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        
        updateLocation(30.3165, 78.0322);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      clearInterval(interval);
      navigator.geolocation.clearWatch(watchId);
      if (navigationIntervalRef.current) clearInterval(navigationIntervalRef.current);
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [fetchDeliveries, updateLocation]);

  useEffect(() => {
    if (selectedDelivery) {
      showRoute(selectedDelivery);
    }
  }, [partnerLocation, selectedDelivery, showRoute]);

  const startNavigationSimulation = (delivery) => {
    if (!partnerLocation) return;

    let target = null;
    if (delivery.status === 'accepted') {
      target = delivery.pickupLocation;
    } else if (delivery.status === 'picked_up' || delivery.status === 'in_transit') {
      target = delivery.dropLocations?.[0];
    }

    if (!target) return;

    let currentLat = partnerLocation.latitude;
    let currentLng = partnerLocation.longitude;
    const steps = 20;
    let stepCount = 0;

    const latStep = (target.latitude - currentLat) / steps;
    const lngStep = (target.longitude - currentLng) / steps;

    if (navigationIntervalRef.current) clearInterval(navigationIntervalRef.current);

    navigationIntervalRef.current = setInterval(() => {
      stepCount++;
      currentLat += latStep;
      currentLng += lngStep;
      
      updateLocation(currentLat, currentLng);
      
      if (stepCount >= steps) {
        clearInterval(navigationIntervalRef.current);
        setReachedLocation(true);
      }
    }, 500);
  };

  const renderActionButtons = (delivery) => {
    switch (delivery.status) {
      case 'assigned':
        return (
          <div className="panel-actions">
            <button onClick={(e) => { e.stopPropagation(); handleAcceptReject(delivery._id, 'accept'); }} className="btn btn-picked">Accept</button>
            <button onClick={(e) => { e.stopPropagation(); handleAcceptReject(delivery._id, 'reject'); }} className="btn" style={{backgroundColor: '#ef4444'}}>Reject</button>
          </div>
        );
      case 'accepted':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="panel-actions">
              <button onClick={() => startNavigationSimulation(delivery)} className="btn" style={{backgroundColor: '#6366f1'}}>Navigate to Pickup</button>
              <button onClick={() => alert('Calling Customer...')} className="btn" style={{backgroundColor: '#64748b'}}>Call Customer</button>
            </div>
            <div className="panel-actions" style={{ alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input type="checkbox" checked={reachedLocation} onChange={(e) => setReachedLocation(e.target.checked)} />
                Reached Pickup
              </label>
              <button 
                onClick={(e) => { e.stopPropagation(); updateStatus(delivery._id, 'picked_up'); }} 
                className="btn btn-transit" 
                disabled={!reachedLocation}
                style={{ opacity: reachedLocation ? 1 : 0.5 }}
              >
                Mark as Picked
              </button>
            </div>
          </div>
        );
      case 'picked_up':
      case 'in_transit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="panel-actions">
              <button onClick={() => startNavigationSimulation(delivery)} className="btn" style={{backgroundColor: '#6366f1'}}>Navigate to Drop</button>
              <button onClick={() => alert('Calling Customer...')} className="btn" style={{backgroundColor: '#64748b'}}>Call Customer</button>
            </div>
            <div className="panel-actions" style={{ alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                <input type="checkbox" checked={reachedLocation} onChange={(e) => setReachedLocation(e.target.checked)} />
                Reached Drop
              </label>
              <button 
                onClick={(e) => { e.stopPropagation(); updateStatus(delivery._id, 'delivered'); }} 
                className="btn btn-delivered"
                disabled={!reachedLocation}
                style={{ opacity: reachedLocation ? 1 : 0.5 }}
              >
                Mark as Delivered
              </button>
            </div>
          </div>
        );
      case 'delivered':
        return <div className="panel-actions"><button className="btn" disabled style={{backgroundColor: '#475569'}}>Completed</button></div>;
      default:
        return null;
    }
  };

  return (
    <div className="partner-dashboard">
      <nav className="partner-navbar">
        <div className="nav-brand">
          <span className="nav-logo">🛵</span>
          <h2>Partner Portal</h2>
        </div>
        <div className="nav-stats">
          <div className="stat-badge stat-active">🟢 Online</div>
        </div>
      </nav>

      {error && (
        <div style={{ background: '#ef4444', color: 'white', padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      <div className="partner-main">
        <div className="partner-sidebar">
          
          <div className="sidebar-header">
            <h3>Active Orders</h3>
          </div>
          
          <div className="deliveries-list">
            {deliveries.length === 0 ? (
              <div className="no-deliveries">Waiting for orders...</div>
            ) : (
              deliveries.map((delivery) => (
                <div
                  key={delivery._id}
                  onClick={() => setSelectedDelivery(delivery)}
                  className={`delivery-card ${selectedDelivery?._id === delivery._id ? 'selected' : ''}`}
                >
                  <div className="card-header">
                    <h4>{delivery.customerName || delivery.customer?.name || 'Guest'}</h4>
                    <span className={`status-pill status-${delivery.status}`}>{delivery.status.replace('_', ' ')}</span>
                  </div>
                  <div className="card-body">
                    <p><strong>Dist:</strong> {calculateTotalDistance(delivery.route).toFixed(1)} km</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="partner-map-area">
          <div id="partner-map" className="map-container" />

          {selectedDelivery ? (
            <div className="delivery-details-panel">
              <div className="panel-header">
                <h3>{selectedDelivery.customerName || selectedDelivery.customer?.name || 'Guest'}</h3>
                <span className="delivery-id">ID: {selectedDelivery._id.slice(-6)}</span>
              </div>
              
              <div className="panel-stats">
                <div className="panel-stat">
                  <span>Distance</span>
                  <strong>{calculateTotalDistance(selectedDelivery.route).toFixed(2)} km</strong>
                </div>
                <div className="panel-stat">
                  <span>ETA</span>
                  <strong>{Math.max(5, Math.ceil(calculateTotalDistance(selectedDelivery.route) * 3))} mins</strong>
                </div>
              </div>

              <div className="panel-address">
                {selectedDelivery.status === 'accepted' || selectedDelivery.status === 'assigned' ? (
                  <p><strong>Pickup:</strong> {selectedDelivery.pickupLocation?.address || 'Not specified'}</p>
                ) : (
                  <p><strong>Drop:</strong> {selectedDelivery.dropLocations?.[0]?.address || 'Not specified'}</p>
                )}
              </div>

              {renderActionButtons(selectedDelivery)}
            </div>
          ) : (
            <div className="delivery-details-panel" style={{ textAlign: 'center', color: '#94a3b8' }}>
              <h3>Waiting for orders...</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}