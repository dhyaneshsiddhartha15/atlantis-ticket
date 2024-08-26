



import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/DatePicker";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import InputSelect from "@/components/ClientInputSelect";
import ClientTextArea from "@/components/ClientTextArea";
import DatePicker from "react-multi-date-picker";

export const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [event, setEvent] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); // Use state for image preview
  const [date, setDate] = useState({ from: null, to: null });
  const [categories, setCategories] = useState([]); // Store event categories
  const [promoCode, setPromoCode] = useState([]);
  const [disppromoCode, setDispPromoCode] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [loading, setLoading] = useState(false);
  const [showPromoCodes, setShowPromoCodes] = useState(false); // State to toggle promo code dropdown visibility


  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/events/single-event/${eventId}`);
        console.log("response+++))++++++++)))_____",res)
        const eventData = res?.data?.data?.event?.details;
        // Assuming 'response' is the object you received
        const ticketTypes = res.data.data.event.ticketTypes;
        console.log("event loging",eventData);
        

        const formattedCategories = ticketTypes.map((ticket) => ({
          category: ticket.category,
          price: ticket.price,
        }));
  
        setCategories(formattedCategories);
  

        setEvent(eventData);
        setTitle(eventData.name);
        setDescription(eventData.description);
        // setImage(eventData.images[0]);
        setDate({
          from: new Date(eventData.dates[0]),
          to: new Date(eventData.dates[eventData.dates.length - 1]),
        });
        // setCategories(res?.data?.data?.event?.ticketTypes?.category); // Set initial categories
        setPromoCode(eventData?.promoCodes || "");
        setDispPromoCode(eventData?.promoCodes || "")
        setDiscountPercentage(eventData.promoCode?.discountPercentage || "");
        setDiscountPrice(eventData?.promoCode?.discountPrice || "");
        setExpiryDate(eventData?.promoDetails?.expiryDate || "");
        setMaxUses(eventData.promoCode?.maxUses || "");
        setDiscountType(eventData.promoCode?.discountType ||"Percentage" );
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to fetch event details",
          variant: "destructive",
        });
      }
    };
    fetchEvent();
  }, [eventId, BASE_URL, toast]); // Include toast dependency
  
  useEffect(() => {
    if (event) {
      setImage(event.images[0]); // Ensure the image state is set when the event data is fetched
    }
}, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
   
    try {
      const updatedEvent = {
        name: title,
        description,
        images: [image],
        dates: [date.from.toISOString(), date.to.toISOString()],
        promoDetails: {
          promoCode,
          discountPercentage:Number(discountPercentage), 
          discountPrice:Number(discountPrice),
          discountType,
          expiryDate:expiryDate ? new Date(expiryDate).toISOString() : "",
          maxUses:Number(maxUses),
          applicableCategory: categories[0]?.category
        },
        categorys: categories?.map((cat) => ({
          category: cat.category,
          price: cat.price,
        }))
      };
      console.log("before calling api ----------------",updatedEvent)
      const resp = await axios.put(`${BASE_URL}/events/update-event/${eventId}`, updatedEvent);
      console.log("res after update---",resp)
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate(`/events`); // Redirect after successful update
      // navigate('/events/update-event')
    } catch (error) {
      console.error("Error updating event:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to update event",
      //   variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCategories([...categories, { category: "", price: "" }]);
  };

  const handleRemoveCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index][field] = value;
    setCategories(updatedCategories);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold  text-red-400">Edit Event</h1>
      <div className="bg-secondary rounded-lg  p-5 w-full lg:w-1/2 space-y-3 shadow-lg">
      <form onSubmit={handleSubmit}>
      <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
      <input
        type="text"
        value={title}
        placeholder="Event Title"
        className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
        onChange={(e) => setTitle(e.target.value)}
        required
        />
        </div>
        <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
         <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Event Description"
           className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
          required
        />
        </div>
        <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <input
          type="file"
          // onChange={(e) => setImage(e.target.value)}
          onChange={(e) => setImage(URL.createObjectURL(e.target.files[0]))}
           className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
          placeholder="Image URL"
          // required
        />  
         {image && <img src={image} alt="Event" style={{ width: "200px", height: "200px" }} />}
        </div>
        
       
       
        <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
        <DatePickerWithRange date={date} setDate={setDate} />
        </div>
        <div className="space-y-2"> 
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories && categories.length > 0 && categories.map((category, index) => (
              <div key={index} className="flex flex-col">
                <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
                <input
                  type="text"
                  value={category.category}
                  onChange={(e) => handleCategoryChange(index, "category", e.target.value)}
                 className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
                  placeholder="Category Name"
                  required
                />
                </div>
                <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
                <input
                  type="text"
                  value={category.price}
                  onChange={(e) => handleCategoryChange(index, "price", e.target.value)}
                  className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
                  placeholder="Price" 
                  required
                />
                </div>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"
                  onClick={() => handleRemoveCategory(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button 
          type="button"
            className="bg-green-500 text-white px-4 py-2 rounded-md mt-2"
            onClick={handleAddCategory}
          >
            Add Category
          </button>
        </div>
       
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Promo Code</h2>
          <div className="p-1 mt-2 gap-3 flex justify-around  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <input
            type="text"
            value={promoCode[0]?.code}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Promo Code"
             className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
          />
          </div>
          <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <button  
          type="button"
           onClick={() => setShowPromoCodes(!showPromoCodes)}
          className="bg-green-500 px-2 py-2 rounded-md min-w-[100px]">
              {showPromoCodes ? "Hide" : "View All"}  Promo Codes
          </button>
          {showPromoCodes && (
      <div
        className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
      >
        {disppromoCode?.map((item, index) => (
          <option key={index} >
            {item.code}
          </option>
        ))}
      </div>
  )}
          </div>
          <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <div className="flex gap-3 items-center justify-stretch pl-3 ">
            <div>
            <input
              type="radio"
              name="discountType"
              value="percentage"
              checked={discountType === "percentage"}
              onChange={() => setDiscountType("percentage")}
               className="bg-secondary border-none "
            />
            <label className="ml-2">Percentage</label>
            </div>
            <div>
            <input
              type="radio"
              name="discountType"
              value="fixed"
              checked={discountType === "fixed"}
              onChange={() => setDiscountType("fixed")}
               className="bg-secondary border-none"
            />
            <label className="ml-2">Fixed Amount</label>
            </div>
             
            </div>
          </div>


          {discountType === "percentage" && (
             <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
            <input
              type="text"
              value={promoCode[0]?.discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              placeholder="Discount Percentage"
               className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
            />
            </div>
          )}
          {discountType === "fixed" && (
             <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
            <input
              type="text"
              value={promoCode[0]?.discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="Discount Price"
              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
            />
            </div>
          )}
           <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <input
            type="text"
            value={promoCode[0]?.maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
            placeholder="Max Uses"
          />
          </div>
          <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          {/* <DatePickerWithRange date={date} setDate={setDate}
         onChange={(e) => setExpiryDate(e.target.value)} />
          */}
            <input
             type="date"
             value={expiryDate}
             onChange={(e) => setExpiryDate(e.target.value)}
             className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
             placeholder="Expiry Date"
          />
          </div>
        </div>
        <div className="flex justify-center">
        <Button className="p-2 mt-2 " type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Event"}
        </Button>
        </div>
      </form>
      </div>
    </div>
  );
};









// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { DatePickerWithRange } from "@/components/DatePicker";
// import { useToast } from "@/components/ui/use-toast";
// import axios from "axios";
// // import InputSelect from "@/components/ClientInputSelect";
// // import ClientTextArea from "@/components/ClientTextArea";
// // import DatePicker from "react-multi-date-picker";
// import { storage } from "@/firebase"; // Import Firebase storage
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// export const EditEvent = () => {
//   const { eventId } = useParams();
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const BASE_URL = import.meta.env.VITE_BASE_URL;

//   const [imageFile, setImageFile] = useState(null); 

//   const [event, setEvent] = useState(null);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [image, setImage] = useState(""); // Use state for image preview
//   const [date, setDate] = useState({ from: null, to: null });
//   const [categories, setCategories] = useState([]); // Store event categories
//   const [promoCode, setPromoCode] = useState([]);
//   const [disppromoCode, setDispPromoCode] = useState([]);
//   const [discountPercentage, setDiscountPercentage] = useState("");
//   const [discountPrice, setDiscountPrice] = useState("");
//   const [expiryDate, setExpiryDate] = useState("");
//   const [maxUses, setMaxUses] = useState("");
//   const [discountType, setDiscountType] = useState("percentage");
//   const [loading, setLoading] = useState(false);
//   const [showPromoCodes, setShowPromoCodes] = useState(false); // State to toggle promo code dropdown visibility


//   useEffect(() => {
//     const fetchEvent = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/events/single-event/${eventId}`);
//         console.log("response+++))++++++++)))_____",res)
//         const eventData = res?.data?.data?.event?.details;
//         // Assuming 'response' is the object you received
//         const ticketTypes = res.data.data.event.ticketTypes;
//         console.log("event loging",eventData);
        

//         const formattedCategories = ticketTypes.map((ticket) => ({
//           category: ticket.category,
//           price: ticket.price,
//         }));
  
//         setCategories(formattedCategories);
  

//         setEvent(eventData);
//         setTitle(eventData.name);
//         setDescription(eventData.description);
//         // setImage(eventData.images[0]);
//         setDate({
//           from: new Date(eventData.dates[0]),
//           to: new Date(eventData.dates[eventData.dates.length - 1]),
//         });
//         // setCategories(res?.data?.data?.event?.ticketTypes?.category); // Set initial categories
//         setPromoCode(eventData?.promoCodes || "");
//         setDispPromoCode(eventData?.promoCodes || "")
//         setDiscountPercentage(eventData.promoCode?.discountPercentage || "");
//         setDiscountPrice(eventData?.promoCode?.discountPrice || "");
//         setExpiryDate(eventData?.promoDetails?.expiryDate || "");
//         setMaxUses(eventData.promoCode?.maxUses || "");
//         setDiscountType(eventData.promoCode?.discountType ||"Percentage" );
//         setImage(eventData.images[0] || ""); // Set initial image
//       } catch (error) {
//         console.error("Error fetching event:", error);
//         toast({
//           title: "Error",
//           description: "Failed to fetch event details",
//           variant: "destructive",
//         });
//       }
//     };
//     fetchEvent();
//   }, [eventId, BASE_URL, toast]); // Include toast dependency
  
//   useEffect(() => {
//     if (event) {
//       setImage(event.images[0]); // Ensure the image state is set when the event data is fetched
//     }
// }, [event]);
  
//  // Handle image upload
//  const handleImageUpload = (e) => {
//   console.log("function called for handle upload")
//   const file = e.target.files[0];
//   if (file) {
//     setImageFile(file);
//     setUploadingImage(true); 
//     const imageRef = ref(storage, `events/${file.name}`);
//     const uploadTask = uploadBytesResumable(imageRef, file);

//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         // Optional: Track progress
//       },
//       (error) => {
//         console.error("Image upload failed:", error);
//         setUploadingImage(false);
//       },
//       () => {
//         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
//           console.log("downloaded url",downloadURL)
//           setImage(downloadURL); // Set the image URL state
//           setUploadingImage(false);
//         });
//       }
//     );
//   }
// };


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
   
//     try {
//       const updatedEvent = {
//         name: title,
//         description,
//         images: [image],
//         dates: [date.from.toISOString(), date.to.toISOString()],
//         promoDetails: {
//           promoCode,
//           discountPercentage:Number(discountPercentage), 
//           discountPrice:Number(discountPrice),
//           discountType,
//           expiryDate:expiryDate ? new Date(expiryDate).toISOString() : "",
//           maxUses:Number(maxUses),
//           applicableCategory: categories[0]?.category
//         },
//         categorys: categories?.map((cat) => ({
//           category: cat.category,
//           price: cat.price,
//         }))
//       };
//       console.log("before calling api ----------------",updatedEvent)
//       const resp = await axios.put(`${BASE_URL}/events/update-event/${eventId}`, updatedEvent);
//       console.log("res after update---",resp)
//       toast({
//         title: "Success",
//         description: "Event updated successfully",
//       });
//       navigate(`/events`); // Redirect after successful update
//       // navigate('/events/update-event')
//     } catch (error) {
//       console.error("Error updating event:", error);
//       // toast({
//       //   title: "Error",
//       //   description: "Failed to update event",
//       //   variant: "destructive",
//       // });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddCategory = () => {
//     setCategories([...categories, { category: "", price: "" }]);
//   };

//   const handleRemoveCategory = (index) => {
//     const updatedCategories = categories.filter((_, i) => i !== index);
//     setCategories(updatedCategories);
//   };

//   const handleCategoryChange = (index, field, value) => {
//     const updatedCategories = [...categories];
//     updatedCategories[index][field] = value;
//     setCategories(updatedCategories);
//   };

//   return (
//     <div className="space-y-4">
//       <h1 className="text-2xl font-bold  text-red-400">Edit Event</h1>
//       <div className="bg-secondary rounded-lg  p-5 w-full lg:w-1/2 space-y-3 shadow-lg">
//       <form onSubmit={handleSubmit}>
//       <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//       <input
//         type="text"
//         value={title}
//         placeholder="Event Title"
//         className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//         onChange={(e) => setTitle(e.target.value)}
//         required
//         />
//         </div>
//         <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//          <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Event Description"
//            className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//           required
//         />
//         </div>
//         <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//           type="file"
//           // onChange={(e) => setImage(e.target.value)}
//           // onChange={(e) => setImage(URL.createObjectURL(e.target.files[0]))}
//           onChange={handleImageUpload} 
//            className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//           placeholder="Image URL"
//           // required
//         />  
//          {image && <img src={image} alt="Event" style={{ width: "200px", height: "200px" }} />}
//         </div>
        
       
       
//         <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//         <DatePickerWithRange date={date} setDate={setDate} />
//         </div>
//         <div className="space-y-2"> 
//           <h2 className="text-lg font-semibold">Categories</h2>
//           <div className="grid grid-cols-2 gap-4">
//             {categories && categories.length > 0 && categories.map((category, index) => (
//               <div key={index} className="flex flex-col">
//                 <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//                 <input
//                   type="text"
//                   value={category.category}
//                   onChange={(e) => handleCategoryChange(index, "category", e.target.value)}
//                  className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
//                   placeholder="Category Name"
//                   required
//                 />
//                 </div>
//                 <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//                 <input
//                   type="text"
//                   value={category.price}
//                   onChange={(e) => handleCategoryChange(index, "price", e.target.value)}
//                   className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
//                   placeholder="Price" 
//                   required
//                 />
//                 </div>
//                 <button
//                   className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"
//                   onClick={() => handleRemoveCategory(index)}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>
//           <button 
//           type="button"
//             className="bg-green-500 text-white px-4 py-2 rounded-md mt-2"
//             onClick={handleAddCategory}
//           >
//             Add Category
//           </button>
//         </div>
       
//         <div className="space-y-4">
//           <h2 className="text-lg font-semibold">Promo Code</h2>
//           <div className="p-1 mt-2 gap-3 flex justify-around  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//             type="text"
//             value={promoCode[0]?.code}
//             onChange={(e) => setPromoCode(e.target.value)}
//             placeholder="Promo Code"
//              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//           />
//           </div>
//           <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <button  
//           type="button"
//            onClick={() => setShowPromoCodes(!showPromoCodes)}
//           className="bg-green-500 px-2 py-2 rounded-md min-w-[100px]">
//               {showPromoCodes ? "Hide" : "View All"}  Promo Codes
//           </button>
//           {showPromoCodes && (
//       <div
//         className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//       >
//         {disppromoCode?.map((item, index) => (
//           <option key={index} >
//             {item.code}
//           </option>
//         ))}
//       </div>
//   )}
//           </div>
//           <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <div className="flex gap-3 items-center justify-stretch pl-3 ">
//             <div>
//             <input
//               type="radio"
//               name="discountType"
//               value="percentage"
//               checked={discountType === "percentage"}
//               onChange={() => setDiscountType("percentage")}
//                className="bg-secondary border-none "
//             />
//             <label className="ml-2">Percentage</label>
//             </div>
//             <div>
//             <input
//               type="radio"
//               name="discountType"
//               value="fixed"
//               checked={discountType === "fixed"}
//               onChange={() => setDiscountType("fixed")}
//                className="bg-secondary border-none"
//             />
//             <label className="ml-2">Fixed Amount</label>
//             </div>
             
//             </div>
//           </div>


//           {discountType === "percentage" && (
//              <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//             <input
//               type="text"
//               value={promoCode[0]?.discountPercentage}
//               onChange={(e) => setDiscountPercentage(e.target.value)}
//               placeholder="Discount Percentage"
//                className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             />
//             </div>
//           )}
//           {discountType === "fixed" && (
//              <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//             <input
//               type="text"
//               value={promoCode[0]?.discountPrice}
//               onChange={(e) => setDiscountPrice(e.target.value)}
//               placeholder="Discount Price"
//               className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             />
//             </div>
//           )}
//            <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//             type="text"
//             value={promoCode[0]?.maxUses}
//             onChange={(e) => setMaxUses(e.target.value)}
//             className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             placeholder="Max Uses"
//           />
//           </div>
//           <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           {/* <DatePickerWithRange date={date} setDate={setDate}
//          onChange={(e) => setExpiryDate(e.target.value)} />
//           */}
//             <input
//              type="date"
//              value={expiryDate}
//              onChange={(e) => setExpiryDate(e.target.value)}
//              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//              placeholder="Expiry Date"
//           />
//           </div>
//         </div>
//         <div className="flex justify-center">
//         <Button className="p-2 mt-2 " type="submit" disabled={loading}>
//           {loading ? "Updating..." : "Update Event"}
//         </Button>
//         </div>
//       </form>
//       </div>
//     </div>
//   );
// };








// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { DatePickerWithRange } from "@/components/DatePicker";
// import { useToast } from "@/components/ui/use-toast";
// import axios from "axios";
// import InputSelect from "@/components/ClientInputSelect";
// import ClientTextArea from "@/components/ClientTextArea";
// import DatePicker from "react-multi-date-picker";

// export const EditEvent = () => {
//   const { eventId } = useParams();
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const BASE_URL = import.meta.env.VITE_BASE_URL;

//   const [event, setEvent] = useState(null);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [image, setImage] = useState(""); // Use state for image preview
//   const [date, setDate] = useState({ from: null, to: null });
//   const [categories, setCategories] = useState([]); // Store event categories
//   const [promoCode, setPromoCode] = useState([]);
//   const [disppromoCode, setDispPromoCode] = useState([]);
//   const [discountPercentage, setDiscountPercentage] = useState("");
//   const [discountPrice, setDiscountPrice] = useState("");
//   const [expiryDate, setExpiryDate] = useState("");
//   const [maxUses, setMaxUses] = useState("");
//   const [discountType, setDiscountType] = useState("percentage");
//   const [loading, setLoading] = useState(false);
//   const [showPromoCodes, setShowPromoCodes] = useState(false); // State to toggle promo code dropdown visibility


//   useEffect(() => {
//     const fetchEvent = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/events/single-event/${eventId}`);
//         console.log("response+++))++++++++)))_____",res)
//         const eventData = res?.data?.data?.event?.details;
//         // Assuming 'response' is the object you received
//         const ticketTypes = res.data.data.event.ticketTypes;
//         console.log("event loging",eventData);
        

//         const formattedCategories = ticketTypes.map((ticket) => ({
//           category: ticket.category,
//           price: ticket.price,
//         }));
  
//         setCategories(formattedCategories);
  

//         setEvent(eventData);
//         setTitle(eventData.name);
//         setDescription(eventData.description);
//         setImage(eventData.images[0]);
//         setDate({
//           from: new Date(eventData.dates[0]),
//           to: new Date(eventData.dates[eventData.dates.length - 1]),
//         });
//         // setCategories(res?.data?.data?.event?.ticketTypes?.category); // Set initial categories
//         setPromoCode(eventData?.promoCodes || "");
//         setDispPromoCode(eventData?.promoCodes || "")
//         setDiscountPercentage(eventData.promoCode?.discountPercentage || "");
//         setDiscountPrice(eventData?.promoCode?.discountPrice || "");
//         setExpiryDate(eventData?.promoDetails?.expiryDate || "");
//         setMaxUses(eventData.promoCode?.maxUses || "");
//         setDiscountType(eventData.promoCode?.discountType ||"Percentage" );
//       } catch (error) {
//         console.error("Error fetching event:", error);
//         toast({
//           title: "Error",
//           description: "Failed to fetch event details",
//           variant: "destructive",
//         });
//       }
//     };
//     fetchEvent();
//   }, [eventId, BASE_URL, toast]); // Include toast dependency

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
   
//     try {
//       const updatedEvent = {
//         name: title,
//         description,
//         images: [image],
//         dates: [date.from.toISOString(), date.to.toISOString()],
//         promoDetails: {
//           promoCode,
//           discountPercentage:Number(discountPercentage), 
//           discountPrice:Number(discountPrice),
//           discountType,
//           expiryDate:expiryDate ? new Date(expiryDate).toISOString() : "",
//           maxUses:Number(maxUses),
//           applicableCategory: categories[0]?.category
//         },
//         categorys: categories?.map((cat) => ({
//           category: cat.category,
//           price: cat.price,
//         }))
//       };
//       console.log("before calling api ----------------",updatedEvent)
//       const resp = await axios.put(`${BASE_URL}/events/update-event/${eventId}`, updatedEvent);
//       console.log("res after update---",resp)
//       toast({
//         title: "Success",
//         description: "Event updated successfully",
//       });
//       navigate(`/events`); // Redirect after successful update
//       // navigate('/events/update-event')
//     } catch (error) {
//       console.error("Error updating event:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update event",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddCategory = () => {
//     setCategories([...categories, { category: "", price: "" }]);
//   };

//   const handleRemoveCategory = (index) => {
//     const updatedCategories = categories.filter((_, i) => i !== index);
//     setCategories(updatedCategories);
//   };

//   const handleCategoryChange = (index, field, value) => {
//     const updatedCategories = [...categories];
//     updatedCategories[index][field] = value;
//     setCategories(updatedCategories);
//   };

//   return (
//     <div className="space-y-4">
//       <h1 className="text-2xl font-bold  text-red-400">Edit Event</h1>
//       <div className="bg-secondary rounded-lg  p-5 w-full lg:w-1/2 space-y-3 shadow-lg">
//       <form onSubmit={handleSubmit}>
//       <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//       <input
//         type="text"
//         value={title}
//         placeholder="Event Title"
//         className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//         onChange={(e) => setTitle(e.target.value)}
//         required
//         />
//         </div>
//         <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//          <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Event Description"
//            className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//           required
//         />
//         </div>
//         <div className="p-1 gap-3 mt-2 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//           type="file"
//           // onChange={(e) => setImage(e.target.value)}
//           onChange={(e) => setImage(URL.createObjectURL(e.target.files[0]))}
//            className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
//           placeholder="Image URL"
//           required
//         />  
//          {image && <img src={image} alt="Event" style={{ width: "200px", height: "200px" }} />}
//         </div>
        
       
       
//         <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//         <DatePickerWithRange date={date} setDate={setDate} />
//         </div>
//         <div className="space-y-2"> 
//           <h2 className="text-lg font-semibold">Categories</h2>
//           <div className="grid grid-cols-2 gap-4">
//             {categories && categories.length > 0 && categories.map((category, index) => (
//               <div key={index} className="flex flex-col">
//                 <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//                 <input
//                   type="text"
//                   value={category.category}
//                   onChange={(e) => handleCategoryChange(index, "category", e.target.value)}
//                  className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
//                   placeholder="Category Name"
//                   required
//                 />
//                 </div>
//                 <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//                 <input
//                   type="text"
//                   value={category.price}
//                   onChange={(e) => handleCategoryChange(index, "price", e.target.value)}
//                   className="bg-secondary border-none p-1 pl-5 w-full outline-none flex-1"
//                   placeholder="Price" 
//                   required
//                 />
//                 </div>
//                 <button
//                   className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"
//                   onClick={() => handleRemoveCategory(index)}
//                 >
//                   Remove
//                 </button>
//               </div>
//             ))}
//           </div>
//           <button 
//           type="button"
//             className="bg-green-500 text-white px-4 py-2 rounded-md mt-2"
//             onClick={handleAddCategory}
//           >
//             Add Category
//           </button>
//         </div>
       
//         <div className="space-y-4">
//           <h2 className="text-lg font-semibold">Promo Code</h2>
//           <div className="p-1 mt-2 gap-3 flex justify-around  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//             type="text"
//             value={promoCode[0]?.code}
//             onChange={(e) => setPromoCode(e.target.value)}
//             placeholder="Promo Code"
//              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//           />
//           </div>
//           <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <button  
//           type="button"
//            onClick={() => setShowPromoCodes(!showPromoCodes)}
//           className="bg-green-500 px-2 py-2 rounded-md min-w-[100px]">
//               {showPromoCodes ? "Hide" : "View"}  Promo 
//           </button>
//           {showPromoCodes && (
//       <select
//         className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//       >
//         {disppromoCode?.map((item, index) => (
//           <option key={index} >
//             {item.code}
//           </option>
//         ))}
//       </select>
//   )}
//           </div>
//           <div className="p-2 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <div className="flex gap-3 items-center justify-stretch pl-3 ">
//             <div>
//             <input
//               type="radio"
//               name="discountType"
//               value="percentage"
//               checked={discountType === "percentage"}
//               onChange={() => setDiscountType("percentage")}
//                className="bg-secondary border-none "
//             />
//             <label className="ml-2">Percentage</label>
//             </div>
//             <div>
//             <input
//               type="radio"
//               name="discountType"
//               value="fixed"
//               checked={discountType === "fixed"}
//               onChange={() => setDiscountType("fixed")}
//                className="bg-secondary border-none"
//             />
//             <label className="ml-2">Fixed Amount</label>
//             </div>
             
//             </div>
//           </div>


//           {discountType === "percentage" && (
//              <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//             <input
//               type="text"
//               value={promoCode[0]?.discountPercentage}
//               onChange={(e) => setDiscountPercentage(e.target.value)}
//               placeholder="Discount Percentage"
//                className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             />
//             </div>
//           )}
//           {discountType === "fixed" && (
//              <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//             <input
//               type="text"
//               value={promoCode[0]?.discountPrice}
//               onChange={(e) => setDiscountPrice(e.target.value)}
//               placeholder="Discount Price"
//               className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             />
//             </div>
//           )}
//            <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           <input
//             type="text"
//             value={promoCode[0]?.maxUses}
//             onChange={(e) => setMaxUses(e.target.value)}
//             className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//             placeholder="Max Uses"
//           />
//           </div>
//           <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
//           {/* <DatePickerWithRange date={date} setDate={setDate}
//          onChange={(e) => setExpiryDate(e.target.value)} />
//           */}
//             <input
//              type="date"
//              value={expiryDate}
//              onChange={(e) => setExpiryDate(e.target.value)}
//              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
//              placeholder="Expiry Date"
//           />
//           </div>
//         </div>
//         <div className="flex justify-center">
//         <Button className="p-2 mt-2 " type="submit" disabled={loading}>
//           {loading ? "Updating..." : "Update Event"}
//         </Button>
//         </div>
//       </form>
//       </div>
//     </div>
//   );
// };





