# Delivery Management System - Backend README

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (Atlas or local)

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delivery-system
```

### Seed Demo Data
```bash
npm run seed
```

This creates 4 demo partners in Delhi with hardcoded coordinates.

### Start Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Deliveries
- `POST /api/deliveries/create` - Create new delivery
- `POST /api/deliveries/assign-partner` - Assign nearest partner
- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries/:deliveryId` - Get specific delivery
- `GET /api/deliveries/:deliveryId/route` - Get delivery route
- `POST /api/deliveries/track` - Track delivery (live updates)

### Partners
- `GET /api/partners` - Get all partners
- `GET /api/partners/:partnerId` - Get specific partner
- `POST /api/partners` - Create new partner
- `PUT /api/partners/:partnerId/availability` - Update availability

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database config
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── middleware/      # Express middleware
│   ├── scripts/         # Seed data
│   └── server.js        # App entry point
├── package.json
├── .env.example
└── README.md
```

## Key Features
- Partner assignment using Haversine distance formula
- Optimized route using nearest-neighbor algorithm
- Real-time tracking with location history
- MongoDB persistence
- Error handling middleware
- CORS enabled for frontend

## Technologies
- Express.js - HTTP server framework
- Mongoose - MongoDB ODM
- dotenv - Environment variables
- cors - Cross-origin requests
