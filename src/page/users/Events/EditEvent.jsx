import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/DatePicker";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import InputSelect from "@/components/ClientInputSelect";
import ClientTextArea from "@/components/ClientTextArea";

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
  const [promoCode, setPromoCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/events/single-event/${eventId}`);
        const eventData = res?.data?.data?.event?.details;
        setEvent(eventData);
        setTitle(eventData.name);
        setDescription(eventData.description);
        setImage(eventData.images[0]);
        setDate({
          from: new Date(eventData.dates[0]),
          to: new Date(eventData.dates[eventData.dates.length - 1]),
        });
        setCategories(eventData.categorys); // Set initial categories
        setPromoCode(eventData.promoDetails.promoCode || "");
        setDiscountPercentage(eventData.promoDetails.discountPercentage || "");
        setDiscountPrice(eventData.promoDetails.discountPrice || "");
        setExpiryDate(eventData.promoDetails.expiryDate || "");
        setMaxUses(eventData.promoDetails.maxUses || "");
        setDiscountType(eventData.promoDetails.discountType || "percentage");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedEvent = {
        name: title,
        description,
        images: [image],
        dates: [date.from.toISOString(), date.to.toISOString()],
        categorys,
        promoDetails: {
          promoCode,
          discountPercentage,
          discountPrice,
          expiryDate,
          maxUses,
          discountType,
        },
      };
      await axios.put(`${BASE_URL}/events/update-event/${eventId}`, updatedEvent);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate(`/events`); // Redirect after successful update
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
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
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
           className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
          placeholder="Image URL"
          required
        />
        </div>
        
       
       
        <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
        <DatePickerWithRange date={date} setDate={setDate} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories && categories.length > 0 && categories.map((category, index) => (
              <div key={index} className="flex flex-col">
                <input
                  type="text"
                  value={category.category}
                  onChange={(e) => handleCategoryChange(index, "category", e.target.value)}
                  placeholder="Category Name"
                  required
                />
                <input
                  type="text"
                  value={category.price}
                  onChange={(e) => handleCategoryChange(index, "price", e.target.value)}
                  placeholder="Price"
                  required
                />
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
            className="bg-green-500 text-white px-4 py-2 rounded-md mt-2"
            onClick={handleAddCategory}
          >
            Add Category
          </button>
        </div>
       
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Promo Code</h2>
          <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Promo Code"
             className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
          />
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
              value={discountPercentage}
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
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="Discount Price"
              className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
            />
            </div>
          )}
           <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
          <input
            type="text"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="bg-secondary border-none p-2 pl-5 w-full outline-none flex-1"
            placeholder="Max Uses"
          />
          </div>
          <div className="p-1 mt-2 gap-3 flex flex-col  shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
           
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