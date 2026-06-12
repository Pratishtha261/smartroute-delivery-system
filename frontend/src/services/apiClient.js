import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ AUTH API ============
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ============ DELIVERY API ============
export const deliveryAPI = {
  // Manager endpoints (protected)
  createDelivery: (data) => api.post('/deliveries/create', data),
  getAllDeliveries: () => api.get('/deliveries'),
  getPrioritySummary: () => api.get('/deliveries/priority/summary'),
  getPendingByPriority: () => api.get('/deliveries/priority/pending'),
  assignPartner: (deliveryId) => api.post('/deliveries/assign-partner', { deliveryId }),
  emergencyAssignAll: () => api.post('/deliveries/emergency/assign-all'),
  
  // General endpoints
  getDeliveryById: (deliveryId) => api.get(`/deliveries/${deliveryId}`),
  getDeliveryRoute: (deliveryId) => api.get(`/deliveries/${deliveryId}/route`),
  
  // Public endpoint (NO AUTH REQUIRED)
  publicTrackDelivery: (deliveryId) => 
    axios.get(`${API_BASE_URL}/deliveries/track/${deliveryId}`),
};

// ============ PARTNER API ============
export const partnerAPI = {
  // Manager endpoints
  getAllPartners: () => api.get('/partners'),
  
  // Get assigned deliveries for current partner
  getAssignedDeliveries: () => api.get('/partners/me/deliveries'),
  
  // Update partner location and delivery status
  updateLocation: (deliveryId, latitude, longitude, status) => 
    api.post('/deliveries/track', {
      deliveryId,
      latitude,
      longitude,
      status,
    }),
  
  // Update delivery status
  updateDeliveryStatus: (deliveryId, status) => 
    api.post('/deliveries/track', { 
      deliveryId, 
      status,
      latitude: 0,  // Will be sent with real location
      longitude: 0,
    }),
};

// ============ ROUTING API ============
export const routingAPI = {
  // Compute single route with specified algorithm
  computeRoute: (startLat, startLng, endLat, endLng, algo = 'astar') =>
    api.get('/route/compute', {
      params: { startLat, startLng, endLat, endLng, algo },
    }),

  // Compare both algorithms on same route
  compareAlgorithms: (startLat, startLng, endLat, endLng) =>
    api.get('/route/compare', {
      params: { startLat, startLng, endLat, endLng },
    }),

  // Optimize multi-stop delivery route
  optimizeMultiStop: (stops) =>
    api.post('/route/optimize-multistop', { stops }),

  // Get optimized route for existing delivery
  optimizeDeliveryRoute: (deliveryId, algorithm = 'astar') =>
    api.get(`/deliveries/${deliveryId}/optimize-route`, {
      params: { algorithm },
    }),

  // Compare algorithms for existing delivery
  compareDeliveryAlgorithms: (deliveryId) =>
    api.get(`/deliveries/${deliveryId}/compare-algorithms`),
};

export default api;