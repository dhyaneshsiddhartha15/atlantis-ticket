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
const CryptoJS = require('crypto-js');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const Booking = require("../models/bookingModel");
const QRCode = require('qrcode');
const crypto = require('crypto');
const generatePaymentRequestSKIP = require("../utils/generatePaymentSKIP");
require("dotenv").config();
const paymentGatewayDetails = {
  sandboxURL: "https://skipcashtest.azurewebsites.net",
  productionURL: "https://api.skipcash.app",
  secretKey: process.env.SKIP_CASH_KEY_SECRET,
  keyId: process.env.SKIP_CASH_KEY_ID,
  clientId: process.env.SKIP_CASH_CLIENT_ID,
};
const WEBHOOK_KEY = process.env.SKIP_CASH_WEBHOOK_KEY;
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

function calculateSignature(payload) {
  const fields = ['PaymentId', 'Amount', 'StatusId', 'TransactionId', 'Custom1', 'VisaId'];
  const data = fields
      .filter(field => payload[field] != null)
      .map(field => `${field}=${payload[field]}`)
      .join(',');

  const hmac = CryptoJS.HmacSHA256(data, WEBHOOK_KEY);
  return CryptoJS.enc.Base64.stringify(hmac);
}

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
const generateQRCodeUrl = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
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
       const  qrCodeData= generateQRCodeUrl(payUrl);
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

//         const emailContent = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//         body {
//             font-family: Arial, sans-serif;
//             background-color: #ffffff;
//             margin: 0;
//             padding: 20px;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             min-height: 100vh;
//         }
//         .container {
//             width: 100%;
//             max-width: 600px;
//             background-color: #ffffff;
//             border-radius: 15px;
//             box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//             color: #333;
//             position: relative;
//             padding: 30px;
//             overflow: hidden;
//             border: 6px solid #800000;
//         }
//         .ticket-content {
//             width: 100%;
//             position: relative;
//         }
//         .content {
//             position: relative;
//             z-index: 1;
//             display: flex;
//             flex-direction: column;
//             gap: 15px;
//         }
//         .button {
//             display: inline-block;
//             font-size: 16px;
//             font-weight: bold;
//             background-color: #436ea5;
//             padding: 12px 24px;
//             border-radius: 25px;
//             color: #fff;
//             text-decoration: none;
//             align-self: flex-start;
//             margin-top: 20px;
//         }
//         .qr-code {
//             position: absolute;
//             top: 20px;
//             right: 20px;
//             width: 100px;
//             height: 100px;
//             background-color: #f0f0f0;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
//             border-radius: 10px;
//             z-index: 2;
//         }
//         .signature {
//             margin-top: 30px;
//             padding-top: 20px;
//             border-top: 2px solid #800000;
//             display: flex;
//             align-items: center;
//         }
//         .signature img {
//             width: 60px;
//             height: 60px;
//             margin-right: 15px;
//         }
//         .signature h1 {
//             color: #921A40;
//             font-size: 1.5rem;
//             margin: 0;
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="ticket-content">
//             <div class="qr-code">
//                 <img src="${qrCodeData}" alt="QR Code">
//             </div>
//             <div class="content">
//                 <div style="font-size: 28px; font-weight: bold; color: #800000;">Hello ${emailId.split("@")[0]}</div>
//                 <div style="font-size: 24px; font-weight: bold;">Event Name: ${event.name}</div>
//                 <div style="font-size: 20px;">Total Amount: ${totalCost} QAR</div>
//                 <div style="font-size: 20px;">Number Of Tickets: ${totalQuantity}</div>
//                 <a href="${payUrl}" class="button">COMPLETE PAYMENT</a>
//                 <p style="color: #800000; margin: 20px 0; font-weight: bold;">
//                     Please note that your booking will be automatically cancelled if payment is not completed within 15 minutes.
//                 </p>
//             </div>
//         </div>
//         <div class="signature">
//             <img src="https://cdn2.advanceinfotech.org/doha.directory/1200x675/business/2278/futad-advertising-qatar-1657866216.webp" alt="Atlantis Logo">
//             <h1><b>Atlantis</b></h1>
//         </div>
//     </div>
// </body>
// </html>
// `;

      //   const emailContent = `
      //   <div style="font-family: Arial, sans-serif; background-color: #04030C; color: #fff; padding: 20px; border-radius: 15px; width: 700px; margin: 0 auto; box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);">
      //     <h3 style="color: #fff; margin-bottom: 20px;">
      //       Hello ${emailId.split("@")[0]},
      //     </h3>
      //     <p style="color: #fff; margin-bottom: 20px;">
      //       Thank you for booking tickets for <span style="font-weight: bold;">${event.name}</span>. We are thrilled to have you join us for this exciting event.
      //     </p>
      //     <p style="color: #fff; margin-bottom: 20px;">
      //       Here are the booking details:
      //     </p>
      //     <div style="margin-bottom: 20px;">
      //       <h4 style="color: #fff; font-weight: bold;">Event Name: ${event.name}</h4>
      //       <h4 style="color: #fff; font-weight: bold;">Number Of Tickets: ${totalQuantity}</h4>
      //       <h4 style="color: #fff; font-weight: bold;">Total Amount: ${totalCost} QAR</h4>
      //     </div>
      //     <p style="color: #fff; margin-bottom: 20px;">
      //       To complete your payment, please use one of the following options:
      //     </p>
      //     <div style="display: flex; align-items: center; margin-bottom: 20px;">
      //       <div style="margin-right: 20px;">
      //         <img src="${qrCodeData}" alt="QR Code" style="width: 150px; height: 150px; box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3); border-radius: 10px;" />
      //       </div>
      //       <div>
      //         <a href="${payUrl}" style="background-color: #436ea5; color: #fff; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);">
      //           Complete Payment
      //         </a>
      //       </div>
      //     </div>
      //     <p style="color: #fff; margin-bottom: 20px;">
      //       Please note that your booking will be automatically cancelled if payment is not completed within 15 minutes.
      //     </p>
      //     <br>
      //     ${Emailsignature}
      //   </div>
      // `;
      
        //    await transporter.sendMail({
        //       to: emailId,
        //       subject: `TICKET BOOKED: Complete your payment for ${event.name} tickets`,
        //       html: emailContent,
        //      });

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

//Webhook//
exports.handleWebhook = catchAsync(async (req, res) => {
    console.log("Web Hook Called----");
    const { PaymentId, Amount, StatusId, TransactionId, Custom1, VisaId } = req.body;
    const authHeader = req.headers['authorization'];
    console.log("Webhook auth header is", authHeader);
  
    if (!PaymentId || !Amount || !StatusId || !TransactionId) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook data.",
      });
    }
  
    const calculatedSignature = calculateSignature(req.body);
    console.log("Calculated Signature is", calculatedSignature);
    if (authHeader !== calculatedSignature) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature.",
      });
    }
  
    const booking = await Booking.findOne({ transactionId: TransactionId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
  
    const event = await Event.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }
  
    let emailSubject, emailContent;
  
    switch (parseInt(StatusId)) {
      case 2:
        booking.paymentStatus = 'Completed';
        emailSubject = `Your Ticket for ${event.name}`;
        emailContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
              }
              .ticket {
                background-color: #ffffff;
                border-radius: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                overflow: hidden;
                max-width: 400px;
                margin: 0 auto;
              }
              .ticket-header {
                background-color: #921A40;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
              }
              .ticket-body {
                padding: 20px;
              }
              .ticket-info {
                margin-bottom: 15px;
              }
              .ticket-label {
                font-weight: bold;
                color: #555;
              }
              .ticket-value {
                color: #333;
              }
              .qr-code {
                text-align: center;
                margin-top: 20px;
              }
              .qr-code img {
                max-width: 150px;
                height: auto;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="ticket-header">
                ${event.name}
              </div>
              <div class="ticket-body">
                <div class="ticket-info">
                  <span class="ticket-label">Attendee:</span>
                  <span class="ticket-value">${booking.emailId.split("@")[0]}</span>
                </div>
                <div class="ticket-info">
                  <span class="ticket-label">Total Tickets:</span>
                  <span class="ticket-value">${booking.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)}</span>
                </div>
                <div class="ticket-info">
                  <span class="ticket-label">Date:</span>
                  <span class="ticket-value">${new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div class="ticket-info">
                  <span class="ticket-label">Venue:</span>
                  <span class="ticket-value">${event.venue}</span>
                </div>
                <div class="qr-code">
                  <img src="${qrCodeData}" alt="QR Code">
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;
      case 3:
        booking.paymentStatus = 'Failed';
        emailSubject = `Payment Failed: Your tickets for ${event.name}`;
        emailContent = `
          <p>We're sorry, but your payment for ${event.name} tickets has failed.</p>
          <p>Please try booking your tickets again. If you continue to experience issues, please contact our support team.</p>
        `;
        break;
      case 4:
        booking.paymentStatus = 'Cancelled';
        emailSubject = `Payment Cancelled: Your tickets for ${event.name}`;
        emailContent = `
          <p>Your payment for ${event.name} tickets has been cancelled.</p>
          <p>If you did not intend to cancel this payment, please try booking your tickets again.</p>
        `;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Unknown payment status.",
        });
    }
  
    await booking.save();
  
    await transporter.sendMail({
      to: booking.emailId,
      subject: emailSubject,
      html: emailContent,
    });
  
    res.status(200).json({
      success: true,
      message: `Webhook processed successfully. Payment status: ${booking.paymentStatus}`,
    });
  });
// exports.handleWebhook = async (req, res) => {
//   try {
//       console.log('Webhook received:', req.body);
//       const { paymentId, amount, statusId, transactionId, custom1, visaId } = req.body;
//       const signature = req.headers.authorization;
//       const calculatedSignature = calculateSignature(req.body, process.env.SKIP_CASH_WEBHOOK_KEY);

//       console.log('Signature verification:', { 
//           received: signature, 
//           calculated: calculatedSignature, 
//           isValid: signature === calculatedSignature 
//       });

//       if (signature !== calculatedSignature) {
//           console.log('Invalid signature');
//           return res.status(400).json({ success: false, message: "Invalid signature" });
//       }
//       const booking = await Booking.findOne({ transactionId: transactionId });
//       console.log('Booking found:', booking);

//       if (booking) {
//           booking.paymentStatus = statusId === 2 ? 'Paid' : 'Failed';
//           booking.visaId = visaId;
//           await booking.save();
//           console.log('Booking updated:', booking);

//           const event = await Event.findById(booking.eventId);
//           let emailContent = `
//               <h3 style="font-family: Arial, sans-serif; color: #333;">
//                   Hello ${booking.emailId.split("@")[0]},
//               </h3>
//           `;

//           if (statusId === 2) {
//               console.log('Payment successful, preparing email');
//               emailContent += `
//                   <p style="font-family: Arial, sans-serif; color: #333;">
//                       Thank you for your payment for the event "${event.name}". Your booking has been confirmed.
//                   </p>
//                   <h4 style="font-family: Arial, sans-serif; color: #333;">
//                       Event Name: ${event.name}
//                   </h4>
//                   <h4 style="font-family: Arial, sans-serif; color: #333;">
//                       Number Of Tickets: ${booking.tickets.length}
//                   </h4>
//                   <h4 style="font-family: Arial, sans-serif; color: #333;">
//                       Total Amount: ${booking.totalCost} QAR
//                   </h4>
//               `;
//           } else {
//               console.log('Payment failed, preparing email');
//               emailContent += `
//                   <p style="font-family: Arial, sans-serif; color: #333;">
//                       Unfortunately, your payment for the event "${event.name}" has failed. Please try booking again.
//                   </p>
//               `;
//           }

//           emailContent += `<br>${Emailsignature}`;

//           await transporter.sendMail({
//               to: booking.emailId,
//               subject: statusId === 2 ? `Payment Successful: ${event.name} Booking` : `Payment Failed: ${event.name} Booking`,
//               html: emailContent,
//           });
//       }

//       res.status(200).json({ success: true, message: "Webhook processed successfully" });
//   } catch (error) {
//       console.log(error);
//       res.status(500).json({ success: false, message: "Webhook handling failed", error: error.message });
//   }
// };

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