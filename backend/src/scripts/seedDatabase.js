require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('../models/Partner');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing partners
    await Partner.deleteMany({});
    console.log('Cleared existing partners');

    // Create demo partners with hardcoded locations
    const partners = [
      {
        name: 'Raj Kumar',
        email: 'raj.kumar@delivery.com',
        phoneNumber: '9876543210',
        currentLocation: {
          latitude: 28.7041,
          longitude: 77.1025,
        },
        isAvailable: true,
        totalDeliveries: 0,
        rating: 5.0,
      },
      {
        name: 'Priya Singh',
        email: 'priya.singh@delivery.com',
        phoneNumber: '9876543211',
        currentLocation: {
          latitude: 28.6139,
          longitude: 77.2090,
        },
        isAvailable: true,
        totalDeliveries: 0,
        rating: 4.8,
      },
      {
        name: 'Arun Patel',
        email: 'arun.patel@delivery.com',
        phoneNumber: '9876543212',
        currentLocation: {
          latitude: 28.5355,
          longitude: 77.3910,
        },
        isAvailable: true,
        totalDeliveries: 0,
        rating: 4.9,
      },
      {
        name: 'Neha Verma',
        email: 'neha.verma@delivery.com',
        phoneNumber: '9876543213',
        currentLocation: {
          latitude: 28.6328,
          longitude: 77.2197,
        },
        isAvailable: true,
        totalDeliveries: 0,
        rating: 4.7,
      },
    ];

    const createdPartners = await Partner.insertMany(partners);
    console.log(`Created ${createdPartners.length} partners`);

    createdPartners.forEach((partner) => {
      console.log(`- ${partner.name} (${partner.email}) at (${partner.currentLocation.latitude}, ${partner.currentLocation.longitude})`);
    });

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
