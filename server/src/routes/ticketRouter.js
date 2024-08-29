const express = require("express");

const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/bookings", ticketController.bookTickets);
router.post("/thewebhookendpoint", ticketController.handleWebhook);
router.get('/payment-status/:transactionId', ticketController.getPaymentStatus);
router.get("/types/:eventId", ticketController.getTicketTypes);

module.exports = router;
