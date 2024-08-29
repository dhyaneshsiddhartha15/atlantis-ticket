const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],

    status: {
      type: "String", 
      default: "Booked",
    },

    dates: [
      {
        type: Date,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    promoCodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promo",   // Reference to the Promo model
        default: [],  // Default value is null
      },
    ],
    creatorId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
