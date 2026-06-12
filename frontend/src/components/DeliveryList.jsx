import React, { useState, useEffect } from 'react';
import { deliveryAPI, partnerAPI } from '../services/apiClient';
import '../styles/DeliveryList.css';

const DeliveryList = ({ role = 'manager' }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [partners, setPartners] = useState([]);
  const [prioritySummary, setPrioritySummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchDeliveries();
    fetchPrioritySummary();
    fetchPartners();
    const interval = setInterval(() => {
      fetchDeliveries();
      fetchPrioritySummary();
      fetchPartners();
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const response = await deliveryAPI.getAllDeliveries();
      if (response.data.success) {
        setDeliveries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setMessage(`❌ Error fetching deliveries: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrioritySummary = async () => {
    try {
      const response = await deliveryAPI.getPrioritySummary();
      if (response.data.success) {
        setPrioritySummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching priority summary:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await partnerAPI.getAllPartners();
      if (response.data.success) {
        setPartners(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleAssignPartner = async (deliveryId) => {
    try {
      const response = await deliveryAPI.assignPartner(deliveryId);
      if (response.data.success) {
        setMessage('✅ Partner assigned successfully!');
        setTimeout(() => fetchDeliveries(), 1000);
      }
    } catch (error) {
      console.error('Error assigning partner:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setMessage(`❌ Error: ${errorMsg}`);
    }
  };

  const handleEmergencyAssignAll = async () => {
    setIsEmergencyLoading(true);
    try {
      const response = await deliveryAPI.emergencyAssignAll();
      if (response.data.success) {
        setMessage(`✅ Emergency assignment completed! ${response.data.assigned} deliveries assigned.`);
        setTimeout(() => {
          fetchDeliveries();
          fetchPrioritySummary();
        }, 1000);
      }
    } catch (error) {
      console.error('Error in emergency assignment:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setMessage(`❌ Error: ${errorMsg}`);
    } finally {
      setIsEmergencyLoading(false);
    }
  };

  const getFilteredDeliveries = () => {
    if (filterPriority === 'all') return deliveries;
    return deliveries.filter(d => d.priority === filterPriority);
  };

  const totalActiveDeliveries = deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status)).length;
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
  const availablePartnersCount = partners.filter(p => p.isAvailable).length;
  const busyPartnersCount = partners.length - availablePartnersCount;
  const assignedPartnersCount = partners.filter(p => p.assignedDeliveryIds?.length > 0).length;
  const partnerCities = [...new Set(partners.map((partner) => partner.city || 'Unknown'))];
  const topPartner = partners.reduce((best, partner) => {
    const completed = partner.completedDeliveries || 0;
    return !best || completed > (best.completedDeliveries || 0) ? partner : best;
  }, null);
  const getPartnerStatusLabel = (partner) => {
    if (partner.isAvailable) return 'Available';
    if (partner.assignedDeliveryIds?.length > 0) return 'Delivering';
    return 'Busy';
  };

  if (isLoading && deliveries.length === 0) {
    return <div className="delivery-list-container"><p>Loading deliveries...</p></div>;
  }

  const filtered = getFilteredDeliveries();

  return (
    <div className="delivery-list-container">
      <div className="dashboard-hero">
        <div>
          <h2>Delivery Operations</h2>
          <p className="dashboard-intro">A clean manager dashboard for partner activity, open orders, and delivery performance.</p>
        </div>
        <button className="btn-refresh" onClick={() => {
          fetchDeliveries();
          fetchPrioritySummary();
          fetchPartners();
        }}>
          Refresh dashboard
        </button>
      </div>

      {message && (
        <p className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <div className="dashboard-widgets">
        <div className="widget-card widget-active">
          <div className="widget-label">Active deliveries</div>
          <div className="widget-value">{totalActiveDeliveries}</div>
        </div>
        <div className="widget-card widget-available">
          <div className="widget-label">Available partners</div>
          <div className="widget-value">{availablePartnersCount}</div>
        </div>
        <div className="widget-card widget-busy">
          <div className="widget-label">Busy partners</div>
          <div className="widget-value">{busyPartnersCount}</div>
        </div>
        <div className="widget-card widget-completed">
          <div className="widget-label">Completed deliveries</div>
          <div className="widget-value">{completedDeliveries}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <main className="dashboard-main">
          {role === 'manager' && prioritySummary && (
            <div className="priority-dashboard compact">
              <div className="priority-card high">
                <strong>HIGH PRIORITY</strong>
                <p className="total">{prioritySummary.byPriority.high.total}</p>
                <small>Pending: {prioritySummary.byPriority.high.pending}</small>
                <small>Assigned: {prioritySummary.byPriority.high.assigned}</small>
              </div>
              <div className="priority-card medium">
                <strong>MEDIUM PRIORITY</strong>
                <p className="total">{prioritySummary.byPriority.medium.total}</p>
                <small>Pending: {prioritySummary.byPriority.medium.pending}</small>
                <small>Assigned: {prioritySummary.byPriority.medium.assigned}</small>
              </div>
              <div className="priority-card low">
                <strong>LOW PRIORITY</strong>
                <p className="total">{prioritySummary.byPriority.low.total}</p>
                <small>Pending: {prioritySummary.byPriority.low.pending}</small>
                <small>Assigned: {prioritySummary.byPriority.low.assigned}</small>
              </div>
              {prioritySummary.byPriority.high.pending > 0 && (
                <button
                  className="btn-emergency"
                  onClick={handleEmergencyAssignAll}
                  disabled={isEmergencyLoading}
                >
                  Emergency assign high priority ({prioritySummary.byPriority.high.pending})
                </button>
              )}
            </div>
          )}

          <div className="filter-section">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPriority('all')}
              >
                All ({deliveries.length})
              </button>
              <button 
                className={`filter-btn high ${filterPriority === 'high' ? 'active' : ''}`}
                onClick={() => setFilterPriority('high')}
              >
                High ({deliveries.filter(d => d.priority === 'high').length})
              </button>
              <button 
                className={`filter-btn medium ${filterPriority === 'medium' ? 'active' : ''}`}
                onClick={() => setFilterPriority('medium')}
              >
                Medium ({deliveries.filter(d => d.priority === 'medium').length})
              </button>
              <button 
                className={`filter-btn low ${filterPriority === 'low' ? 'active' : ''}`}
                onClick={() => setFilterPriority('low')}
              >
                Low ({deliveries.filter(d => d.priority === 'low').length})
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="no-deliveries">No deliveries with this priority. Create one to get started!</p>
          ) : (
            <div className="deliveries-grid">
              {filtered.map((delivery) => (
                <div key={delivery._id} className={`delivery-card priority-${delivery.priority}`}>
                  <div className="card-header">
                    <div>
                      <h3>{delivery.customerName || delivery.customer?.name || delivery.customerId || 'Guest'}</h3>
                      <small className="delivery-id">ID: {delivery._id}</small>
                    </div>
                    <div className="card-badges">
                      <span className={`priority-badge priority-${delivery.priority}`}>
                        {delivery.priority.toUpperCase()}
                      </span>
                      <span className={`status-badge status-${delivery.status}`}>{delivery.status}</span>
                    </div>
                  </div>

                  <div className="card-content">
                    <div className="location-info">
                      <p><strong>Pickup:</strong> {delivery.pickupLocation.address || `${delivery.pickupLocation.latitude.toFixed(4)}, ${delivery.pickupLocation.longitude.toFixed(4)}`}</p>
                    </div>

                    <div className="drop-info">
                      <p><strong>Drops:</strong> {delivery.dropLocations.length}</p>
                      {expandedId === delivery._id && (
                        <ul className="drop-list">
                          {delivery.dropLocations.map((drop, idx) => (
                            <li key={idx}>Drop {idx + 1}: {drop.address || `${drop.latitude.toFixed(4)}, ${drop.longitude.toFixed(4)}`}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="delivery-meta">
                      <span><strong>Customer:</strong> {delivery.customerName || delivery.customer?.name || delivery.customerId || 'Guest'}</span>
                      <span><strong>Created:</strong> {new Date(delivery.createdAt).toLocaleString()}</span>
                      <span><strong>Est. Delivery:</strong> {delivery.estimatedDeliveryTime ? new Date(delivery.estimatedDeliveryTime).toLocaleTimeString() : 'Pending'}</span>
                    </div>

                    {delivery.assignedPartnerId && (
                      <div className="partner-info">
                        <p><strong>Partner:</strong> {delivery.assignedPartnerId.name || 'Unknown'}</p>
                      </div>
                    )}

                    <div className="route-details">
                      <p><strong>Route:</strong> {delivery.route?.length ? `${delivery.route.length} stops` : 'Not assigned'}</p>
                      {expandedId === delivery._id && delivery.route?.length > 0 && (
                        <ul className="drop-list">
                          {delivery.route.map((stop, idx) => (
                            <li key={idx}>{stop.type === 'pickup' ? 'Pickup' : `Drop ${idx}`} - {stop.address || `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn-expand"
                        onClick={() => setExpandedId(expandedId === delivery._id ? null : delivery._id)}
                      >
                        {expandedId === delivery._id ? '▼ Hide' : '▶ Details'}
                      </button>

                      {role === 'manager' && delivery.status === 'pending' && (
                        <button
                          className={`btn-assign priority-${delivery.priority}`}
                          onClick={() => handleAssignPartner(delivery._id)}
                        >
                          Assign Partner
                        </button>
                      )}

                      {role === 'manager' && delivery.assignedPartnerId && (
                        <button className="btn-track" disabled>
                          Assigned to {delivery.assignedPartnerId.name}
                        </button>
                      )}

                      {role === 'customer' && (
                        <button className="btn-track">Track Package</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="partner-panel">
          <div className="partner-panel-card">
            <div className="partner-panel-title">
              <h3>Delivery Partners</h3>
              <p>Partner readiness, assigned orders, and city coverage at a glance.</p>
            </div>

            <div className="partner-stats-row">
              <div className="partner-stat">
                <span>Total partners</span>
                <strong>{partners.length}</strong>
              </div>
              <div className="partner-stat">
                <span>Assigned partners</span>
                <strong>{assignedPartnersCount}</strong>
              </div>
              <div className="partner-stat">
                <span>Available</span>
                <strong>{availablePartnersCount}</strong>
              </div>
              <div className="partner-stat">
                <span>Busy</span>
                <strong>{busyPartnersCount}</strong>
              </div>
            </div>

            <div className="partner-table-wrapper">
              <table className="partner-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Status</th>
                    <th>Orders</th>
                    <th>City</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner._id}>
                      <td>
                        <strong>{partner.name}</strong>
                        <div className="partner-id">{partner._id.slice(-8)}</div>
                      </td>
                      <td><span className={`partner-pill ${getPartnerStatusLabel(partner).toLowerCase()}`}>{getPartnerStatusLabel(partner)}</span></td>
                      <td>{partner.assignedDeliveryIds?.length || 0}</td>
                      <td>{partner.city || 'Unknown'}</td>
                      <td>{partner.completedDeliveries || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="partner-panel-card partner-insights-card">
            <div className="partner-panel-title">
              <h3>Partner Insights</h3>
              <p>Quick performance metrics for the delivery team.</p>
            </div>
            <div className="partner-insights-grid">
              <div className="insight-card">
                <span>Total cities covered</span>
                <strong>{partnerCities.length}</strong>
              </div>
              <div className="insight-card">
                <span>Assigned deliveries</span>
                <strong>{partners.reduce((sum, partner) => sum + (partner.assignedDeliveryIds?.length || 0), 0)}</strong>
              </div>
              <div className="insight-card">
                <span>Available partners</span>
                <strong>{availablePartnersCount}</strong>
              </div>
              <div className="insight-card">
                <span>Top completed</span>
                <strong>{topPartner ? topPartner.name : 'N/A'}</strong>
              </div>
            </div>
            <div className="partner-summary-note">
              <p><strong>Top partner:</strong> {topPartner ? `${topPartner.name} (${topPartner.completedDeliveries || 0} completed)` : 'No partner data available'}</p>
              <p><strong>Coverage:</strong> {partnerCities.join(', ') || 'None configured'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DeliveryList;
