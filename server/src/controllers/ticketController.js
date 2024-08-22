const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const TicketType = require("../models/ticketTypesModel");
const Ticket = require("../models/ticketsModel");
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const PromoCode = require("../models/promoCode");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
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
  console.log("Event id is", eventId);
  const ticketTypes = await TicketType.find({ eventId });
  console.log("Ticket Type is", ticketTypes);
  res.status(200).json({
    message: "success",
    ticketTypes,
  });
});
// bookticket.........
exports.bookTickets = catchAsync(async (req, res) => {
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
    let  discount = 0;
    
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
    // let discount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode, event: eventId});
      // console.log("promo",promo);
      // console.log("Promo code is",promoCode);
      // if(promo.applicableCategories !== promoCode.applicableCategories){
      //   return res.status(400).json({success:false, message:"promo code is not applicable"})
      // }
      if (promo) {
        if (promo.expiresAt && promo.expiresAt < new Date()) {
          return res.status(400).json({ success: false, message: "Promo code expired." });
        }
        if (promo.maxUses <= promo.currentUses) {
          return res.status(400).json({ success: false, message: "Promo code usage limit exceeded." });
        }

        // const applicableTickets = tickets.filter(ticket =>
        //   promo.applicableCategories.includes(ticketType.category)
        // );
        const applicableTickets = tickets.filter(ticket => {
          const ticketType = ticketTypes.find(type => type._id.toString() === ticket.type.toString());
          return promo.applicableCategories.includes(ticketType.category);
        });

      if (applicableTickets.length === 0) {
        return res.status(400).json({ success: false, message: "Promo code is not applicable to the selected ticket types." });
      }
      

        applicableTickets.forEach(ticket => {
        const ticketType = ticketTypes.find((type) => type._id.toString() === ticket.type.toString());
        const cost = ticketType.price * ticket.quantity;

        if (promo.discountType === 'fixed') {
          discount += promo.discountPrice;
        } else if (promo.discountType === 'percentage') {
          discount += (promo.discountPercentage / 100) * cost;
        }
      });

        promo.currentUses += 1;
        await promo.save();
      } else {
        return res.status(400).json({ success: false, message: "Invalid promo code." });
      }
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
      <p style="font-family: Arial, sans-serif; color: #333;">
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
  });