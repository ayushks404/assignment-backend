import mongoose from 'mongoose';

const intakeLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amountMl: {
    type: Number,
    required: true,
    min: 1
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index on user and loggedAt for quick date-range history queries
intakeLogSchema.index({ user: 1, loggedAt: 1 });

const IntakeLog = mongoose.model('IntakeLog', intakeLogSchema);

export default IntakeLog;
