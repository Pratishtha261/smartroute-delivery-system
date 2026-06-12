# Project README

## Delivery Management System

A full-stack delivery management platform with real-time partner assignment and live tracking.

### Team Responsibilities

| Member | Module | Key Tasks |
|--------|--------|-----------|
| **Himanshi** | Backend | API setup, MongoDB, Partner assignment logic, Haversine formula |
| **Vinita** | Manager Dashboard | Create delivery form, delivery list, partner assignment UI |
| **Pratishtha** | Partner App | Route fetching, live movement simulation (5s updates), logs |
| **Shrishti** | Route Optimization, Customer Tracking, Docs | Route optimizer, customer tracking UI, documentation |

### Quick Setup

#### Backend (Himanshi)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI
npm run seed
npm run dev
```

#### Frontend (React for Vinita & Pratishtha)
```bash
cd frontend
npm install
npm start
```

### Project Structure
```
.
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── models/       # Partner, Delivery, Customer schemas
│   │   ├── controllers/  # deliveryController, partnerController
│   │   ├── routes/       # API endpoints
│   │   ├── utils/        # haversineDistance, routeOptimizer
│   │   └── server.js     # Express app
│   └── package.json
│
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # DeliveryForm, DeliveryList, PartnerApp, CustomerTracking
│   │   ├── services/     # apiClient.js
│   │   └── App.jsx       # Router with 3 pages
│   └── package.json
│
└── .github/
    └── copilot-instructions.md  # AI agent guidelines
```

### Tech Stack
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React 18, React Router 6, Axios
- **Algorithm**: Haversine distance, Nearest-neighbor route optimization
- **APIs**: RESTful JSON endpoints with CORS

### Demo Flow (50-55% target)
1. **Himanshi**: Backend + Partner assignment ready
2. **Vinita**: Create delivery in Manager Dashboard
3. **Vinita**: Click "Assign Partner" → Nearest partner assigned automatically
4. **Pratishtha**: Enter delivery ID in Partner App → Start simulation
5. **Pratishtha**: Watch live 5-second location updates in logs
6. **Shrishti** (future): Customer sees tracking in real-time

### API Examples

**Create Delivery**
```bash
POST /api/deliveries/create
{
  "pickupLocation": {"latitude": 28.7041, "longitude": 77.1025},
  "dropLocations": [{"latitude": 28.6139, "longitude": 77.2090}],
  "priority": "medium"
}
```

**Assign Partner** (uses Haversine to find nearest)
```bash
POST /api/deliveries/assign-partner
{"deliveryId": "..."}
```

**Track Delivery** (every 5 seconds from partner)
```bash
POST /api/deliveries/track
{
  "deliveryId": "...",
  "latitude": 28.6150,
  "longitude": 77.2100,
  "status": "in_transit"
}
```

### Naming Conventions
- **Models**: PascalCase (Partner, Delivery)
- **Controllers**: camelCase + "Controller" (deliveryController)
- **Routes**: kebab-case URLs (`/api/deliveries/create`)
- **Components**: PascalCase (DeliveryForm)
- **Functions**: camelCase (calculateHaversineDistance)

### Important Files
- `.github/copilot-instructions.md` - AI agent guidelines
- `backend/src/utils/haversineDistance.js` - Distance calculation
- `backend/src/utils/routeOptimizer.js` - Route optimization
- `frontend/src/services/apiClient.js` - API client for all endpoints

### For AI Agents
See `.github/copilot-instructions.md` for:
- Complete architecture overview
- API patterns and response formats
- Database schema details
- Exact setup commands
- Demo coordinates for testing
