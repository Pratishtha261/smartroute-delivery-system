import React, { useState, useEffect, useRef } from 'react';
import { deliveryAPI } from '../services/apiClient';
import '../styles/CustomerTracking.css';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const DeliveryForm = ({ onDeliveryCreated }) => {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [pickup, setPickup] = useState({ address: '', latitude: null, longitude: null, city: '' });
  const [drop, setDrop] = useState({ address: '', latitude: null, longitude: null, city: '' });
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Autocomplete Search State
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropQuery, setDropQuery] = useState('');
  const debouncedPickup = useDebounce(pickupQuery, 500);
  const debouncedDrop = useDebounce(dropQuery, 500);
  
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  // References to detect clicks outside dropdown
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target)) {
        setShowPickupSuggestions(false);
      }
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Nominatim Suggestions
  const searchAddress = async (query) => {
    if (!query || query.length < 3) return [];
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching address:', err);
      return [];
    }
  };

  // Pickup effect
  useEffect(() => {
    if (debouncedPickup && debouncedPickup !== pickup.address) {
      searchAddress(debouncedPickup).then((res) => {
        setPickupSuggestions(res);
        setShowPickupSuggestions(true);
      });
    } else {
      setPickupSuggestions([]);
    }
  }, [debouncedPickup, pickup.address]);

  // Drop effect
  useEffect(() => {
    if (debouncedDrop && debouncedDrop !== drop.address) {
      searchAddress(debouncedDrop).then((res) => {
        setDropSuggestions(res);
        setShowDropSuggestions(true);
      });
    } else {
      setDropSuggestions([]);
    }
  }, [debouncedDrop, drop.address]);

  const selectPickup = (suggestion) => {
    const newAddress = suggestion.display_name;
    setPickupQuery(newAddress);
    setPickup({
      address: newAddress,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: 'Dehradun' // Default fallback
    });
    setShowPickupSuggestions(false);
  };

  const selectDrop = (suggestion) => {
    const newAddress = suggestion.display_name;
    setDropQuery(newAddress);
    setDrop({
      address: newAddress,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: 'Dehradun'
    });
    setShowDropSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!pickup.latitude || !drop.latitude) {
      setError('Please select valid addresses from the dropdown suggestions.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        customerName: customerName,
        pickupLocation: pickup,
        dropLocations: [drop],
        priority
      };

      await deliveryAPI.createDelivery(payload);
      setMessage('Delivery created successfully!');
      
      // Reset form
      setCustomerName('');
      setPickup({ address: '', latitude: null, longitude: null, city: '' });
      setDrop({ address: '', latitude: null, longitude: null, city: '' });
      setPickupQuery('');
      setDropQuery('');
      setPriority('medium');
      
      if (onDeliveryCreated) {
        onDeliveryCreated();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  // UI Styles matching the screenshot
  const containerStyle = {
    backgroundColor: '#f3f4f6', // Light gray similar to screenshot
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const titleStyle = {
    margin: '0 0 20px 0',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827'
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    fontSize: '0.95rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const readonlyInputStyle = {
    ...inputStyle,
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    cursor: 'not-allowed'
  };

  const tipStyle = {
    fontSize: '0.85rem',
    color: '#2563eb',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const suggestionItemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.9rem',
    color: '#374151'
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Create New Delivery</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Customer Name Field */}
        <div>
          <label style={labelStyle}>Customer Name</label>
          <input 
            type="text" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="e.g. John Doe"
            style={inputStyle}
          />
        </div>

        {/* Pickup Location Field */}
        <div style={{ position: 'relative' }} ref={pickupRef}>
          <label style={labelStyle}>Pickup Location</label>
          <input 
            type="text" 
            value={pickupQuery} 
            onChange={(e) => setPickupQuery(e.target.value)} 
            required 
            placeholder="Search address..."
            style={inputStyle}
          />
          <div style={tipStyle}>
            💡 Tip: Search by street name, shop name, or area.
          </div>
          
          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <div style={dropdownStyle}>
              {pickupSuggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  style={suggestionItemStyle}
                  onClick={() => selectPickup(s)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drop-off Location Field */}
        <div style={{ position: 'relative' }} ref={dropRef}>
          <label style={labelStyle}>Drop Location</label>
          <input 
            type="text" 
            value={dropQuery} 
            onChange={(e) => setDropQuery(e.target.value)} 
            required 
            placeholder="Search address..."
            style={inputStyle}
          />
          <div style={tipStyle}>
            💡 Tip: Select the destination location.
          </div>

          {showDropSuggestions && dropSuggestions.length > 0 && (
            <div style={dropdownStyle}>
              {dropSuggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  style={suggestionItemStyle}
                  onClick={() => selectDrop(s)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Field */}
        <div>
          <label style={labelStyle}>Priority</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            padding: '14px', 
            background: loading ? '#9ca3af' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            marginTop: '8px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => { if(!loading) e.target.style.backgroundColor = '#1d4ed8' }}
          onMouseLeave={(e) => { if(!loading) e.target.style.backgroundColor = '#2563eb' }}
        >
          {loading ? 'Creating...' : 'Create Order'}
        </button>

        {message && (
          <div style={{ color: '#047857', padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ color: '#b91c1c', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default DeliveryForm;
