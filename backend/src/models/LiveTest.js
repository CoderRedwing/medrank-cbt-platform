const mongoose = require('mongoose');

const liveTestSchema = new mongoose.Schema({
  paper_ref:   { type: String, required: true, unique: true }, // "LIVE_MIX_01"
  paper_title: { type: String, required: true },
  starts_at:   { type: Date, required: true },
  ends_at:     { type: Date, required: true },
  status:      { type: String, enum: ['upcoming', 'live', 'ended'], default: 'upcoming' },
  registered_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('LiveTest', liveTestSchema);