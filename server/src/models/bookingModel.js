const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  emailId: {
    type: String,
    required: true
  },
  tickets: [{
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketType'
    },
    quantity: Number,
    totalCost: Number
  }],
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
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  visaId: String,
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;