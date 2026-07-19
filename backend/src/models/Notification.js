const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['new_test', 'result_ready', 'announcement', 'live_test'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body:  { type: String, default: '', maxlength: 300 },
    link:  { type: String, default: '' }, // e.g. '/tests' or '/analysis/<id>'
    read:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);