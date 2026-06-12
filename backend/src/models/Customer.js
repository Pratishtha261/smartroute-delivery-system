const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
