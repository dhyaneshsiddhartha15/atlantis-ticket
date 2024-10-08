const Event = require("../models/eventModel");
const Booking = require("../models/bookingModel");
const Promo=require("../models/promoCode")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const Item = require("../models/itemsModel");
const TicketType = require("../models/ticketTypesModel");

const getEvensByCondition = async (condition) => {
  const now = new Date();

  const results = await Event.aggregate([
    {
      $match: condition,
    },
    {
      $addFields: {
        lastDate: { $arrayElemAt: ["$dates", -1] },
      },
    },
    {
      $addFields: {
        isUpcoming: { $gt: ["$lastDate", now] },
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "venue",
        foreignField: "_id",
        as: "venue",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "catering",
        foreignField: "_id",
        as: "catering",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "decoration",
        foreignField: "_id",
        as: "decoration",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "photograph",
        foreignField: "_id",
        as: "photograph",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        images: 1,
        ticketPrice: 1,
        venue: { $arrayElemAt: ["$venue", 0] },
        catering: { $arrayElemAt: ["$catering", 0] },
        decoration: { $arrayElemAt: ["$decoration", 0] },
        photograph: { $arrayElemAt: ["$photograph", 0] },
        status: 1,
        rejectedBy: 1,
        dates: 1,
        isPublished: 1,
        isUpcoming: 1,
      },
    },
    {
      $group: {
        _id: null,
        upcomingEvents: {
          $push: {
            $cond: {
              if: "$isUpcoming",
              then: {
                item: "$$ROOT",
              },
              else: "$$REMOVE",
            },
          },
        },
        pastEvents: {
          $push: {
            $cond: {
              if: { $not: "$isUpcoming" },
              then: {
                item: "$$ROOT",
              },
              else: "$$REMOVE",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        upcomingEvents: 1,
        pastEvents: 1,
      },
    },
  ]);

  const { upcomingEvents, pastEvents } = results[0] || {
    upcomingEvents: [],
    pastEvents: [],
  };

  // Fetch and assign images for each event in parallel
  // const [upcomingEventsWithImages, pastEventsWithImages] = await Promise.all([
  //   Promise.all(
  //     upcomingEvents.map(async (event) => ({
  //       item: event.item,
  //       // image: await getImages(event.item.images),
  //     })),
  //   ),
  //   Promise.all(
  //     pastEvents.map(async (event) => ({
  //       item: event.item,
  //       // image: await getImages(event.item.images),
  //     })),
  //   ),
  // ]);
  return { Upcoming: upcomingEvents, Past: pastEvents };
};
// exports.createEvent = catchAsync(async (req, res, next) => {
//   console.log(req.body);

//   const newEvent = new Event({
//     name: req.body.event.name,
//     description: req.body.event.description,
//     images: req.body.event.images,

//     dates: req.body.event.dates || [],
//   });

//   await newEvent.save();

//   const categorys = req.body.categorys;
//   const eventId = newEvent._id;

//   for (cat of categorys) {
//     const insertedCategory = new TicketType({ eventId, category: cat.category, price: cat.price });
//     await insertedCategory.save();
//   }

//   const event = await Event.findByIdAndUpdate(eventId, { isPublished: true });

//   const data = await getEvensByCondition({ isPublished: true });

//   res.status(201).json({ success: true, Upcoming: data.Upcoming, Past: data.Past });
// });
/* Test it later */
// exports.createEvent = catchAsync(async (req, res, next) => {
//   try {
//     const { name, description, images, dates = [], promoDetails = {} } = req.body.event;
//     const categorys = req.body.categorys || []; // Extract categories from req.body

//     // Log the request body and promo details for debugging
//     console.log("Request Body:", categorys );
//     console.log("Promo Code Data:", promoDetails);

//     // Create and save the new event
//     const newEvent = new Event({
//       name,
//       description,
//       images,
//       dates
//     });

//     const savedEvent = await newEvent.save();
//     const eventId = savedEvent._id;

//     // Handle categories (ticket types)
//     await Promise.all(
//       categorys.map(async (cat, index) => {
//         console.log(`Inserting category #${index + 1}:`, cat);

//         // Explicitly convert price to a number
//         const price = Number(cat.price);

//         if (isNaN(price) || price <= 0) {
//           throw new Error("Invalid price value. It must be a positive number.");
//         }

//         const insertedCategory = new TicketType({
//           eventId,
//           category: cat.category,
//           price: price
//         });

//         const savedCategory = await insertedCategory.save();
//         console.log(`Saved Category #${index + 1}:`, savedCategory);
//       })
//     );

//     // Handle promo code if provided
//     let promoCodeId = null;
//     if (promoDetails.promoCode) {
//       const { promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses } = promoDetails;

//       if (!promoCode || !discountType || !expiryDate || maxUses === undefined) {
//         return res.status(400).json({
//           message: "Please provide all required details for the promo code."
//         });
//       }

//       if (!['percentage', 'fixed'].includes(discountType)) {
//         return res.status(400).json({
//           message: "Invalid discountType. Must be 'percentage' or 'fixed'."
//         });
//       }

//       // Convert maxUses to a number
//       const maxUsesNumber = Number(maxUses);

//       if (isNaN(maxUsesNumber) || maxUsesNumber <= 0 || !Number.isInteger(maxUsesNumber)) {
//         return res.status(400).json({
//           message: "Invalid maxUses value. It must be a positive integer."
//         });
//       }

//       const expiresDate = new Date(expiryDate);
//       if (isNaN(expiresDate.getTime())) {
//         return res.status(400).json({
//           message: "Invalid expiry date format."
//         });
//       }

//       // Create the promo code
//       const newPromoCode = new Promo({
//         code: promoCode,
//         discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
//         discountPrice: discountType === 'fixed' ? discountPrice : 0,
//         discountType,
//         expiresAt: expiresDate,
//         isActive: true,
//         maxUses: maxUsesNumber,
//         currentUses: 0,
//         event: eventId
//       });

//       const savedPromoCode = await newPromoCode.save();
//       promoCodeId = savedPromoCode._id;
//       console.log("Saved Promo Code:", savedPromoCode);
//     }

//     // Update the event with the promo code reference if it exists
//     if (promoCodeId) {
//       await Event.findByIdAndUpdate(eventId, { promoCode: promoCodeId });
//     }

//     // Update the event to set it as published
//     await Event.findByIdAndUpdate(eventId, { isPublished: true });

//     // Fetch events by condition (assuming this function is defined elsewhere)
//     const data = await getEvensByCondition({ isPublished: true });

//     // Send response with the updated data
//     res.status(201).json({
//       success: true,
//       Upcoming: data.Upcoming,
//       Past: data.Past
//     });

//   } catch (error) {
//     console.error("Error creating event:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error."
//     });
//   }
// });
// create event ...........
exports.createEvent = catchAsync(async (req, res, next) => {
  try {
    console.log("req.body..................",req.body)
    const { name,userId, description, images, dates = [], promoDetails = {} } = req.body.event;
    const categorys = req.body.categorys || []; 
    console.log("Request Body userId:", userId);
    console.log("Request Body:", categorys);
    console.log("Promo Code Data:", promoDetails);
  
    const newEvent = new Event({
      name,
      description,
      images,
      dates,
      creatorId:userId
    });

    const savedEvent = await newEvent.save();
    console.log("saved event",savedEvent);
    console.log("Request Body userId:", userId);

    
    const eventId = savedEvent._id;


    const savedCategories = await Promise.all(
      categorys.map(async (cat, index) => {
        console.log(`Inserting category #${index + 1}:`, cat);

        const price = Number(cat.price);
        if (isNaN(price) || price <= 0) {
          throw new Error("Invalid price value. It must be a positive number.");
        }

        const insertedCategory = new TicketType({
          eventId,
          category: cat.category,
          price: price
        });
        return await insertedCategory.save();

        // const savedCategory = await insertedCategory.save();
        // console.log(`Saved Category #${index + 1}:`, savedCategory);
        // console.log("inserted savedCategory",savedCategory );
        // return savedCategory; // Return saved category
      })
    );

    let promoCodeId = null;
    if (promoDetails.promoCode) {
      const { promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory } = promoDetails;

      console.log("promo deatails logall",  promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory );
      
      if (!promoCode || !discountType || !expiryDate || maxUses === undefined) {
        return res.status(400).json({
          message: "Please provide all required details for the promo code."
        });
      }

      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({
          message: "Invalid discountType. Must be 'percentage' or 'fixed'."
        });
      }

      const maxUsesNumber = Number(maxUses);
      if (isNaN(maxUsesNumber) || maxUsesNumber <= 0 || !Number.isInteger(maxUsesNumber)) {
        return res.status(400).json({
          message: "Invalid maxUses value. It must be a positive integer."
        });
      }

      const expiresDate = new Date(expiryDate);
      if (isNaN(expiresDate.getTime())) {
        return res.status(400).json({
          message: "Invalid expiry date format."
        });
      }
      const applicableCategories = savedCategories
        .filter(cat => cat.category === applicableCategory)
        .map(cat => cat.category);

      if (applicableCategories.length === 0) {
        return res.status(400).json({
          message: "Invalid applicable category for promo code."
        });
      }

      // const category = savedCategories.find(cat => cat.category === applicableCategory);
      // if (!category) {
      //   return res.status(400).json({
      //     message: "Invalid category for promo code."
      //   });
      // }
      const newPromoCode = new Promo({
        code: promoCode,
        discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
        discountPrice: discountType === 'fixed' ? discountPrice : 0,
        discountType,
        expiresAt: expiresDate,
        isActive: true,
        maxUses: maxUsesNumber,
        currentUses: 0,
        event: eventId,
        // ticketCategory: category._id,
        applicableCategories,
      });

      const savedPromoCode = await newPromoCode.save();
      promoCodeId = savedPromoCode._id;
      console.log("Saved Promo Code:", savedPromoCode);
    }

    if (promoCodeId) {
      // await Event.findByIdAndUpdate(eventId, { promoCode: promoCodeId });
      await Event.findByIdAndUpdate(eventId, { $push: { promoCodes: promoCodeId } });
    }

    await Event.findByIdAndUpdate(eventId, { isPublished: true });
    const data = await getEvensByCondition({ isPublished: true });

    // Send response with the updated data
    console.log("log llog lllog", data.Upcoming,  data.Past);
    
    res.status(201).json({
      success: true,
      Upcoming: data.Upcoming,
      Past: data.Past
    });

  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
// -----------------------update event--------------------------------------------------------------
// exports.updateEvent = catchAsync(async (req, res, next) => {
//   try {
//     const { eventId } = req.params;
//     const { name, description, images, dates = [], promoDetails = {}, categorys = [] } = req.body;
//     console.log("data from req. body -------------",req.body)
//     // return res.json({message:"reacxhed to back"})
//     // Find and update the event
//     const updatedEvent = await Event.findByIdAndUpdate(eventId, { 
//       name,
//       description,
//       images,
//       dates
//     }, { new: true });

//     if (!updatedEvent) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found."
//       });
//     }

//     // Update categories
//     await TicketType.deleteMany({ eventId }); // Remove old categories

//     const savedCategories = await Promise.all(
//       categorys.map(async (cat, index) => {
//         console.log(`Inserting category #${index + 1}:`, cat);

//         const price = Number(cat.price);
//         if (isNaN(price) || price <= 0) {
//           throw new Error("Invalid price value. It must be a positive number.");
//         }

//         const insertedCategory = new TicketType({
//           eventId,
//           category: cat.category,
//           price: price
//         });

//         const savedCategory = await insertedCategory.save();
//         console.log(`Saved Category #${index + 1}:`, savedCategory);

//         return savedCategory; // Return saved category
//       })
//     );

//     // Handle promo code
//     if (promoDetails.promoCode) {
//       const { promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory } = promoDetails;
//       console.log("its my loggg in update event...",promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory);
      
//       if (!promoCode || !discountType || !expiryDate || maxUses === undefined  ) {
//         return res.status(400).json({
//           message: "Please provide all required details for the promo code."
//         });
//       }

//       if (!['percentage', 'fixed'].includes(discountType)) {
//         return res.status(400).json({
//           message: "Invalid discountType. Must be 'percentage' or 'fixed'."
//         });
//       }

//       const maxUsesNumber = Number(maxUses);
//       if (isNaN(maxUsesNumber) || maxUsesNumber <= 0 || !Number.isInteger(maxUsesNumber)) {
//         return res.status(400).json({
//           message: "Invalid maxUses value. It must be a positive integer."
//         });
//       }

//       const expiresDate = new Date(expiryDate);
//       if (isNaN(expiresDate.getTime())) {
//         return res.status(400).json({
//           message: "Invalid expiry date format."
//         });
//       }

//       const category = savedCategories.find(cat => cat.category === applicableCategory);
//       if (!category) {
//         return res.status(400).json({
//           message: "Invalid category for promo code."
//         });
//       }

//       const existingPromoCode = await Promo.findOne({ code: promoCode, event: eventId });
//       let newPromoCode;

//       if (existingPromoCode) {
//         // Update existing promo code
//         newPromoCode = await Promo.findByIdAndUpdate(existingPromoCode._id, {
//           discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
//           discountPrice: discountType === 'fixed' ? discountPrice : 0,
//           discountType,
//           expiresAt: expiresDate,
//           isActive: true,
//           maxUses: maxUsesNumber,
//           currentUses: existingPromoCode.currentUses,
//           ticketCategory: category._id
//         }, { new: true });
//         console.log("Updated Promo Code:", newPromoCode);
//       } else {
//         // Create new promo code
//         newPromoCode = new Promo({
//           code: promoCode,
//           discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
//           discountPrice: discountType === 'fixed' ? discountPrice : 0,
//           discountType,
//           expiresAt: expiresDate,
//           isActive: true,
//           maxUses: maxUsesNumber,
//           currentUses: 0,
//           event: eventId,
//           ticketCategory: category._id
//         });

//         await newPromoCode.save();
//         console.log("Saved Promo Code:", newPromoCode);
//       }

//       await Event.findByIdAndUpdate(eventId, { promoCode: newPromoCode._id });
//     } else {
//       // Remove promo code if not provided
//       await Event.findByIdAndUpdate(eventId, { promoCode: null });
//     }

//     // Optionally, update the published status
//     await Event.findByIdAndUpdate(eventId, { isPublished: true });

//     const data = await getEvensByCondition({ isPublished: true });

//     // Send response with the updated data
//     res.status(200).json({
//       success: true,
//       Upcoming: data.Upcoming,
//       Past: data.Past
//     });

//   } catch (error) {
//     console.error("Error updating event:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error."
//     });
//   }
// });


exports.updateEvent = catchAsync(async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { name, description, images, dates = [], promoDetails = {}, categorys = [] } = req.body;
    console.log("dataddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd from req. body -------------",req.body)
  
    // const existingEvent= await Event.find({eventId})
    const existingEvent = await Event.findById(eventId);
    console.log("existingEvent",existingEvent)
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found."
      });
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(eventId, { 
      name,
      description,
      // images,
      images: images.length > 0 ? images : existingEvent.images,
      dates
    }, { new: true });

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found."
      });
    }
     // Populate the promoCodes in the event data
     await updatedEvent.populate('promoCodes')
      console.log("updated event with populate",updatedEvent)
     // Get the applicable categories from the first promo code (0th index)
     const applicableCategoriesFromFirstPromo = updatedEvent.promoCodes[0]?.applicableCategories || [];
     console.log("merge category filterrddddddddddddddddddddddddddddddddddddddddddddddddr ---------", applicableCategoriesFromFirstPromo);

    // Update categories
    await TicketType.deleteMany({ eventId }); // Remove old categories

    const savedCategories = await Promise.all(
      categorys.map(async (cat, index) => {
        console.log(`Inserting category #${index + 1}:`, cat);

        const price = Number(cat.price);
        if (isNaN(price) || price <= 0) {
          throw new Error("Invalid price value. It must be a positive number.");
        }

        const insertedCategory = new TicketType({
          eventId,
          category: cat.category,
          price: price
        });

        const savedCategory = await insertedCategory.save();
        console.log(`Saved Category #${index + 1}:`, savedCategory);

        return savedCategory; // Return saved category
      })
    );

    // Handle promo code
    if (promoDetails.promoCode) {
      const { promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory } = promoDetails;
      console.log("its my loggg in updadddddddddddddddddddddddddddddddte event...",promoCode, discountPercentage, discountPrice, discountType, expiryDate, maxUses, applicableCategory);
      
      if (!promoCode || !discountType || !expiryDate || maxUses === undefined  ) {
        console.log("return from first if !!!!!");
        return res.status(400).json({
          message: "Please provide all required details for the promo code."
        });
      }

      if (!['percentage', 'fixed'].includes(discountType)) {
        console.log("return from second if !!!!!");
        return res.status(400).json({
          message: "Invalid discountType. Must be 'percentage' or 'fixed'."
        });
      }

      const maxUsesNumber = Number(maxUses);
      if (isNaN(maxUsesNumber) || maxUsesNumber <= 0 || !Number.isInteger(maxUsesNumber)) {
        console.log("return from thired if !!!!isnana");
        return res.status(400).json({
          message: "Invalid maxUses value. It must be a positive integer."
        });
      }

      const expiresDate = new Date(expiryDate);
      if (isNaN(expiresDate.getTime())) {
        console.log("return from fourth if data!");
        return res.status(400).json({
          message: "Invalid expiry date format."
        });
      }

      const category = savedCategories.find(cat => cat.category === applicableCategory);
      if (!category) {
        console.log("return from fifth if category !!!!!");
        return res.status(400).json({
          message: "Invalid category for promo code."
        });
      }

      const existingPromoCode = await Promo.findOne({ code: promoCode, event: eventId });
      let newPromoCode;

      if (existingPromoCode) {
        // console.log("merge")
        // const mergedApplicableCategories = [...new Set([...existingPromoCode.applicableCategories, applicableCategory])];
        
        
        // Update existing promo code
        newPromoCode = await Promo.findByIdAndUpdate(existingPromoCode._id, {
          discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
          discountPrice: discountType === 'fixed' ? discountPrice : 0,
          discountType,
          expiresAt: expiresDate,
          isActive: true,
          maxUses: maxUsesNumber,
          currentUses: existingPromoCode.currentUses,
          ticketCategory: category._id,
          applicableCategories: applicableCategoriesFromFirstPromo,
        }, { new: true });
        console.log("Updated Promo Code:", newPromoCode);
      } else {
        // Create new promo code
        newPromoCode = new Promo({
          code: promoCode,
          discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
          discountPrice: discountType === 'fixed' ? discountPrice : 0,
          discountType,
          expiresAt: expiresDate,
          isActive: true,
          maxUses: maxUsesNumber,
          currentUses: 0,
          event: eventId,
          ticketCategory: category._id,
          applicableCategories: applicableCategoriesFromFirstPromo,
        });

        await newPromoCode.save();
        console.log("Saved Promo Cdddddddddddddddddddddddddddddddddddddddode:", newPromoCode);
      }

      // await Event.findByIdAndUpdate(eventId, { promoCode: newPromoCode._id });
      await Event.findByIdAndUpdate(eventId, { $push: { promoCodes: newPromoCode._id } });
    } else {
      // Remove promo code if not provided
      // await Event.findByIdAndUpdate(eventId, { promoCode: null });
      await Event.findByIdAndUpdate(eventId, { promoCodes: [] });
    }

    // Optionally, update the published status
    await Event.findByIdAndUpdate(eventId, { isPublished: true });

    const data = await getEvensByCondition({ isPublished: true });

    // Send response with the updated data
    res.status(200).json({
      success: true,
      Upcoming: data.Upcoming,
      Past: data.Past
    });

  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const data = await getEvensByCondition({ isPublished: true });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
    data
  });
});

exports.getAllPublishedEvents = async (req, res, next) => {
  const data = await getEvensByCondition({ isPublished: true });

  res.status(200).json(data);
};

exports.getEventsByUserId = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.getEventsByClientId = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  const bookings = await Booking.find({ clientId }).populate("eventId userId");

  let upcomingEvents = [];
  let pastEvents = [];

  const now = new Date();

  for (let booking of bookings) {
    const event = booking.eventId;

    if (event && event.dates.length > 0) {
      const latestDate = new Date(Math.max(...event.dates.map((date) => new Date(date))));

      // let images = [];
      // if (event.images && event.images.length > 0) {
      //   images = await getImages(event.images);
      // }

      const eventData = {
        item: booking,
        event: event,
        // images: images,
      };

      if (latestDate < now) {
        pastEvents.push(eventData);
      } else {
        upcomingEvents.push(eventData);
      }
    }
  }

  res.status(200).json({
    message: "success",
    Upcoming: upcomingEvents,
    Past: pastEvents,
  });
});

///b 669e00735ba7aee3532a8e4e
///c 669e00735ba7aee3532a8e4e

exports.confirmEvent = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const booking = await Booking.findById(bookingId);

  const clientId = booking.clientId;
  if (!booking) {
    return next(new AppError("No Bookings found", 404));
  }
  booking.isConfirmed = "Confirmed";
  await booking.save();

  const bookings = await Booking.find({ eventId: booking.eventId });

  const allConfirmed = bookings.every((b) => b.isConfirmed == "Confirmed");
  if (allConfirmed) {
    await Event.findByIdAndUpdate(booking.eventId, { status: "Confirmed" });
  }

  const Events = await Booking.find({ clientId }).populate("eventId");

  let events = [];
  for (let i = 0; i < Events.length; i++) {
    // let img = await getImages(Events[i]?.eventId?.images);
    events.push({
      item: Events[i],
      // images: img,
    });
  }

  // await Event.findByIdAndUpdate(eventId, { status: "Confirmed" });
  res.status(200).json({ message: "success", events: events });
});

exports.rejectEvent = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new AppError("No Bookings found", 404));
  }
  const clientId = booking.clientId;
  const item = await Item.findById(booking.itemId)
    .select("typeId")
    .populate("typeId");

  if (!item || !item.typeId) {
    return next(new AppError("Item type not found", 404));
  }

  const itemType = item.typeId.type;

  booking.isConfirmed = "Rejected";
  await booking.save();

  const rejectionObject = {
    id: booking.itemId,
    type: itemType, // Use the type retrieved from the populated typeId
  };

  await Event.findByIdAndUpdate(
    booking.eventId,
    {
      $addToSet: { rejectedBy: rejectionObject },
      status: "Rejected",
      isPublished: false,
    },
    { new: true },
  );

  const Events = await Booking.find({ clientId }).populate("eventId");

  let events = [];
  for (let i = 0; i < Events.length; i++) {
    // let img = await getImages(Events[i]?.eventId?.images);
    events.push({
      item: Events[i],
      // images: img,
    });
  }

  res.status(200).json({ message: "success", events: events });
});

exports.publishEvent = catchAsync(async (req, res, next) => {
  const categorys = req.body.categorys;
  const eventId = req.params.eventId;

  for (cat of categorys) {
    const insertedCategory = new TicketType({ eventId, category: cat.category, price: cat.price });
    await insertedCategory.save();
  }

  const event = await Event.findByIdAndUpdate(eventId, { isPublished: true, status: "Confirmed" });
  const userId = event.userId;

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.cancelEvent = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  await TicketType.deleteMany({ eventId });
  const event = await Event.findByIdAndUpdate(eventId, { isPublished: false, status: "Canceled" });
  const userId = event.userId;

  const bookings = await Booking.find({ eventId });

  for (book of bookings) {
    book.isConfirmed = "Canceled";
    await book.save();
  }

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.getEventByEventId = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const event = await Event.findById(eventId)
  .populate({
    path: 'promoCodes',  // Populating the array of promo codes
    select: 'code discountType discountPercentage discountPrice expiresAt maxUses',  // Selecting necessary fields
  })
  .populate({
    path: 'creatorId',  // Populating the creator's details
    select: 'name email',  // Selecting necessary fields from the User
  });

  if (!event) {
    return res.status(404).json({
      message: "Event not found",
    });
  }
  console.log("Event ID:", eventId);
  console.log("Event Details:", event);  // Log the full event object for debugging

  const ticketTypes = await TicketType.find({ eventId:event._id });
  if (ticketTypes.length === 0) {
    console.log("No TicketTypes found for the given eventId:", eventId);
  } else {
    console.log("Found TicketTypes:", ticketTypes);
  }

  console.log("ticket types.................",ticketTypes)
  res.status(200).json({
    message: "success",
    data: {
      event: {
        details: event,
        ticketTypes,
                //  images: eventImages
      },
    },
  });
});
exports.editEventById = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const { venue, catering, photograph, decoration } = req.body;

  const updateData = {
    userId: req.body.userId,
    name: req.body.name,
    description: req.body.description,
    ticketPrice: req.body.ticketPrice || 0,
    rejectedBy: [],
    isPublished: false,
    status: "Booked",
  };

  const unsetData = {};

  if (JSON.parse(venue)?.id) {
    updateData.venue = JSON.parse(venue).id;
  } else {
    unsetData.venue = "";
  }

  if (JSON.parse(catering)?.id) {
    updateData.catering = JSON.parse(catering).id;
  } else {
    unsetData.catering = "";
  }

  if (JSON.parse(photograph)?.id) {
    updateData.photograph = JSON.parse(photograph).id;
  } else {
    unsetData.photograph = "";
  }

  if (JSON.parse(decoration)?.id) {
    updateData.decoration = JSON.parse(decoration).id;
  } else {
    unsetData.decoration = "";
  }

  const newEvent = await Event.findByIdAndUpdate(
    eventId,
    { $set: updateData, $unset: unsetData },
    { new: true },
  );

  const updatedEvnt = await Event.findByIdAndUpdate(eventId, { $unset: unsetData }, { new: true });

  if (!newEvent) {
    return res.status(404).json({ message: "Event not found" });
  }

  await Booking.deleteMany({ eventId });

  const services = [venue, catering, photograph, decoration];
  for (const service of services) {
    if (service) {
      const parsedService = JSON.parse(service);
      if (parsedService.id && parsedService.clientId) {
        const booking = new Booking({
          userId: req.body.userId,
          clientId: parsedService.clientId,
          itemId: parsedService.id,
          eventId: newEvent._id,
        });

        await booking.save();
      }
    }
  }

  res.status(201).json({ message: "success", event: newEvent, updatedEvnt });
});

exports.deleteFieldFromEvent = catchAsync(async (req, res, next) => {
  const { eventId, field } = req.params;
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $unset: { [field]: "" } },
    { new: true }, // Return the updated document
  );

  res.status(200).json({ message: "Field removed successfully", event: updatedEvent });
});



// code
// "PROMO2024"
// discountPercentage
// 90
// expiresAt
// 2024-12-31T23:59:59.000+00:00
// isActive
// true

// exports.addPromoCode = catchAsync(async (req, res, next) => {
//   try {
//     const { code, discountPercentage, discountPrice, discountType, expiresAt, isActive, maxUses, event } = req.body;

//     if (!code || !discountType || !expiresAt || isActive === undefined || maxUses === undefined || !event) {
//       return res.status(400).json({
//         message: "Please provide all required details, including code, discountType, expiresAt, isActive, maxUses, and event."
//       });
//     }

//     if (!['percentage', 'fixed'].includes(discountType)) {
//       return res.status(400).json({
//         message: "Invalid discountType. Must be 'percentage' or 'fixed'."
//       });
//     }

//     if (discountType === 'percentage' && (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100)) {
//       return res.status(400).json({
//         message: "Invalid discountPercentage value. It must be between 0 and 100."
//       });
//     }

//     if (discountType === 'fixed' && (discountPrice === undefined || discountPrice < 0)) {
//       return res.status(400).json({
//         message: "Invalid discountPrice value. It must be a non-negative number."
//       });
//     }

//     const expiresDate = new Date(expiresAt);
//     if (isNaN(expiresDate.getTime())) {
//       return res.status(400).json({
//         message: "Invalid expiry date format."
//       });
//     }

//     if (typeof maxUses !== 'number' || maxUses <= 0 || !Number.isInteger(maxUses)) {
//       return res.status(400).json({
//         message: "Invalid maxUses value. It must be a positive integer."
//       });
//     }

//     // Create the new promo code with event reference
//     const newPromoCode = new PromoCode({
//       code,
//       discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
//       discountPrice: discountType === 'fixed' ? discountPrice : 0,
//       discountType,
//       expiresAt: expiresDate,
//       isActive,
//       maxUses,
//       currentUses: 0,
//       event  // Add the event reference here
//     });

//     const savedPromoCode = await newPromoCode.save();

//     res.status(201).json({
//       message: "Promo code created successfully.",
//       voucher: savedPromoCode
//     });

//   } catch (error) {
//     console.error("Error creating promo code:", error);
//     res.status(500).json({
//       message: "Internal server error."
//     });
//   }
// });

exports.updatePromoCode = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { code, discountPercentage, expiresAt, isActive } = req.body;

  if (!code && discountPercentage === undefined && !expiresAt && isActive === undefined) {
    return res.status(400).json({
      message: "No fields to update. Please provide at least one field to update."
    });
  }

  const promoCode = await Promo.findById(id);
  if (!promoCode) {
    return res.status(404).json({
      message: "Promo code not found"
    });
  }
  if (code) promoCode.code = code;
  if (discountPercentage !== undefined) promoCode.discountPercentage = discountPercentage;
  if (expiresAt) promoCode.expiresAt = expiresAt;
  if (isActive !== undefined) promoCode.isActive = isActive;

  await promoCode.save();

  res.status(200).json({
    message: "Promo code updated successfully",
    voucher: promoCode
  });
});
exports.deletePromoCode = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoCode = await Promo.findByIdAndDelete(id);
    if (!promoCode) {
      return res.status(404).json({
        message: "Promo code not found"
      });
    }
    res.status(200).json({
      message: "Promo code deleted successfully",
      deletedPromoCode: promoCode
    });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return next(new AppError(500, "Internal Server Error"));
  }
});
exports.deleteEvent = catchAsync(async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return next(new AppError(400, "Event ID is required"));
    }
    console.log("Event id is", eventId);
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
      return next(new AppError(404, "Event not found"));
    }
    res.json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return next(new AppError(500, "Internal Server Error"));
  }
});
///
exports.getPromoCode = catchAsync(async (req, res, next) => {
  try {
    const { code } = req.body;
    const { eventId } = req.params;
      if (!code || !eventId) {
          return next(new AppError(400, "Promo code and event ID are required"));
      }

      const promo = await Promo.findOne({ code, event: eventId, isActive: true });

      if (!promo) {
          return res.status(404).json({
              message: "Promo code not found or not applicable for this event"
          });
      }

      if (promo.expiresAt && promo.expiresAt < new Date()) {
          return res.status(400).json({
              message: "Promo code has expired"
          });
      }

      if (promo.maxUses <= promo.currentUses) {
          return res.status(400).json({
              message: "Promo code usage limit exceeded"
          });
      }

      res.status(200).json({
          message: "Promo code found",
          discountPercentage: promo.discountPercentage,
          discountPrice: promo.discountPrice,
          discountType: promo.discountType,
          expiresAt: promo.expiresAt,
          maxUses: promo.maxUses,
          currentUses: promo.currentUses
      });
  } catch (error) {
      console.error("Error fetching promo code:", error);
      return next(new AppError(500, "Internal Server Error"));
  }
});

exports.applyPromoCode = catchAsync(async (req, res, next) => {
  try {
    const { promoCode,ticketType } = req.body;
    const { eventId } = req.params;
console.log("ticketType.....=======++++++++++++++++++++++....",ticketType);

    if (!eventId || !promoCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide both eventId and promoCode."
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found."
      });
    }

    const promo = await Promo.findOne({ code: promoCode, event: eventId });
    console.log("promo",promo);
    
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found for this event."
      });
    }
   // checking the tyoe of ticket Log the applicableCategories
   console.log("applicableCategories:", promo.applicableCategories);
   console.log("ticket type:",ticketType );
   if (!promo.applicableCategories.includes(ticketType)) {
    return res.status(400).json({
      success: false,
      message: "Promo code is not available for this ticket type."
    });
  }

    const currentDate = new Date();
    if (promo.expiresAt < currentDate) {
      return res.status(400).json({
        success: false,
        message: "Promo code has expired."
      });
    }

    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({
        success: false,
        message: "Promo code usage limit has been reached."
      });
    }

    const ticketTypes = await TicketType.find({ eventId: event._id });
    if (ticketTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No ticket types found for this event."
      });
    }

    // If applicableCategories is empty, consider all categories applicable
    const applicableTicketTypes = promo.applicableCategories.length > 0 
    ? ticketTypes.filter(tt => promo.applicableCategories.includes(tt.category))
    : ticketTypes;

    if (applicableTicketTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Promo code is not applicable for any of the event ticket types."
      });
    }

    console.log("applicableTicketTypes",applicableTicketTypes);
    console.log("applicableCategories",promo.applicableCategories);

    const isPromoApplicable = applicableTicketTypes.some(ticketType =>
      promo.applicableCategories.includes(ticketType.category)
    );

  console.log("isPromoApplicable", isPromoApplicable);
  
if (!isPromoApplicable) {
  return res.status(400).json({
    success: false,
    message: "Promo code is not applicable for the selected ticket types."
  });
}

    //   console.log("applicableCategories",promo.applicableCategories);
    // if(applicableTicketTypes!==promo.applicableCategories){
    //   console.log("applicableTicketTypes",applicableTicketTypes);
    //   console.log("applicableCategories",promo.applicableCategories);
      
    //   return res.status(400).json({
    //     success: false,
    //     message: "Promo code is not applicable for this ticket types."
    //   });
    // }

    const discountInfo = {
      discountType: promo.discountType,
      discountValue: promo.discountType === 'percentage' ? promo.discountPercentage : promo.discountPrice,
      applicableTicketTypes: applicableTicketTypes.map(tt => tt._id),
      applicableCategories: promo.applicableCategories
    };

    promo.currentUses += 1;
    await promo.save();

    res.status(200).json({
      success: true,
      message: "Promo code applied successfully....,",
      discountInfo,
    });
  } catch (error) {
    console.error("Error applying promo code:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});



// exports.applyPromoCode = catchAsync(async (req, res, next) => {
//   try {
//       const { promoCode } = req.body;
//       const { eventId } = req.params;
//       console.log("Promo Code from Body is", promoCode);
//       console.log("Event id from event is ", eventId);

//       // Validate input
//       if (!eventId || !promoCode) {
//           return res.status(400).json({
//               success: false,
//               message: "Please provide both eventId and promoCode."
//           });
//       }

//       // Fetch the event by ID
//       const event = await Event.findById(eventId);
//       if (!event) {
//           return res.status(404).json({
//               success: false,
//               message: "Event not found."
//           });
//       }

//       // Fetch the promo code details
//       const promo = await Promo.findOne({ code: promoCode, event: eventId });
//       console.log("Promo Code is", promo);
//       if (!promo) {
//           return res.status(404).json({
//               success: false,
//               message: "Promo code not found."
//           });
//       }

//       // Check if the promo code has expired
//       const currentDate = new Date();
//       if (promo.expiresAt < currentDate) {
//           return res.status(400).json({
//               success: false,
//               message: "Promo code has expired."
//           });
//       }

//       // Check if the promo code has been used up
//       if (promo.currentUses >= promo.maxUses) {
//           return res.status(400).json({
//               success: false,
//               message: "Promo code usage limit has been reached."
//           });
//       }

//       // Fetch ticket types for the event
//       const ticketTypes = await TicketType.find({ eventId: event._id });
//       if (ticketTypes.length === 0) {
//           return res.status(404).json({
//               success: false,
//               message: "No ticket types found for this event."
//           });
//       }

//       const discountInfo = {
//           discountType: promo.discountType,
//           discountValue: promo.discountType === 'percentage' ? promo.discountPercentage : promo.discountPrice,
//           applicableTicketTypes: ticketTypes.map(tt => tt._id)
//       };

//       // Increment the usage counter for the promo code
//       promo.currentUses += 1;
//       await promo.save();

//       res.status(200).json({
//           success: true,
//           message: "Promo code applied successfully.",
//           discountInfo,
//       });
//   } catch (error) {
//       console.log("Error is", error);
//       console.error("Error applying promo code:", error);
//       res.status(500).json({
//           success: false,
//           message: "Internal server error."
//       });
//   }
// });