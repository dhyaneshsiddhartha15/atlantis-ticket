import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/DatePicker";
import useFirebaseUpload from "@/hooks/use-firebaseUpload";
import { useToast } from "@/components/ui/use-toast";

const EventTitle = ({
    setTitle,
    title,
    setDescription,
    description,
    setShowTitleField,
    setImage,
    image,
    date,
    setDate,
    iosdate,
    setCategorys,
    categorys,
    handleConfirm,
    eventId,
    typeOne,
    typeTwo,
}) => {
    const [loading, setLoading] = useState(false);
    const [img, setImg] = useState(image);
    const [promoCode, setPromoCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [includePromoCode, setIncludePromoCode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { progress, error, downloadURL } = useFirebaseUpload(img);
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (error) {
            console.log(error);
            setLoading(false);
            return;
        } else if (downloadURL) {
            setImage(downloadURL);
            setLoading(false);
        }
    }, [error, downloadURL]);

    const handleFileChange = (e) => {
        setImg(e.target.files[0]);
        setLoading(true);
    };

    const handleNext = () => {
        if (step === 1) {
            if (
                title.trim() &&
                description.trim() &&
                iosdate &&
                iosdate.length > 0 &&
                image
            ) {
                setStep(2);
            } else {
                toast({
                    variant: "destructive",
                    title: "All fields are required",
                });
            }
        } else if (step === 2) {
            if (categorys.length === 0 || categorys.some(cat => !cat.category || !cat.price)) {
                toast({
                    variant: "destructive",
                    title: "Please add at least one category with name and price",
                });
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (includePromoCode) {
                if (
                    !promoCode ||
                    (discountType === 'percentage' && !discountPercentage) ||
                    (discountType === 'fixed' && !discountPrice) ||
                    !expiryDate ||
                    !maxUses ||
                    !selectedCategory
                ) {
                    toast({
                        variant: "destructive",
                        title: "Please provide complete promo code details and select a category.",
                    });
                    return;
                }
            }

            handleConfirm(setLoading, {
                promoCode: includePromoCode ? promoCode : "",
                discountPercentage: includePromoCode ? discountPercentage : "",
                discountPrice: includePromoCode ? discountPrice : "",
                discountType: includePromoCode ? discountType : "",
                expiryDate: includePromoCode ? expiryDate : "",
                maxUses: includePromoCode ? maxUses : "",
                applicableCategory: includePromoCode ? selectedCategory : "",
            });
        }
    };

    const handleAddCategory = () => {
        setCategorys([...categorys, { category: "", price: "" }]);
    };

    const handleCategoryChange = (index, field, value) => {
        const updatedCategories = [...categorys];
        updatedCategories[index][field] = value;
        setCategorys(updatedCategories);
    };

    const handleRemoveCategory = (index) => {
        const updatedCategories = categorys.filter((_, i) => i !== index);
        setCategorys(updatedCategories);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80">
            <div className="fixed overflow-hidden left-[50%] top-[50%] z-50 grid w-full max-w-[900px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                <div className="flex">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-5">
                            <h1 className="text-center text-xl font-bold">
                                {step === 1 ? "Create Event" : step === 2 ? "Create Tickets" : "Add Promo Code"}
                            </h1>
                            <div>
                                <Button
                                    onClick={() => {
                                        if (loading) return;
                                        if (step > 1) return setStep(step - 1);
                                        return setShowTitleField(false);
                                    }}
                                >
                                    {step === 1 ? "Close" : "Back"}
                                </Button>
                                &nbsp;&nbsp;&nbsp;
                                <Button
                                    onClick={() => {
                                        if (loading) return;
                                        handleNext();
                                    }}
                                >
                                    {loading ? (
                                        <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                                    ) : step === 3 ? (
                                        "Create"
                                    ) : (
                                        "Next"
                                    )}
                                </Button>
                            </div>
                        </div>
                        {step === 1 && (
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="bg-input rounded-[25px] h-full overflow-hidden border group shadow-custom">
                                        <label className="h-full min-h-[300px] cursor-pointer flex items-center justify-center">
                                            <input
                                                type="file"
                                                className="hidden w-full"
                                                onChange={handleFileChange}
                                            />
                                            {image ? (
                                                <div className="relative">
                                                    <img
                                                        src={image}
                                                        className="w-full h-full max-h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-70 transition duration-300"></div>
                                                </div>
                                            ) : (
                                                <ImageIcon className="size-20 text-gray-400" />
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-5">
                                    <input
                                        type="text"
                                        className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Event Title"
                                    />
                                    <DatePickerWithRange
                                        date={date}
                                        setDate={setDate}
                                        className="bg-input rounded-[25px] w-full shadow-custom"
                                    />
                                    <textarea
                                        rows="5"
                                        className="bg-input rounded-[25px] p-4 w-full shadow-custom resize-none overflow-auto box-border h-[60%]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Event Description"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 space-y-5">
                        {step === 2 && (
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="flex-1">
                                    <div className="md:flex gap-2 justify-between mb-4">
                                        <div className="flex-1">
                                            <button
                                              className="w-full rounded-md hover:bg-secondary px-5 py-3"
                                                onClick={() => setCategorys(typeOne)}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                 className="w-full rounded-md hover:bg-secondary px-5 py-3 mt-2"
                                                onClick={() => setCategorys(typeTwo)}
                                            >
                                                Premium
                                            </button>
                                        </div>
                                    </div>
                                    
                                    
                                    {categorys && (
                                       <div className="w-full flex-1 space-y-3">
                                            {categorys.map((category, index) => (
                                                <div key={index} className="bg-input rounded-[25px] p-4 shadow-custom">
                                                      <input
                                                            type="text"
                                                            className="bg-input rounded-[25px] p-2 w-full"
                                                            placeholder="Category"
                                                            value={category.category}
                                                            onChange={(e) =>
                                                                handleCategoryChange(
                                                                    index,
                                                                    "category",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                   
                                                   <input
                                                            type="number"
                                                            className="bg-input rounded-[25px] p-2 w-full mt-2"
                                                            placeholder="Price"
                                                            value={category.price}
                                                            onChange={(e) =>
                                                                handleCategoryChange(
                                                                    index,
                                                                    "price",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    <button
                                                        className="text-white bg-red-600 mt-2 px-4 py-1 rounded-xl"
                                                        onClick={() => handleRemoveCategory(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <button
                                                className="w-full rounded-md bg-primary py-2 text-white"
                                                onClick={handleAddCategory}
                                            >
                                                Add Category
                                            </button>
                                        </div>
                                        
                                    )}
                                </div>
                                
                              
                            </div>
                            
                        )}
                        </div>
                        {step === 3 && (
    <div className="flex flex-col gap-6 p-6 bg-white shadow-md rounded-lg dark:bg-gray-800 dark:shadow-lg">
        <div className="flex items-center space-x-3">
            <input
                type="checkbox"
                id="includePromoCode"
                className="form-checkbox h-5 w-5 text-indigo-600 dark:text-indigo-400"
                checked={includePromoCode}
                onChange={() => setIncludePromoCode(!includePromoCode)}
            />
            <label htmlFor="includePromoCode" className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Add Promo Code
            </label>
        </div>
        {includePromoCode && (
            <>
                <input
                    type="text"
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                    placeholder="Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                />
                <div className="mt-2">
                    <select
                        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                    >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                    </select>
                </div>
                {discountType === "percentage" && (
                    <input
                        type="text"
                        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                        placeholder="Discount Percentage"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                    />
                )}
                {discountType === "fixed" && (
                    <input
                        type="text"
                        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                        placeholder="Discount Price"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                    />
                )}
                <input
                    type="text"
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                    placeholder="Max Uses"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                />
                <input
                    type="date"
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                    placeholder="Expiry Date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                />
                <select
                    className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-400"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">Select Category for Promo Code</option>
                    {categorys.map((cat, index) => (
                        <option key={index} value={cat.category}>
                            {cat.category}
                        </option>
                    ))}
                </select>
            </>
        )}
    </div>
)}


                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventTitle;