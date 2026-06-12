# Delivery Management System - Frontend README

## Quick Start

### Prerequisites
- Node.js (v14+)
- Backend running on `http://localhost:5000`

### Installation
```bash
npm install
```

### Start Development Server
```bash
npm start
```

Frontend runs on `http://localhost:3000` and opens automatically in browser.

## Pages Overview

### Manager Dashboard (`/`)
- **Create Delivery**: Form to enter pickup and drop locations, set priority
- **Delivery List**: Shows all deliveries with status and assigned partner
- **Assign Partner**: Button to assign nearest partner to pending deliveries

### Partner App (`/partner`)
- **Input Delivery ID**: Enter the delivery to simulate
- **Fetch Route**: Get optimized route from backend
- **Start Delivery**: Begin 5-second interval location updates
- **Live Logs**: Terminal-style log of all updates sent

### Customer Tracking (`/customer`)
- **Track Delivery**: Enter delivery ID to monitor status
- **Live Location**: Shows latest partner location
- **Tracking History**: Full timeline of location updates
- **Route Info**: Planned route with all stops

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── services/        # API client (apiClient.js)
│   ├── styles/          # CSS files
│   ├── App.jsx          # Router & main layout
│   └── index.jsx        # React entry point
├── public/
│   └── index.html
├── package.json
└── README.md
```

## Architecture

### Components
- **DeliveryForm.jsx**: Create new deliveries with multi-drop support
- **DeliveryList.jsx**: View all deliveries and assign partners
- **PartnerApp.jsx**: Simulate partner movement with 5s updates
- **CustomerTracking.jsx**: Real-time tracking UI with history

### API Client (`services/apiClient.js`)
Centralized axios instance with two API namespaces:
- `deliveryAPI`: All delivery endpoints
- `partnerAPI`: All partner endpoints

### Styling
- Each component has matching CSS file in `/styles`
- Global styles in `App.css` and `index.css`
- Responsive design with flexbox

## Key Features
- Real-time delivery tracking
- Partner assignment with distance calculation
- Route optimization visualization
- Live location updates every 5 seconds (partner)
- Live polling every 3 seconds (customer)
- Responsive UI with clean styling

## Technologies
- React 18 - UI framework
- React Router 6 - Client-side routing
- Axios - HTTP client
- CSS3 - Styling with flexbox/grid

## Test Workflow

1. **Create Delivery**: Go to Manager Dashboard → Fill form with test coordinates
2. **Assign Partner**: Click "Assign Partner" button
3. **Simulate Movement**: Go to Partner App → Enter delivery ID → Click "Fetch Route" → "Start Delivery"
4. **Track**: Go to Customer Tracking → Enter delivery ID → Watch live updates
