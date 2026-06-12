import React, { useState, useEffect, useRef } from 'react';
import { partnerAPI } from '../services/apiClient';
import '../styles/PartnersMap.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Initialize marker icons
const partnerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const PartnersMap = () => {
  const [partners, setPartners] = useState([]);
  const [partnerAddresses, setPartnerAddresses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const fetchAddress = async (lat, lng, partnerId) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
      const data = await res.json();
      const address = data.display_name || data.address?.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setPartnerAddresses(prev => ({ ...prev, [partnerId]: address }));
    } catch (error) {
      setPartnerAddresses(prev => ({ ...prev, [partnerId]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
    }
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        initializeMap();
      } catch (error) {
        console.error('Map initialization failed:', error);
        setMessage('❌ Map initialization failed. Please refresh the page.');
      }
    }
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    fetchPartners();

    const interval = setInterval(() => {
      fetchPartners();
    }, 10000); // Refresh every 10 seconds

    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const response = await partnerAPI.getAllPartners();
      if (response.data.success) {
        const fetchedPartners = response.data.data || [];
        setPartners(fetchedPartners);
        updateMapMarkers(fetchedPartners);
        
        // Fetch addresses for partners that don't have one yet
        fetchedPartners.forEach(p => {
          if (!partnerAddresses[p._id]) {
            fetchAddress(p.currentLocation.latitude, p.currentLocation.longitude, p._id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setMessage(`❌ Error fetching partners: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current) {
      throw new Error('Map container is not mounted yet');
    }
    if (mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([28.7041, 77.1025], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);
  };

  const updateMapMarkers = (partnersList) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add new markers
    partnersList.forEach((partner) => {
      const marker = L.marker(
        [partner.currentLocation.latitude, partner.currentLocation.longitude],
        { icon: partnerIcon }
      ).addTo(mapInstanceRef.current);

      const address = partnerAddresses[partner._id] || 'Loading address...';
      marker.bindPopup(`
        <b>${partner.name}</b><br>
        Status: ${partner.isAvailable ? 'Available' : 'Busy'}<br>
        Rating: ${partner.rating}<br>
        Active Deliveries: ${partner.assignedDeliveryIds.length}/${partner.maxActiveDeliveries}<br>
        Location: ${address}
      `);
    });

    // Fit bounds if there are partners
    if (partnersList.length > 0) {
      const bounds = L.latLngBounds(
        partnersList.map(p => [p.currentLocation.latitude, p.currentLocation.longitude])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  return (
    <div className="delivery-list-container">
      <div className="header">
        <h2>Partners Map</h2>
        <button
          className="refresh-btn"
          onClick={fetchPartners}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="partners-grid">
        <div className="partners-list">
          <h3>Partners List</h3>
          {partners.length === 0 ? (
            <p>No partners found</p>
          ) : (
            partners.map((partner) => (
              <div key={partner._id} className="partner-card">
                <h4>{partner.name}</h4>
                <p><strong>Phone:</strong> {partner.phoneNumber}</p>
                <p><strong>Email:</strong> {partner.email}</p>
                <p><strong>Status:</strong> {partner.isAvailable ? 'Available' : 'Busy'}</p>
                <p><strong>Rating:</strong> {partner.rating}</p>
                <p><strong>Active Deliveries:</strong> {partner.assignedDeliveryIds.length}/{partner.maxActiveDeliveries}</p>
                <p><strong>Location:</strong> {partnerAddresses[partner._id] || 'Loading address...'}</p>
              </div>
            ))
          )}
        </div>

        <div className="map-container">
          <div ref={mapRef} style={{ height: '500px', width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PartnersMap;