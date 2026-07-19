const Notification = require('../models/Notification');

// Single user
const notifyUser = async (userId, { type, title, body = '', link = '' }) => {
  return Notification.create({ user: userId, type, title, body, link });
};

// Broadcast to many users (e.g. all students) — used for new-paper announcements
const notifyManyUsers = async (userIds, { type, title, body = '', link = '' }) => {
  const docs = userIds.map((user) => ({ user, type, title, body, link }));
  return Notification.insertMany(docs, { ordered: false });
};

module.exports = { notifyUser, notifyManyUsers };