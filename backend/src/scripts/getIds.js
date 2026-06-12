require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('../models/Partner');
const Customer = require('../models/Customer');

const getIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n--- PARTNER IDs (Use these to log into Partner App) ---');
    const partners = await Partner.find({});
    if (partners.length === 0) {
      console.log('No partners found. Run: npm run seed');
    } else {
      partners.forEach(p => console.log(`Name: ${p.name} | ID: ${p._id}`));
    }

    console.log('\n--- CUSTOMER IDs (Use these to create a delivery for a specific customer) ---');
    const customers = await Customer.find({});
    if (customers.length === 0) {
      console.log('No customers found. You can leave Customer ID blank when creating a delivery.');
    } else {
      customers.forEach(c => console.log(`Name: ${c.name} | ID: ${c._id}`));
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

getIds();
