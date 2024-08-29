const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const TicketType = require("../models/ticketTypesModel");
const Ticket = require("../models/ticketsModel");
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const PromoCode = require("../models/promoCode");
const Payment = require("../models/paymentModel");
const cryptojs = require('crypto-js');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/bookingModel");
const QRCode = require('qrcode');
const generatePaymentRequestSKIP = require("../utils/generatePaymentSKIP");
require("dotenv").config();

const paymentGatewayDetails = {
  sandboxURL: "https://skipcashtest.azurewebsites.net",
  productionURL: "https://api.skipcash.app",
  secretKey: process.env.SKIP_CASH_KEY_SECRET,
  keyId: process.env.SKIP_CASH_KEY_ID,
  clientId: process.env.SKIP_CASH_CLIENT_ID,
};

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const calculateSignature = (payload, secretKey) => {
  const combinedData = Object.keys(payload)
      .sort()
      .map(key => `${key}=${payload[key]}`)
      .join(',');
      
  const hash = cryptojs.HmacSHA256(combinedData, secretKey);
  return cryptojs.enc.Base64.stringify(hash);
};

const Emailsignature = `
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

exports.bookTickets = catchAsync(async (req, res) => {
    const { eventId, emailId, tickets, promoCode } = req.body;
  
    if (!eventId || !emailId || !tickets || !Array.isArray(tickets)) {
        return res.status(400).json({
            success: false,
            message: "Invalid data.",
        });
    }

    const ticketTypes = await TicketType.find({ _id: { $in: tickets.map(ticket => ticket.type) } });
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
    let discount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode, event: eventId});
      if (promo) {
        if (promo.expiresAt && promo.expiresAt < new Date()) {
          return res.status(400).json({ success: false, message: "Promo code expired." });
        }
        if (promo.maxUses <= promo.currentUses) {
          return res.status(400).json({ success: false, message: "Promo code usage limit exceeded." });
        }

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
  
    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).json({ success: false, message: "Event not found." });
    }

    const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const paymentDetails = {
        Uid: uuidv4(),
        KeyId: paymentGatewayDetails.keyId,
        Amount: totalCost.toFixed(2),
        FirstName: emailId.split("@")[0],
        LastName: "User", 
        Phone: "1234567890", 
        Email: emailId,
        TransactionId: transactionId,
        Custom1: "ticket-booking",
    };

    try {
        const paymentResult = await generatePaymentRequestSKIP(paymentDetails);
        const payUrl = paymentResult.payUrl;
        console.log("Pay Url is ", payUrl);
        if (!payUrl) {
            return res.status(500).json({ message: "Failed to generate payment URL" });
        }

        const booking = new Booking({
            eventId,
            emailId,
            tickets: ticketDetails,
            totalCost,
            discount,
            transactionId,
            paymentStatus: 'Pending',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await booking.save();
        setTimeout(() => cancelBooking(booking._id), 15 * 60 * 1000);

        const emailContent = `
       <h3 style="font-family: Arial, sans-serif; color: #333;">
           Hello ${emailId.split("@")[0]},
         </h3>
        <p style="font-family: Arial, sans-serif; color: #333;">
           Thank you for booking tickets for ${event.name}. We are thrilled to have you join us for this exciting event.
      </p>
           <p style="font-family: Arial, sans-serif; color: #333;">
           Here are the booking details:
           </p>
         <h4 style="font-family: Arial, sans-serif; color: #333;">
             Event Name: ${event.name}
           </h4>
           <h4 style="font-family: Arial, sans-serif; color: #333;">
             Number Of Tickets: ${totalQuantity}
         </h4>
            Total Amount: ${totalCost} QAR
               </h4>
               <p style="font-family: Arial, sans-serif; color: #333;">
                To complete your payment, please click on the following link:
                <a href="${payUrl}" style="color: #007bff;">Complete Payment</a>
            </p>
            <p style="font-family: Arial, sans-serif; color: #333;">
                Please note that your booking will be automatically cancelled if payment is not completed within 15 minutes.
            </p>
           </p>
               <br>
                ${Emailsignature}
              `;
        
           await transporter.sendMail({
              to: emailId,
              subject: `TICKET BOOKED: Complete your payment for ${event.name} tickets`,
              html: emailContent,
             });

        res.status(201).json({
            message: "Ticket booked successfully",
            discountApplied: discount,
            payUrl: payUrl, 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Booking failed", error: error.message });
    }
});

const cancelBooking = async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (booking && booking.paymentStatus === 'Pending') {
        booking.paymentStatus = 'Cancelled';
        await booking.save();

        const event = await Event.findById(booking.eventId);
        const emailContent = `
    <h3 style="font-family: Arial, sans-serif; color: #333;">
    Hello ${booking.emailId.split("@")[0]},
    </h3>
    <p style="font-family: Arial, sans-serif; color: #333;">
        We regret to inform you that your booking for ${event.name} has been cancelled due to incomplete payment.
    </p>
    <p style="font-family: Arial, sans-serif; color: #333;">
        If you still wish to attend the event, please make a new booking.
    </p>
    <br>
    ${Emailsignature}
`;

        await transporter.sendMail({
            to: booking.emailId,
            subject: `Booking Cancelled: ${event.name}`,
            html: emailContent,
        });
    }
};

exports.handleWebhook = async (req, res) => {
  try {
      console.log('Webhook received:', req.body);
      const { paymentId, amount, statusId, transactionId, custom1, visaId } = req.body;
      const signature = req.headers.authorization;
      const calculatedSignature = calculateSignature(req.body, process.env.SKIP_CASH_WEBHOOK_KEY);

      console.log('Signature verification:', { 
          received: signature, 
          calculated: calculatedSignature, 
          isValid: signature === calculatedSignature 
      });

      if (signature !== calculatedSignature) {
          console.log('Invalid signature');
          return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      const booking = await Booking.findOne({ transactionId: transactionId });
      console.log('Booking found:', booking);

      if (booking) {
          booking.paymentStatus = statusId === 2 ? 'Paid' : 'Failed';
          booking.visaId = visaId;
          await booking.save();
          console.log('Booking updated:', booking);

          const event = await Event.findById(booking.eventId);
          let emailContent = `
              <h3 style="font-family: Arial, sans-serif; color: #333;">
                  Hello ${booking.emailId.split("@")[0]},
              </h3>
          `;

          if (statusId === 2) {
              console.log('Payment successful, preparing email');
              emailContent += `
                  <p style="font-family: Arial, sans-serif; color: #333;">
                      Thank you for your payment for the event "${event.name}". Your booking has been confirmed.
                  </p>
                  <h4 style="font-family: Arial, sans-serif; color: #333;">
                      Event Name: ${event.name}
                  </h4>
                  <h4 style="font-family: Arial, sans-serif; color: #333;">
                      Number Of Tickets: ${booking.tickets.length}
                  </h4>
                  <h4 style="font-family: Arial, sans-serif; color: #333;">
                      Total Amount: ${booking.totalCost} QAR
                  </h4>
              `;
          } else {
              console.log('Payment failed, preparing email');
              emailContent += `
                  <p style="font-family: Arial, sans-serif; color: #333;">
                      Unfortunately, your payment for the event "${event.name}" has failed. Please try booking again.
                  </p>
              `;
          }

          emailContent += `<br>${Emailsignature}`;

          await transporter.sendMail({
              to: booking.emailId,
              subject: statusId === 2 ? `Payment Successful: ${event.name} Booking` : `Payment Failed: ${event.name} Booking`,
              html: emailContent,
          });
      }

      res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Webhook handling failed", error: error.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const booking = await Booking.findOne({ transactionId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({ success: true, status: booking.paymentStatus });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

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