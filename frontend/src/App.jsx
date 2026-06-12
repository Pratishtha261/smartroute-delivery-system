import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DeliveryForm from './components/DeliveryForm';
import DeliveryList from './components/DeliveryList';
import PartnerApp from './components/PartnerApp';
import CustomerTracking from './components/CustomerTracking';
import RoutingVisualization from './components/RoutingVisualization';
import PartnersMap from './components/PartnersMap';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Delivery Management System</h1>
      </div>
      <ul className="navbar-menu">
        {user?.role === 'manager' && (
          <>
            <li>
              <Link to="/" className="nav-link">Manager Dashboard</Link>
            </li>
            <li>
              <Link to="/partners" className="nav-link">Partners Map</Link>
            </li>
            <li>
              <Link to="/routing" className="nav-link">Route Optimization</Link>
            </li>
          </>
        )}
        {user?.role === 'partner' && (
          <li>
            <Link to="/partner" className="nav-link">Partner App</Link>
          </li>
        )}
        {user?.role === 'customer' && (
          <li>
            <Link to="/customer" className="nav-link">Customer Tracking</Link>
          </li>
        )}
        {!user && (
          <li>
            <Link to="/login" className="nav-link">Login</Link>
          </li>
        )}
        {user && (
          <li>
            <button className="nav-link logout-btn" onClick={logout}>Logout</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeliveryCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />

          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <div className="manager-dashboard dashboard">
                      <h2>Manager Dashboard</h2>
                      <p className="dashboard-subtitle">Delivery monitoring, partner availability, and order management</p>
                      <div className="dashboard-grid">
                        <div className="section full-width">
                          <DeliveryList key={refreshKey} role="manager" />
                        </div>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/partner"
                element={
                  <ProtectedRoute allowedRoles={['partner']}>
                    <div className="partner-dashboard dashboard">
                      <h2>Partner Dashboard</h2>
                      <p className="dashboard-subtitle">Track your deliveries and update status</p>
                      <PartnerApp />
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <div className="customer-dashboard dashboard">
                      <h2>Customer Dashboard</h2>
                      <p className="dashboard-subtitle">Place an order and track it on one page</p>
                      <div className="dashboard-grid">
                        <div className="section">
                          <DeliveryForm onDeliveryCreated={handleDeliveryCreated} />
                        </div>
                        <div className="section">
                          <CustomerTracking />
                        </div>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/routing"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <div className="routing-dashboard dashboard">
                      <RoutingVisualization />
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/partners"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <div className="partners-dashboard dashboard">
                      <PartnersMap />
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>&copy; 2025 Delivery Management System | All rights reserved</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
