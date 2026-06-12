const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
    },
    pickupLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: String,
    },
    dropLocations: [
      {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
        address: String,
        customerId: {
          type: String,
        },
      },
    ],
    assignedPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    route: [
      {
        latitude: Number,
        longitude: Number,
        sequenceNumber: Number,
      },
    ],
    trackingHistory: [
      {
        latitude: Number,
        longitude: Number,
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        distance: Number,
      },
    ],
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
