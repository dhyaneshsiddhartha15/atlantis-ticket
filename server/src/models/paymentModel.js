const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  emailId: {
    type: String,
    required: true,
    trim: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  keyId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  skipCashPaymentId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
