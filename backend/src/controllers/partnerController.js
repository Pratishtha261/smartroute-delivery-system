const Partner = require('../models/Partner');
const Delivery = require('../models/Delivery');

exports.getMyDeliveries = async (req, res) => {
  try {
    const partnerId = req.user.partnerId;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner not linked",
      });
    }

    const deliveries = await Delivery.find({
      assignedPartnerId: partnerId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const newPartner = new Partner(req.body);
    const partner = await newPartner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePartnerAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const partner = await Partner.findByIdAndUpdate(
      req.params.partnerId,
      { isAvailable },
      { new: true, runValidators: true }
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};