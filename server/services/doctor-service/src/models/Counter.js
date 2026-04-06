const mongoose = require('mongoose');

/**
 * Counter schema for auto-incrementing IDs
 * Used for generating unique doctor IDs (DOC-000001, DOC-000002, etc.)
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
