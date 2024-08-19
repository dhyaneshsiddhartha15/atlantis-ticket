const express = require("express");
const eventController = require("../controllers/eventController");
const itemsController = require("../controllers/itemsController");

const router = express.Router();

router
  .route("/")
  .post(eventController.createEvent)
  .get(eventController.getAllEvents);

//Deleted event
router.route("/delete-event/:eventId").delete(eventController.deleteEvent);
//Update Event
router.route("/update-event/:eventId").put(eventController.updateEvent);
router.route("/published").get(eventController.getAllPublishedEvents);
router.route("/:userId").get(eventController.getEventsByUserId);
router.route("/client/:clientId").get(eventController.getEventsByClientId);

router.route("/confirm/:bookingId").post(eventController.confirmEvent);
router.route("/reject/:bookingId").post(eventController.rejectEvent);

router.route("/publish/:eventId").post(eventController.publishEvent);
router.route("/publish/cancel/:eventId").post(eventController.cancelEvent);

router.route("/single-event/:eventId").get(eventController.getEventByEventId);
router.route("/edit/:eventId").put(eventController.editEventById);
router.route("/edit/:eventId/:field").put(eventController.deleteFieldFromEvent);


// router.route("/add-promo").post(eventController.addPromoCode);
router.route("/update-promo/:promoId").put(eventController.updatePromoCode)
router.route("/delete-promo/:promoId").delete(eventController.deletePromoCode);
router.route("/get-promo/:eventId").get(eventController.getPromoCode);
router.route("/apply-promo/:eventId").post(eventController.applyPromoCode)
// router.post('/apply-promo/:eventId', eventController.applyPromoCode);
module.exports = router;

// // const response = await fetch("https://atlantis-ticket-1.onrender.com/api/v1/events/add-promo", {
    // const addPromoCode = async (code, discountPercentage, discountPrice, discountType, expiresAt, maxUses) => {
    //     try {
    //         const response = await fetch("http://localhost:8081/api/v1/events/add-promo", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 code,
    //                 discountPercentage: discountType === 'percentage' ? parseFloat(discountPercentage) : 0,
    //                 discountPrice: discountType === 'fixed' ? parseFloat(discountPrice) : 0,
    //                 discountType,
    //                 expiresAt: new Date(expiresAt).toISOString(),
    //                 isActive: true,
    //                 maxUses: parseInt(maxUses, 10),
    //             }),
    //         });
    //         if (!response.ok) {
    //             throw new Error("Failed to create promo code");
    //         }
    //         return response.json();
    //     } catch (error) {
    //         throw error;
    //     }
    // };