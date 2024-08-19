const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const TicketType = require("../models/ticketTypesModel");
const Ticket = require("../models/ticketsModel");
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const PromoCode=require("../models/promoCode")
require("dotenv").config();
const transporter = nodemailer.createTransport({
  host:process.env.MAIL_HOST,
port: 587,
secure: false,
auth: {
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
},
});
const signature = `
    <div style="margin-left: 10px;">
        <p style="font-family: Arial, sans-serif; color: #333;"><b>Best regards,</b></p>
        <p style="font-family: Arial, sans-serif; color: #333;"><b>Atlantis</b></p>
    </div>
    <div style="display: flex; justify-content: center; align-items: center; margin-top: 10px; padding: 10px;">
    <div style="display: flex; align-items: center;">
        <img src="https://cdn2.advanceinfotech.org/doha.directory/1200x675/business/2278/futad-advertising-qatar-1657866216.webp" style="width: 100px; height: 100px; margin-right: 10px;">
        <h1 style="color: #921A40; font-size: 2rem; margin: 0;">
            <b>Atlantis</b>
        </h1>
    </div>
</div>
`;

exports.getTicketTypes = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
console.log("Event id is",eventId)
  const ticketTypes = await TicketType.find({ eventId });
console.log("Ticket Type is",ticketTypes)
  res.status(200).json({
    message: "success",
    ticketTypes,
  });
});
const applyPromoCode = async (promoCode, totalCost) => {
  if (!promoCode) return { discount: 0, message: null };

  const promo = await PromoCode.findOne({ code: promoCode, isActive: true });

  if (!promo) {
      return { discount: 0, message: "Invalid promo code." };
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
      return { discount: 0, message: "Promo code expired." };
  }

  if (promo.maxUses <= promo.currentUses) {
      return { discount: 0, message: "Promo code usage limit exceeded." };
  }

  let discount = 0;
  if (promo.discountType === 'fixed') {
      discount = promo.discountPrice;
  } else if (promo.discountType === 'percentage') {
      discount = (promo.discountPercentage / 100) * totalCost;
  }

  promo.currentUses += 1;
  await promo.save();

  return { discount, message: null };
};

exports.bookTickets = async (req, res) => {
  try {
      const { eventId, emailId, tickets, promoCode } = req.body;

      if (!eventId || !emailId || !tickets || !Array.isArray(tickets)) {
          return res.status(400).json({
              success: false,
              message: "Invalid data.",
          });
      }

      const ticketTypes = await TicketType.find({ _id: { $in: tickets.map((ticket) => ticket.type) } });
      if (ticketTypes.length !== tickets.length) {
          return res.status(400).json({ success: false, message: "Invalid tickets." });
      }

      let totalQuantity = 0, totalCost = 0;

      const ticketDetails = tickets.map((ticket) => {
          const ticketType = ticketTypes.find((type) => type._id.toString() === ticket.type.toString());
          const cost = ticketType.price * ticket.quantity;
          totalQuantity += ticket.quantity;
          totalCost += cost;
          return {
              eventId,
              type: ticket.type,
              totalCost: cost,
              quantity: ticket.quantity,
              purchaseDate: new Date(),
          };
      });

      // Apply promo code
      const { discount, message } = await applyPromoCode(promoCode, totalCost);

      if (message) {
          return res.status(400).json({ success: false, message });
      }

      totalCost -= discount;

      // Save tickets
      const event = await Event.findById(eventId);
      if (!event) {
          return res.status(404).json({ success: false, message: "Event not found." });
      }

      await Ticket.insertMany(ticketDetails);

      // Send confirmation email
      const emailContent = `
          <h3 style="font-family: Arial, sans-serif; color: #333;">
              Hello ${emailId.split("@")[0]},
         </h3>
               Thank you for purchasing tickets for ${event.name}. We are thrilled to have you join us for this exciting event.
             </p>
           <p style="font-family: Arial, sans-serif; color: #333;">
                Here are the purchase details:
            </p>
            <h4 style="font-family: Arial, sans-serif; color: #333;">
                Event Name: ${event.name}
            </h4>
            <h4 style="font-family: Arial, sans-serif; color: #333;">
                 Number Of Tickets: ${totalQuantity}
            </h4>
             <h4 style="font-family: Arial, sans-serif; color: #333;">
                 Total Amount: ${totalCost} QAR
            </h4>
             <br>
           ${signature}
          `;

      await transporter.sendMail({
          to: emailId,
          subject: `Thank you for purchasing ${event.name} tickets`,
          html: emailContent,
      });

      res.status(201).json({ message: "Ticket booked successfully", discountApplied: discount });

  } catch (error) {
      console.error("Error in booking tickets:", error);
      res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// exports.bookTickets = catchAsync(async (req, res, next) => {
//   try {
//     const { eventId, emailId, tickets, promoCode } = req.body;

//     if (!eventId || !emailId || !tickets || !Array.isArray(tickets)) {
//       return next(new AppError(400, "Invalid data"));
//     }

//     const ticketTypes = await TicketType.find({ _id: { $in: tickets.map((ticket) => ticket.type) } });
//     if (ticketTypes.length !== tickets.length) return next(new AppError(400, "Invalid tickets"));

//     let totalQuantity = 0, totalCost = 0;

//     const ticketDetails = tickets.map((ticket) => {
//       const ticketType = ticketTypes.find((type) => type._id.toString() === ticket.type.toString());
//       const cost = ticketType.price * ticket.quantity;
//       totalQuantity += ticket.quantity;
//       totalCost += cost;
//       return {
//         eventId,
//         type: ticket.type,
//         totalCost: cost,
//         quantity: ticket.quantity,
//         purchaseDate: new Date(),
//       };
//     });

//     console.log(`Total cost before discount: ${totalCost} QAR`);

//     // Apply promo code discount if provided
//     if (promoCode) {
//       const promo = await PromoCode.findOne({ code: promoCode, isActive: true });

//       if (promo) {
//         // Check if promo code has expired
//         if (promo.expiresAt && promo.expiresAt < new Date()) {
//           return next(new AppError(400, "Promo code expired"));
//         }

//         // Check if promo code usage limit is exceeded
//         if (promo.maxUses <= promo.currentUses) {
//           return next(new AppError(400, "Promo code usage limit exceeded"));
//         }

//         let discount = 0;

//         if (promo.discountType === 'fixed') {
//           discount = promo.discountPrice; // Fixed discount amount
//         } else if (promo.discountType === 'percentage') {
//           discount = (promo.discountPercentage / 100) * totalCost; // Percentage discount calculation
//         }

//         console.log(`Discount applied: ${discount} QAR`);
//         totalCost -= discount;
//         console.log(`Total cost after discount: ${totalCost} QAR`);

//         // Increment the promo code usage count
//         promo.currentUses += 1;
//         await promo.save();
//       } else {
//         return next(new AppError(400, "Invalid promo code"));
//       }
//     }

//     // Save tickets and send email
//     const event = await Event.findById(new mongoose.Types.ObjectId(eventId));
//     if (!event) {
//       return next(new AppError(404, "Event not found"));
//     }

//     // Save tickets to the database
//     await Ticket.insertMany(ticketDetails);

//     const emailContent = `
//       <h3 style="font-family: Arial, sans-serif; color: #333;">
//           Hello ${emailId.split("@")[0]},
//       </h3>
//       <p style="font-family: Arial, sans-serif; color: #333;">
//           Thank you for purchasing tickets for ${event.name}. We are thrilled to have you join us for this exciting event.
//       </p>
//       <p style="font-family: Arial, sans-serif; color: #333;">
//           Here are the purchase details:
//       </p>
//       <h4 style="font-family: Arial, sans-serif; color: #333;">
//           Event Name: ${event.name}
//       </h4>
//       <h4 style="font-family: Arial, sans-serif; color: #333;">
//           Number Of Tickets: ${totalQuantity}
//       </h4>
//       <h4 style="font-family: Arial, sans-serif; color: #333;">
//           Total Amount: ${totalCost} QAR
//       </h4>
//       <br>
//       ${signature}
//     `;

//     await transporter.sendMail({
//       to: emailId,
//       subject: `Hello ${emailId.split("@")[0]}, Thank you for purchasing ${event.name} tickets`,
//       html: emailContent,
//     });

//     res.status(201).json({ message: "Ticket booked successfully" });

//   } catch (error) {
//     console.error("Error in booking tickets:", error); // Log the error for debugging
//     return next(new AppError(500, "Internal Server Error"));
//   }
// });
// exports.applyPromoCode = catchAsync(async (req, res, next) => {
//   try {
//     const { promoCode } = req.body;
//     const { eventId } = req.params;

//     // Validate input
//     if (!eventId || !promoCode) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide eventId and promoCode."
//       });
//     }

//     // Fetch the event by ID
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found."
//       });
//     }

//     // Fetch the promo code details
//     const promo = await Promo.findOne({ code: promoCode, event: eventId });
//     if (!promo) {
//       return res.status(404).json({
//         success: false,
//         message: "Promo code not found."
//       });
//     }

//     // Check if the promo code has expired
//     const currentDate = new Date();
//     if (promo.expiresAt < currentDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Promo code has expired."
//       });
//     }

//     // Check if the promo code has been used up
//     if (promo.currentUses >= promo.maxUses) {
//       return res.status(400).json({
//         success: false,
//         message: "Promo code usage limit has been reached."
//       });
//     }

//     // Apply the promo code (adjust prices)
//     const discount = promo.discountType === 'percentage'
//       ? (promo.discountPercentage)
//       : promo.discountPrice;

//     // Assuming you have a ticket type model to fetch the specific ticket type
//     const ticketTypes = await TicketType.find({ eventId: event._id });

//     if (ticketTypes.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No ticket types found for this event."
//       });
//     }

//     let discountedPrice = 0;
//     for (const ticketType of ticketTypes) {
//       if (promo.discountType === 'percentage') {
//         discountedPrice = ticketType.price - (ticketType.price * (promo.discountPercentage / 100));
//       } else {
//         discountedPrice = ticketType.price - promo.discountPrice;
//       }

//       // Update ticket price with discounted price
//       ticketType.price = discountedPrice;
//       await ticketType.save();
//     }

//     // Increment the usage counter for the promo code
//     promo.currentUses += 1;
//     await promo.save();

//     res.status(200).json({
//       success: true,
//       message: "Promo code applied successfully.",
//       discountedPrice: discountedPrice,
//     });

//   } catch (error) {
//     console.error("Error applying promo code:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error."
//     });
//   }
// });


