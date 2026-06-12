import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const deliveryAPI = {
  
  createDelivery: (data) => api.post('/deliveries/create', data),
  getAllDeliveries: () => api.get('/deliveries'),
  getPrioritySummary: () => api.get('/deliveries/priority/summary'),
  getPendingByPriority: () => api.get('/deliveries/priority/pending'),
  assignPartner: (deliveryId) => api.post('/deliveries/assign-partner', { deliveryId }),
  emergencyAssignAll: () => api.post('/deliveries/emergency/assign-all'),

  getDeliveryById: (deliveryId) => api.get(`/deliveries/${deliveryId}`),
  getDeliveryRoute: (deliveryId) => api.get(`/deliveries/${deliveryId}/route`),

  publicTrackDelivery: (deliveryId) => 
    axios.get(`${API_BASE_URL}/deliveries/track/${deliveryId}`),
};

export const partnerAPI = {
  
  getAllPartners: () => api.get('/partners'),

  getAssignedDeliveries: () => api.get('/partners/me/deliveries'),

  updateLocation: (deliveryId, latitude, longitude, status) => 
    api.post('/deliveries/track', {
      deliveryId,
      latitude,
      longitude,
      status,
    }),

  updateDeliveryStatus: (deliveryId, status) => 
    api.post('/deliveries/track', { 
      deliveryId, 
      status,
      latitude: 0,  
      longitude: 0,
    }),
};

export const routingAPI = {
  
  computeRoute: (startLat, startLng, endLat, endLng, algo = 'astar') =>
    api.get('/route/compute', {
      params: { startLat, startLng, endLat, endLng, algo },
    }),

  compareAlgorithms: (startLat, startLng, endLat, endLng) =>
    api.get('/route/compare', {
      params: { startLat, startLng, endLat, endLng },
    }),

  optimizeMultiStop: (stops) =>
    api.post('/route/optimize-multistop', { stops }),

  optimizeDeliveryRoute: (deliveryId, algorithm = 'astar') =>
    api.get(`/deliveries/${deliveryId}/optimize-route`, {
      params: { algorithm },
    }),

  compareDeliveryAlgorithms: (deliveryId) =>
    api.get(`/deliveries/${deliveryId}/compare-algorithms`),
};

export default api;