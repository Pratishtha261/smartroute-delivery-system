# Delivery Management System - Copilot Instructions

## Project Overview
Full-stack delivery management system with real-time partner assignment and tracking. Two main applications:
- **Backend**: Node.js/Express REST API with MongoDB
- **Frontend**: React multi-page dashboard (Manager, Partner, Customer)

## Architecture

### Backend Structure (`/backend`)
```
src/
├── config/          # Database configuration
├── controllers/     # Business logic (deliveryController, partnerController)
├── models/          # Mongoose schemas (Partner, Delivery, Customer)
├── routes/          # API endpoints (deliveryRoutes, partnerRoutes)
├── utils/           # Helper functions (haversineDistance, routeOptimizer)
├── middleware/      # Express middleware (errorHandler)
├── scripts/         # Seed data and utilities
└── server.js        # Express app initialization
```

### Frontend Structure (`/frontend`)
```
src/
├── components/      # React components (DeliveryForm, DeliveryList, PartnerApp, CustomerTracking)
├── services/        # API clients (apiClient.js with deliveryAPI, partnerAPI)
├── styles/          # CSS modules for each component
├── pages/           # Route pages (Manager, Partner, Customer)
├── App.jsx          # Router setup with three main routes
└── index.jsx        # React entry point
```

## Critical Patterns & Conventions

### Naming Conventions
- **Collections**: PascalCase (Partner, Delivery, Customer)
- **API Routes**: kebab-case (`/api/deliveries/create`, `/api/partners`)
- **Controllers**: camelCase suffixed with `Controller` (deliveryController, partnerController)
- **Components**: PascalCase (DeliveryForm.jsx, PartnerApp.jsx)
- **Functions**: camelCase (calculateHaversineDistance, generateOptimizedRoute)
- **Files**: descriptive camelCase (deliveryController.js, haversineDistance.js)

### Database Models
**Partner**: Contains current location (lat/lng), availability, assigned delivery ID, contact info, rating
**Delivery**: Pickup location, multiple drop locations, assigned partner, route array, tracking history
**Customer**: Basic customer info linked to deliveries

### Core Algorithms
- **Haversine Formula** (`/utils/haversineDistance.js`): Calculates distance between two coordinates in km
- **Nearest-Neighbor Route** (`/utils/routeOptimizer.js`): Optimizes delivery route by always going to nearest unvisited drop

### API Patterns
- Request body validation at controller level
- Response format: `{success: boolean, data: object, message: string}`
- Error responses include status codes (404, 400, 500)
- All location data: `{latitude: number, longitude: number}`

## Key Workflows

### Delivery Creation Flow
1. Manager submits form → `POST /api/deliveries/create` with pickup + drops
2. Backend creates Delivery doc in pending status
3. Returns deliveryId for assignment

### Partner Assignment Flow
1. Manager clicks "Assign Partner" → `POST /api/deliveries/assign-partner`
2. Backend finds all available partners
3. Calculates Haversine distance from pickup to each partner's current location
4. Assigns nearest partner, marks unavailable, generates optimized route
5. Returns assigned partner + distance

### Live Tracking Flow
1. Partner app fetches route: `GET /api/deliveries/:deliveryId/route`
2. Every 5 seconds sends location update: `POST /api/deliveries/track` with lat/lng/status
3. Backend updates tracking history + partner's current location
4. Customer polling `GET /api/deliveries/:deliveryId` every 3 seconds sees live updates

## Setup & Running

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI
npm run seed              # Populate 4 demo partners
npm run dev              # Runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start                # Runs on http://localhost:3000
```

### Environment Variables (`.env`)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Backend port (default: 5000)
- `NODE_ENV`: development/production
- `CORS_ORIGIN`: Frontend URL for CORS

## Integration Points
- Frontend `apiClient.js` calls backend at `http://localhost:5000/api`
- All API calls use axios with JSON payloads
- CORS configured in `backend/src/server.js`
- Live tracking uses 5-second intervals (partner) and 3-second polling (customer)

## Common Tasks

**Create seed data**: `npm run seed` in backend directory
**Add new API endpoint**: Create method in controller, add route in routesFile, export in apiClient.js
**Add new component**: Create in `/frontend/src/components`, add route in App.jsx, create corresponding CSS file
**Update delivery status**: Use `POST /api/deliveries/track` endpoint with status parameter

## Demo Coordinates (Seeded Partners)
- Raj Kumar: 28.7041, 77.1025
- Priya Singh: 28.6139, 77.2090
- Arun Patel: 28.5355, 77.3910
- Neha Verma: 28.6328, 77.2197

Use different coordinates for test deliveries to see Haversine distance calculations and nearest-partner selection.
