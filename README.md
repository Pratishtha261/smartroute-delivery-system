# SmartRoute: A Web-Based Intelligent Delivery Optimization System

SmartRoute is a full-stack delivery management and logistics optimization system. It features real-time delivery partner assignment, simulated live location tracking, interactive maps, and routing path optimization using custom implementations of the A* and Bidirectional Dijkstra algorithms.

---

##  Key Features

*   **Intelligent Auto-Assignment:** Automatically assigns new deliveries to the nearest available delivery partner using the **Haversine formula** to calculate distance.
*   **Real-Time Simulation & Tracking:**
    *   **Partner Dashboard:** Simulates GPS movement on a map, sending location updates to the backend every 5 seconds.
    *   **Customer Tracking Portal:** A public, authentication-free tracking page that polls the backend every 3 seconds to animate the partner's location on an interactive map.
*   **Advanced Route Optimization:** 
    *   Computes optimal delivery routes using a custom geographic **A* Search algorithm** (with a Haversine heuristic) and **Bidirectional Dijkstra**.
    *   Provides side-by-side performance metrics comparison (execution time, nodes explored, distance) and automatically recommends the most efficient algorithm.
*   **Interactive Maps:** Built with Leaflet.js to render pickup points, drop coordinates, live moving courier markers, and polyline paths.
*   **Geocoding Address Search:** Supports full address search with location context and a "Pick on Map" coordinate selector.

---

##  Tech Stack

*   **Backend:** Node.js, Express, MongoDB (Mongoose)
*   **Frontend:** React (Vite/CRA), Leaflet.js (for maps), Axios, TailwindCSS / Vanilla CSS
*   **Algorithms:** Haversine Distance Formula, A* Pathfinding, Bidirectional Dijkstra Search

---

## Project Structure

```text
MAJORPROJECT/
├── backend/              # Node.js/Express API Server
│   ├── src/
│   │   ├── config/       # Database configuration (MongoDB)
│   │   ├── controllers/  # Controller logic (deliveries, partners, routing)
│   │   ├── middleware/   # Request authorization and error handling
│   │   ├── models/       # Mongoose Schemas (Partner, Delivery, Customer, User)
│   │   ├── routes/       # API endpoint definitions
│   │   ├── utils/        # Algorithm implementations (astar, bidirectional, haversine)
│   │   └── server.js     # Entry point
│   └── package.json
│
├── frontend/             # React Client Application
│   ├── src/
│   │   ├── components/   # DeliveryForm, DeliveryList, PartnerApp, CustomerTracking
│   │   ├── services/     # API Client (apiClient.js)
│   │   ├── styles/       # Component-specific styling
│   │   └── App.jsx       # App Routing & navigation
│   └── package.json
│
└── scripts/              # Verification and testing tools
    └── test-routing.js   # Route optimization algorithm test script
```

---

##  Quick Setup

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com/) installed and running.

### 2. Backend Setup


```bash
cd backend
npm install

# Copy environment variables file and configure your MONGO_URI and JWT_SECRET
cp .env.example .env
npm run seed
npm run dev
```

### 3. Frontend Setup


```bash
cd ../frontend
npm install
npm start  
```

---

##  Test Credentials & Flow

### Default Accounts
*   **Manager:** `manager@test.com` / `password`
*   **Partner:** `partner@test.com` / `password`
*   **Customer:** `customer@test.com` / `password`

### Recommended Walkthrough Flow
1.  **Login as Manager:** Navigate to the Manager Dashboard and create a new delivery order. Specify the pickup and drop-off coordinates (you can also search for locations or select them directly on the interactive map).
2.  **Verify Nearest Assignment:** The system immediately calculates distances and assigns the order to the closest available partner.
3.  **Login as Partner:** Access the Partner App. Locate the assigned order, view the optimized route, and click **"Start Tracking"** to begin the live GPS simulation.
4.  **Track as Customer:** Go to the Customer Tracking view, enter the generated `Delivery ID`, and watch the partner's blue marker move along the route in real-time.

---

## 🔗 Key API Endpoints

### Manager Actions
*   `POST /api/deliveries/create` - Create a delivery and auto-assign nearest partner.
*   `GET /api/deliveries` - Fetch all deliveries.

### Partner Actions
*   `GET /api/partners/me/deliveries` - Fetch assigned deliveries.
*   `POST /api/deliveries/track` - Update tracking coordinates and status.

### Public Customer Tracking (No Auth)
*   `GET /api/deliveries/track/:deliveryId` - Live status and coordinates for customer map.

### Route Optimization
*   `GET /api/route/compute` - Compute route with chosen algorithm.
*   `GET /api/route/compare` - Compare A* and Bidirectional Dijkstra performance.
