const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Customer = require('../models/Customer');

const signToken = (user) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    partnerId: user.partnerId ? user.partnerId.toString() : null,
    customerId: user.customerId ? user.customerId.toString() : null,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, partnerId, customerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password, role are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    let linkedPartnerId = partnerId || null;
    let linkedCustomerId = customerId || null;

    if (role === 'partner' && !linkedPartnerId) {
      let existingPartner = await Partner.findOne({ email: email.toLowerCase() });
      if (!existingPartner) {
        existingPartner = await Partner.create({
          name,
          email: email.toLowerCase(),
          phoneNumber: '0000000000', 
          currentLocation: { latitude: 28.6139, longitude: 77.2090 },
          isAvailable: true,
        });
      }
      linkedPartnerId = existingPartner._id;
    }

    if (role === 'customer' && !linkedCustomerId) {
      let existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
      if (!existingCustomer) {
        existingCustomer = await Customer.create({
          name,
          email: email.toLowerCase(),
          phoneNumber: '0000000000',
        });
      }
      linkedCustomerId = existingCustomer._id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      partnerId: linkedPartnerId,
      customerId: linkedCustomerId,
    });

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: {
        token,
        user: { id: user._id, name: user.name, role: user.role, partnerId: user.partnerId, customerId: user.customerId },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists in our system.' });
    }
    return res.status(500).json({ success: false, message: 'Register failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: { id: user._id, name: user.name, role: user.role, partnerId: user.partnerId, customerId: user.customerId },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};
