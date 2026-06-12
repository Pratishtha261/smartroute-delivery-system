# Phase 1 Project Report (Delivery Management System)

## Team Roles (Use Placeholder Names)
1. Member X: Backend Lead
- API design and implementation
- Partner assignment and tracking logic
- Route optimization logic

2. Member Y: Manager Dashboard (Frontend)
- Create delivery form
- Delivery list and assignment UI
- Manager workflow testing

3. Member Z: Partner App (Frontend)
- Partner route view and live tracking UI
- Delivery simulation and logs
- Navigation controls

4. Member W: Customer Tracking + Documentation
- Customer live tracking view
- Route display and status timeline
- Documentation and phase report

## Six Most Important Files (Showcase-Ready)
These are the key files you can show to the teacher to explain your individual parts.

1) Backend - Delivery Controller  
File: backend/src/controllers/deliveryController.js  
Purpose: Core business logic for delivery creation, partner assignment, optimized route, and tracking.
```js
// Assign partner and generate optimized route
const route = generateOptimizedRoute(
  delivery.pickupLocation,
  delivery.dropLocations
);
delivery.route = route;

// Tracking update
delivery.trackingHistory.push({
  latitude,
  longitude,
  status: status || delivery.status,
  timestamp: new Date(),
});
```

2) Backend - Route Optimizer  
File: backend/src/utils/routeOptimizer.js  
Purpose: Optimizes drop order using nearest-neighbor algorithm.
```js
while (unvisited.length > 0) {
  let nearestIndex = 0;
  let minDistance = Infinity;
  for (let i = 0; i < unvisited.length; i++) {
    const distance = calculateHaversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      unvisited[i].latitude,
      unvisited[i].longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }
  const nextLocation = unvisited[nearestIndex];
  route.push({ ...nextLocation, sequenceNumber, type: 'drop', distance: minDistance });
  currentLocation = nextLocation;
  unvisited.splice(nearestIndex, 1);
  sequenceNumber++;
}
```

3) Backend - Delivery Model  
File: backend/src/models/Delivery.js  
Purpose: Central schema for deliveries, locations, priority, and tracking history.
```js
priority: {
  type: String,
  enum: ['low', 'medium', 'high'],
  default: 'medium',
},
trackingHistory: [
  {
    latitude: Number,
    longitude: Number,
    status: String,
    timestamp: { type: Date, default: Date.now },
  },
],
```

4) Frontend - Manager Delivery Form  
File: frontend/src/components/DeliveryForm.jsx  
Purpose: Manager creates deliveries (pickup, drops, priority, customer).
```jsx
const submitData = {
  customerId: formData.customerId || undefined,
  pickupLocation: {
    latitude: parseFloat(formData.pickupLocation.latitude),
    longitude: parseFloat(formData.pickupLocation.longitude),
  },
  dropLocations: formData.dropLocations.map((drop) => ({
    latitude: parseFloat(drop.latitude),
    longitude: parseFloat(drop.longitude),
  })),
  priority: formData.priority,
};
```

5) Frontend - Partner App  
File: frontend/src/components/PartnerApp.jsx  
Purpose: Partner view, tracking simulation, navigation, and priority list.
```jsx
const loadMyDeliveries = async () => {
  const response = await partnerAPI.getMyDeliveries();
  if (response.data.success) {
    setMyDeliveries(response.data.data || []);
  }
};
```

6) Frontend - Customer Tracking  
File: frontend/src/components/CustomerTracking.jsx  
Purpose: Customer tracking view with live map and "My Deliveries".
```jsx
const loadMyDeliveries = async () => {
  const response = await deliveryAPI.getMyDeliveries();
  if (response.data.success) {
    setMyDeliveries(response.data.data || []);
  }
};
```

## Future Optimizations (Phase 2/End Term)
- Replace nearest-neighbor with advanced routing (OR-Tools or Maps API)
- WebSockets for real-time updates (no polling)
- ETA calculation and traffic-aware routing
- More secure auth (refresh tokens + audit logs)
- Partner load balancing for multiple orders
- Analytics dashboard for manager

