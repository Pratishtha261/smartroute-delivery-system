const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    currentLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    assignedDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    assignedDeliveryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
      },
    ],
    maxActiveDeliveries: {
      type: Number,
      default: 3,
      min: 1,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Partner', partnerSchema);
