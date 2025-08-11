const mongoose = require('mongoose');

const GlobalIpSchema = new mongoose.Schema({
  value: { type: String, required: true }, // "49.36.12.101" or "103.88.12.0/24"
  label: { type: String, trim: true },
  active: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

GlobalIpSchema.index({ active: 1, value: 1 }, { unique: false });

module.exports = mongoose.model('GlobalIp', GlobalIpSchema);
