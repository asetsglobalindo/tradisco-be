const mongoose = require('mongoose');

// Visitor Schema
const visitorSchema = new mongoose.Schema({
  monthKey: { 
    type: String, 
    required: true,
    index: true 
  },
  total_visitors: { 
    type: Number, 
    default: 0 
  },
  unique_visitors: [{ 
    type: String 
  }],
  visitors_by_ip: {
    type: Map, 
    of: Number,
    default: {}
  },
  visitor_sessions: {
    type: Map, 
    of: Number,
    default: {}
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Optimize for frequent writes
  writeConcern: { 
    w: 'majority', 
    j: true 
  }
});

// Indexing for performance
visitorSchema.index({ monthKey: 1, created_at: -1 });

// Visitor Model
const VisitorModel = mongoose.model('Visitor', visitorSchema);

module.exports = VisitorModel;