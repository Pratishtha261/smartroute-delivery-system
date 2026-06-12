const express = require('express');
const router = express.Router();

const partnerController = require('../controllers/partnerController');
const Partner = require('../models/Partner');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/me/deliveries', requireAuth, requireRole('partner'), partnerController.getMyDeliveries);

router.post('/update-location', requireAuth, requireRole('partner'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const partner = await Partner.findById(req.user.partnerId);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    partner.currentLocation = { latitude, longitude };
    await partner.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', requireAuth, requireRole('manager'), partnerController.getAllPartners);

router.get('/:partnerId', requireAuth, requireRole('manager'), partnerController.getPartnerById);

router.post('/', requireAuth, requireRole('manager'), partnerController.createPartner);

router.put('/:partnerId/availability', requireAuth, requireRole('manager'), partnerController.updatePartnerAvailability);

module.exports = router;