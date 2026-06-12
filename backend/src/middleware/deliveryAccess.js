const Delivery = require('../models/Delivery');

const requireDeliveryAccess = async (req, res, next) => {
  try {
    const deliveryId = req.params.deliveryId || req.body.deliveryId;
    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'deliveryId is required' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      return res.status(400).json({ success: false, message: 'Invalid Delivery ID format. Please use the full 24-character ID.' });
    }

    const delivery = await Delivery.findById(deliveryId).populate(
      'assignedPartnerId',
      'name email phoneNumber currentLocation'
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const role = req.user?.role;
    if (role === 'manager') {
      req.delivery = delivery;
      return next();
    }

    if (role === 'partner' && req.user.partnerId) {
      if (delivery.assignedPartnerId && delivery.assignedPartnerId._id.toString() === req.user.partnerId) {
        req.delivery = delivery;
        return next();
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (role === 'customer' && req.user.customerId) {
      if (delivery.customerId && delivery.customerId.toString() === req.user.customerId) {
        req.delivery = delivery;
        return next();
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Access check failed', error: error.message });
  }
};

module.exports = { requireDeliveryAccess };
