/**
 * Run once to create the first admin account:
 *   node src/utils/seedAdmin.js
 *
 * Set these env vars first (or edit the defaults below):
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

const ADMIN = {
  name:     process.env.ADMIN_NAME ,
  email:    process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  role:     'admin',
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      console.log(`⚠  Admin already exists: ${ADMIN.email}`);
      process.exit(0);
    }

    await User.create(ADMIN);
    console.log(`Admin created: ${ADMIN.email} / password: ${ADMIN.password}`);
    console.log('   Change the password immediately after first login!');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
