require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const mockUsers = [
  {
    id: 'u1',
    name: 'Demo Manager',
    email: 'manager@demo.com',
    password: 'manager123',
    role: 'manager',
  },
  {
    id: 'u2',
    name: 'Demo Partner',
    email: 'partner@demo.com',
    password: 'partner123',
    role: 'partner',
    partnerId: '1',
  },
  {
    id: 'u3',
    name: 'Demo Customer',
    email: 'customer@demo.com',
    password: 'customer123',
    role: 'customer',
    customerId: 'c1',
  },
];

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      partnerId: user.partnerId || null,
      customerId: user.customerId || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing auth token' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return next();
};

const requireDeliveryAccess = (req, res, next) => {
  const deliveryId = req.params.deliveryId || req.body.deliveryId;
  const delivery = mockDeliveries.find((d) => d._id === deliveryId);
  if (!delivery) {
    return res.status(404).json({ success: false, message: 'Delivery not found' });
  }

  if (req.user.role === 'manager') {
    req.delivery = delivery;
    return next();
  }

  if (req.user.role === 'partner' && req.user.partnerId) {
    if (!delivery.assignedPartnerId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const assignedId =
      typeof delivery.assignedPartnerId === 'string'
        ? delivery.assignedPartnerId
        : delivery.assignedPartnerId._id;
    if (assignedId === req.user.partnerId) {
      req.delivery = delivery;
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (req.user.role === 'customer' && req.user.customerId) {
    if (delivery.customerId === req.user.customerId) {
      req.delivery = delivery;
      return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return res.status(403).json({ success: false, message: 'Forbidden' });
};

const mockPartners = [
  {
    _id: '1',
    name: 'Amit Sharma',
    email: 'amit.sharma@delivery.com',
    phoneNumber: '9876543210',
    currentLocation: { latitude: 30.3165, longitude: 78.0322 }, 
    city: 'Dehradun',
    isAvailable: true,
    assignedDeliveryIds: [],
    maxActiveDeliveries: 3,
    rating: 5.0,
  },
  {
    _id: '2',
    name: 'Priya Singh',
    email: 'priya.singh@delivery.com',
    phoneNumber: '9876543211',
    currentLocation: { latitude: 29.3919, longitude: 79.1108 }, 
    city: 'Nainital',
    isAvailable: true,
    assignedDeliveryIds: [],
    maxActiveDeliveries: 3,
    rating: 4.8,
  },
  {
    _id: '3',
    name: 'Rajesh Patel',
    email: 'rajesh.patel@delivery.com',
    phoneNumber: '9876543212',
    currentLocation: { latitude: 30.1388, longitude: 78.7733 }, 
    city: 'Rishikesh',
    isAvailable: true,
    assignedDeliveryIds: [],
    maxActiveDeliveries: 3,
    rating: 4.9,
  },
  {
    _id: '4',
    name: 'Neha Verma',
    email: 'neha.verma@delivery.com',
    phoneNumber: '9876543213',
    currentLocation: { latitude: 30.4456, longitude: 78.6114 }, 
    city: 'Mussoorie',
    isAvailable: true,
    assignedDeliveryIds: [],
    maxActiveDeliveries: 3,
    rating: 4.7,
  },
];

const mockCustomers = [
  {
    _id: 'c1',
    name: 'Demo Customer',
    email: 'customer@demo.com',
  },
];

let mockDeliveries = [
  
  {
    _id: '507f1f77bcf86cd799439011',
    customerId: 'c1',
    pickupLocation: { latitude: 30.3165, longitude: 78.0322 }, 
    dropLocations: [
      { latitude: 30.4456, longitude: 78.6114 } 
    ],
    assignedPartnerId: {
      _id: '1',
      name: 'Amit Sharma',
      rating: 5.0
    },
    status: 'in_transit',
    priority: 'high',
    route: [
      { latitude: 30.3165, longitude: 78.0322 },
      { latitude: 30.3250, longitude: 78.0450 },
      { latitude: 30.3400, longitude: 78.0800 },
      { latitude: 30.3800, longitude: 78.3200 },
      { latitude: 30.4200, longitude: 78.4500 },
      { latitude: 30.4456, longitude: 78.6114 }
    ],
    trackingHistory: [
      { latitude: 30.3165, longitude: 78.0322, status: 'picked_up', timestamp: new Date(Date.now() - 5 * 60000) },
      { latitude: 30.3250, longitude: 78.0450, status: 'in_transit', timestamp: new Date(Date.now() - 3 * 60000) },
      { latitude: 30.3400, longitude: 78.0800, status: 'in_transit', timestamp: new Date(Date.now() - 1 * 60000) }
    ],
    createdAt: new Date(),
  }
];
let deliveryCounter = 2;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const parseCityFromAddress = (location) => {
  if (!location) return '';
  const address = String(location.address || location.name || '').toLowerCase();
  const cities = ['dehradun', 'nainital', 'rishikesh', 'mussoorie', 'delhi', 'noida', 'gurgaon', 'mumbai', 'bangalore', 'chennai', 'kolkata'];
  for (const city of cities) {
    if (address.includes(city)) return city;
  }
  return location.city ? String(location.city).toLowerCase() : '';
};

const buildRoute = (pickupLocation, dropLocations) => [
  { ...pickupLocation, sequenceNumber: 0, type: 'pickup' },
  ...dropLocations.map((loc, idx) => ({ ...loc, sequenceNumber: idx + 1, type: 'drop' })),
];

const getRoomForCustomer = (delivery) => {
  const deliveryCity = (delivery.pickupLocation?.city || '').toLowerCase();
  const availablePartners = mockPartners.filter((p) => {
    const activeCount = Array.isArray(p.assignedDeliveryIds) ? p.assignedDeliveryIds.length : 0;
    return activeCount < (p.maxActiveDeliveries || 1);
  });

  if (availablePartners.length === 0) {
    return { partner: null, distance: null, reason: 'No available partners' };
  }

  const sameCity = availablePartners.filter((p) => p.city?.toLowerCase() === deliveryCity && deliveryCity);
  const candidates = sameCity.length > 0 ? sameCity : availablePartners;

  let nearestPartner = null;
  let minDistance = Infinity;
  for (const partner of candidates) {
    const distance = calculateHaversineDistance(
      delivery.pickupLocation.latitude,
      delivery.pickupLocation.longitude,
      partner.currentLocation.latitude,
      partner.currentLocation.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestPartner = partner;
    }
  }

  return { partner: nearestPartner, distance: minDistance, reason: sameCity.length > 0 ? 'same city' : 'nearby city' };
};

const assignPartnerToDelivery = (delivery) => {
  const { partner, distance } = getRoomForCustomer(delivery);
  if (!partner) return null;
  delivery.assignedPartnerId = partner._id;
  delivery.status = 'assigned';
  delivery.route = buildRoute(delivery.pickupLocation, delivery.dropLocations);
  if (!Array.isArray(partner.assignedDeliveryIds)) partner.assignedDeliveryIds = [];
  if (!partner.assignedDeliveryIds.includes(delivery._id)) partner.assignedDeliveryIds.push(delivery._id);
  partner.isAvailable = partner.assignedDeliveryIds.length < (partner.maxActiveDeliveries || 1);
  return { partner, distance };
};

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === String(email || '').toLowerCase() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  const token = signToken(user);
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        partnerId: user.partnerId || null,
        customerId: user.customerId || null,
      },
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, email, password, role are required' });
  }
  if (mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }
  const newUser = {
    id: `u${mockUsers.length + 1}`,
    name,
    email: email.toLowerCase(),
    password,
    role,
  };
  if (role === 'partner') {
    newUser.partnerId = mockPartners[0]?._id || '1';
  }
  if (role === 'customer') {
    newUser.customerId = mockCustomers[0]?._id || 'c1';
  }
  mockUsers.push(newUser);
  const token = signToken(newUser);
  return res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        partnerId: newUser.partnerId || null,
        customerId: newUser.customerId || null,
      },
    },
  });
});

app.post('/api/deliveries/create', requireAuth, requireRole('manager', 'customer'), (req, res) => {
  try {
    const { customerName, customerId, pickupLocation, dropLocations, priority } = req.body;

    if (!pickupLocation || !dropLocations || dropLocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location and at least one drop location are required',
      });
    }

    const normalizedPickupLocation = {
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
      address: pickupLocation.address || pickupLocation.name || '',
      city: pickupLocation.city || parseCityFromAddress(pickupLocation),
    };

    const normalizedDropLocations = dropLocations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address || loc.name || '',
      city: loc.city || parseCityFromAddress(loc),
    }));

    const newDelivery = {
      _id: deliveryCounter.toString(),
      customerName: customerName || null,
      customerId: req.user.role === 'customer' ? req.user.customerId : customerId || null,
      pickupLocation: normalizedPickupLocation,
      dropLocations: normalizedDropLocations,
      assignedPartnerId: null,
      status: 'pending',
      priority: priority || 'medium',
      route: [],
      trackingHistory: [],
      createdAt: new Date(),
    };

    if (req.user.role === 'customer') {
      const assignment = assignPartnerToDelivery(newDelivery);
      if (assignment) {
        newDelivery.assignedPartnerId = assignment.partner._id;
      }
    }

    mockDeliveries.push(newDelivery);
    deliveryCounter++;

    const responseData = {
      ...newDelivery,
      customer: mockCustomers.find((c) => c._id === newDelivery.customerId) || null,
      assignedPartnerId: newDelivery.assignedPartnerId
        ? mockPartners.find((p) => p._id === newDelivery.assignedPartnerId)
        : null,
    };

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating delivery',
      error: error.message,
    });
  }
});

app.post('/api/deliveries/assign-partner', requireAuth, requireRole('manager'), (req, res) => {
  try {
    const { deliveryId } = req.body;

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const sameCityPartners = mockPartners.filter((p) => {
      const activeCount = Array.isArray(p.assignedDeliveryIds) ? p.assignedDeliveryIds.length : 0;
      return activeCount < (p.maxActiveDeliveries || 1) && p.city?.toLowerCase() === String(delivery.pickupLocation.city || '').toLowerCase();
    });

    const candidates = sameCityPartners.length > 0 ? sameCityPartners : mockPartners.filter((p) => {
      const activeCount = Array.isArray(p.assignedDeliveryIds) ? p.assignedDeliveryIds.length : 0;
      return activeCount < (p.maxActiveDeliveries || 1);
    });

    if (candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available partners',
      });
    }

    let nearestPartner = null;
    let minDistance = Infinity;

    for (const partner of candidates) {
      const distance = calculateHaversineDistance(
        delivery.pickupLocation.latitude,
        delivery.pickupLocation.longitude,
        partner.currentLocation.latitude,
        partner.currentLocation.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPartner = partner;
      }
    }

    delivery.assignedPartnerId = nearestPartner._id;
    delivery.status = 'assigned';

    delivery.route = buildRoute(delivery.pickupLocation, delivery.dropLocations);

    if (!Array.isArray(nearestPartner.assignedDeliveryIds)) {
      nearestPartner.assignedDeliveryIds = [];
    }
    if (!nearestPartner.assignedDeliveryIds.includes(deliveryId)) {
      nearestPartner.assignedDeliveryIds.push(deliveryId);
    }
    const activeCount = nearestPartner.assignedDeliveryIds.length;
    nearestPartner.isAvailable = activeCount < (nearestPartner.maxActiveDeliveries || 1);

    res.status(200).json({
      success: true,
      message: 'Partner assigned successfully',
      data: {
        delivery,
        assignedPartner: nearestPartner,
        distance: `${minDistance.toFixed(2)} km`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning partner',
      error: error.message,
    });
  }
});

app.get('/api/deliveries', requireAuth, requireRole('manager'), (req, res) => {
  try {
    const deliveriesWithPartners = mockDeliveries.map((d) => ({
      ...d,
      customer: mockCustomers.find((c) => c._id === d.customerId) || null,
      assignedPartnerId: d.assignedPartnerId
        ? mockPartners.find((p) => p._id === d.assignedPartnerId)
        : null,
    }));

    res.status(200).json({
      success: true,
      count: deliveriesWithPartners.length,
      data: deliveriesWithPartners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: error.message,
    });
  }
});

app.get('/api/deliveries/:deliveryId', requireAuth, requireDeliveryAccess, (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const result = {
      ...delivery,
      customer: mockCustomers.find((c) => c._id === delivery.customerId) || null,
      assignedPartnerId: delivery.assignedPartnerId
        ? mockPartners.find((p) => p._id === delivery.assignedPartnerId)
        : null,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery',
      error: error.message,
    });
  }
});

app.get('/api/deliveries/:deliveryId/route', requireAuth, requireDeliveryAccess, (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        deliveryId: delivery._id,
        route: delivery.route,
        assignedPartner: delivery.assignedPartnerId
          ? mockPartners.find((p) => p._id === delivery.assignedPartnerId)
          : null,
        status: delivery.status,
        trackingHistory: delivery.trackingHistory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
    });
  }
});

app.get('/api/deliveries/me', requireAuth, requireRole('customer'), (req, res) => {
  const deliveries = mockDeliveries.filter((d) => d.customerId === req.user.customerId);
  return res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
});

app.get('/api/partners/me/deliveries', requireAuth, requireRole('partner'), (req, res) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const deliveries = mockDeliveries
    .filter((d) => {
      if (!d.assignedPartnerId) return false;
      if (typeof d.assignedPartnerId === 'string') {
        return d.assignedPartnerId === req.user.partnerId;
      }
      return d.assignedPartnerId._id === req.user.partnerId;
    })
    .map((d) => ({
      ...d,
      customer: mockCustomers.find((c) => c._id === d.customerId) || null,
    }));

  deliveries.sort((a, b) => {
    const pa = priorityOrder[a.priority] || 0;
    const pb = priorityOrder[b.priority] || 0;
    if (pb !== pa) return pb - pa;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
});

app.get('/api/deliveries/track/:deliveryId', (req, res) => {
  try {
    const { deliveryId } = req.params;
    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const assignedPartner = delivery.assignedPartnerId
      ? mockPartners.find((p) => p._id === delivery.assignedPartnerId)
      : null;

    const customer = mockCustomers.find((c) => c._id === delivery.customerId) || null;

    const responseData = {
      ...delivery,
      customer: customer,
      assignedPartnerId: assignedPartner
        ? {
            _id: assignedPartner._id,
            name: assignedPartner.name,
            email: assignedPartner.email,
            phoneNumber: assignedPartner.phoneNumber,
            currentLocation: assignedPartner.currentLocation,
          }
        : null,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching delivery tracking data',
      error: error.message,
    });
  }
});

app.post('/api/deliveries/track', requireAuth, requireRole('partner'), requireDeliveryAccess, (req, res) => {
  try {
    const { deliveryId, latitude, longitude, status } = req.body;

    if (!deliveryId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'deliveryId, latitude, and longitude are required',
      });
    }

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    delivery.trackingHistory.push({
      latitude,
      longitude,
      status: status || delivery.status,
      timestamp: new Date(),
    });

    if (status) {
      delivery.status = status;
    }

    if (delivery.assignedPartnerId) {
      const partner = mockPartners.find((p) => p._id === delivery.assignedPartnerId);
      if (partner) {
        partner.currentLocation = { latitude, longitude };
        if (status === 'delivered') {
          partner.assignedDeliveryIds = (partner.assignedDeliveryIds || []).filter(
            (id) => id !== delivery._id
          );
          const activeCount = partner.assignedDeliveryIds.length;
          partner.isAvailable = activeCount < (partner.maxActiveDeliveries || 1);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking update received',
      data: {
        deliveryId: delivery._id,
        status: delivery.status,
        location: { latitude, longitude },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking delivery',
      error: error.message,
    });
  }
});

app.get('/api/partners', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: mockPartners.length,
      data: mockPartners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching partners',
      error: error.message,
    });
  }
});

app.get('/api/route/compute', (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, algo = 'astar' } = req.query;

    const coords = [startLat, startLng, endLat, endLng].map(parseFloat);
    if (coords.some((c) => isNaN(c))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. All must be numbers.',
      });
    }

    const path = [
      { latitude: parseFloat(startLat), longitude: parseFloat(startLng) },
      { latitude: parseFloat(endLat), longitude: parseFloat(endLng) },
    ];

    const distance = calculateHaversineDistance(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    );

    const stats = {
      nodesExplored: algo === 'astar' ? 15 : 12,
      executionTime: algo === 'astar' ? 2.5 : 3.1,
    };

    res.json({
      success: true,
      data: {
        algorithm: algo,
        path: path,
        distance: parseFloat(distance.toFixed(2)),
        estimatedTime: Math.ceil(distance / 40 * 60), 
        stats: stats,
        executionTime: stats.executionTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error computing route',
      error: error.message,
    });
  }
});

app.get('/api/route/compare', (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    const coords = [startLat, startLng, endLat, endLng].map(parseFloat);
    if (coords.some((c) => isNaN(c))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. All must be numbers.',
      });
    }

    const distance = calculateHaversineDistance(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    );

    const astarResult = {
      algorithm: 'astar',
      path: [
        { latitude: parseFloat(startLat), longitude: parseFloat(startLng) },
        { latitude: parseFloat(endLat), longitude: parseFloat(endLng) },
      ],
      distance: parseFloat(distance.toFixed(2)),
      estimatedTime: Math.ceil(distance / 40 * 60),
      stats: { nodesExplored: 15, executionTime: 2.5 },
      executionTime: 2.5,
    };

    const bidirectionalResult = {
      algorithm: 'bidirectional',
      path: [
        { latitude: parseFloat(startLat), longitude: parseFloat(startLng) },
        { latitude: parseFloat(endLat), longitude: parseFloat(endLng) },
      ],
      distance: parseFloat(distance.toFixed(2)),
      estimatedTime: Math.ceil(distance / 40 * 60),
      stats: { nodesExplored: 12, executionTime: 3.1 },
      executionTime: 3.1,
    };

    res.json({
      success: true,
      data: {
        astar: astarResult,
        bidirectional: bidirectionalResult,
        recommendation: astarResult.executionTime < bidirectionalResult.executionTime ? 'astar' : 'bidirectional',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing algorithms',
      error: error.message,
    });
  }
});

app.post('/api/route/optimize-multistop', (req, res) => {
  try {
    const { stops } = req.body;

    if (!Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 stops required',
      });
    }

    const optimizedRoute = stops.map((stop, index) => ({
      ...stop,
      sequenceNumber: index,
    }));

    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude
      );
    }

    res.json({
      success: true,
      data: {
        algorithm: 'astar',
        optimizedRoute: optimizedRoute,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        estimatedTime: Math.ceil(totalDistance / 40 * 60),
        stats: { nodesExplored: 25, executionTime: 4.2 },
        executionTime: 4.2,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing multi-stop route',
      error: error.message,
    });
  }
});

app.get('/api/deliveries/:deliveryId/optimize-route', (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { algorithm = 'astar' } = req.query;

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const route = [
      { ...delivery.pickupLocation, sequenceNumber: 0, type: 'pickup' },
      ...delivery.dropLocations.map((loc, idx) => ({
        ...loc,
        sequenceNumber: idx + 1,
        type: 'drop',
      })),
    ];

    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        route[i].latitude,
        route[i].longitude,
        route[i + 1].latitude,
        route[i + 1].longitude
      );
    }

    res.json({
      success: true,
      data: {
        deliveryId: delivery._id,
        algorithm: algorithm,
        optimizedRoute: route,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        estimatedTime: Math.ceil(totalDistance / 40 * 60),
        stats: { nodesExplored: 20, executionTime: 3.5 },
        executionTime: 3.5,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing delivery route',
      error: error.message,
    });
  }
});

app.get('/api/deliveries/:deliveryId/compare-algorithms', (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = mockDeliveries.find((d) => d._id === deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const route = [
      { ...delivery.pickupLocation, sequenceNumber: 0, type: 'pickup' },
      ...delivery.dropLocations.map((loc, idx) => ({
        ...loc,
        sequenceNumber: idx + 1,
        type: 'drop',
      })),
    ];

    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        route[i].latitude,
        route[i].longitude,
        route[i + 1].latitude,
        route[i + 1].longitude
      );
    }

    const astarResult = {
      algorithm: 'astar',
      optimizedRoute: route,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      estimatedTime: Math.ceil(totalDistance / 40 * 60),
      stats: { nodesExplored: 20, executionTime: 3.5 },
      executionTime: 3.5,
    };

    const bidirectionalResult = {
      algorithm: 'bidirectional',
      optimizedRoute: route,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      estimatedTime: Math.ceil(totalDistance / 40 * 60),
      stats: { nodesExplored: 18, executionTime: 4.1 },
      executionTime: 4.1,
    };

    res.json({
      success: true,
      data: {
        deliveryId: delivery._id,
        astar: astarResult,
        bidirectional: bidirectionalResult,
        recommendation: 'astar',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing delivery algorithms',
      error: error.message,
    });
  }
});

app.post('/api/partners/update-location', requireAuth, requireRole('partner'), (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const partner = mockPartners.find((p) => p._id === req.user.partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }

    partner.currentLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        partnerId: partner._id,
        currentLocation: partner.currentLocation,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message,
    });
  }
});

app.get('/api/partner/earnings', requireAuth, requireRole('partner'), (req, res) => {
  res.json({
    success: true,
    data: {
      todayEarnings: 450,
      totalDeliveries: 42,
      completedOrders: 12
    }
  });
});

app.post('/api/partner/accept', requireAuth, requireRole('partner'), (req, res) => {
  try {
    const { deliveryId, action } = req.body;
    const delivery = mockDeliveries.find(d => d._id === deliveryId);
    
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (action === 'accept') {
      delivery.status = 'accepted';
      delivery.trackingHistory.push({
        status: 'accepted',
        timestamp: new Date()
      });
    } else if (action === 'reject') {
      delivery.assignedPartnerId = null;
      delivery.status = 'pending';
      const partner = mockPartners.find((p) => p._id === req.user.partnerId);
      if (partner && partner.assignedDeliveryIds) {
        partner.assignedDeliveryIds = partner.assignedDeliveryIds.filter(id => id !== deliveryId);
      }
    }

    res.json({ success: true, message: `Delivery ${action}ed` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating delivery' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Mock Server running on http://localhost:${PORT}`);
  console.log('📦 4 demo partners loaded');
  console.log('🚀 Ready to test!');
});
