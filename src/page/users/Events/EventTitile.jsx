import React, { useEffect, useState } from "react";
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
    const [promoCodeDiscount, setPromoCodeDiscount] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState("");
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
            // Check promo code fields only if they are provided
            if (
                (promoCode && !promoCodeDiscount) ||
                (promoCodeDiscount && !expiryDate) ||
                (expiryDate && !maxUses)
            ) {
                toast({
                    variant: "destructive",
                    title: "Please provide complete promo code details if you include one.",
                });
                return;
            }

            // Call API to add promo code if details are provided
            if (promoCode && promoCodeDiscount && expiryDate && maxUses) {
                addPromoCode(promoCode, promoCodeDiscount, expiryDate, maxUses)
                    .then(() => {
                        toast({
                            variant: "success",
                            title: "Promo code added successfully.",
                        });
                    })
                    .catch(() => {
                        toast({
                            variant: "destructive",
                            title: "Failed to add promo code.",
                        });
                    });
            }

            handleConfirm(setLoading);
        }
    };

    const addPromoCode = async (code, discount, expiryDate, maxUses) => {
        try {
            const response = await fetch("http://localhost:8081/api/v1/events/add-promo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    discountPercentage: parseFloat(discount),
                    expiresAt: new Date(expiryDate).toISOString(),
                    isActive: true,
                    maxUses: parseInt(maxUses, 10),
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to create promo code");
            }
            return response.json();
        } catch (error) {
            throw error;
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
                                {step === 1 ? "Create Event" : "Create Tickets"}
                            </h1>
                            <div>
                                <Button
                                    onClick={() => {
                                        if (loading) return;
                                        if (step === 2) return setStep(1);

                                        return setShowTitleField(false);
                                    }}
                                >
                                    {step === 1 ? "Close" : "Back"}
                                </Button>{" "}
                                &nbsp;&nbsp;&nbsp;
                                <Button
                                    onClick={() => {
                                        if (loading) return;
                                        handleNext();
                                    }}
                                >
                                    {loading ? (
                                        <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                                    ) : step === 1 ? (
                                        "Next"
                                    ) : (
                                        "Create"
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div
                            className={`flex flex-col sm:flex-row gap-5 transition-transform duration-300 ${
                                step === 1
                                    ? "translate-x-0"
                                    : "-translate-x-full"
                            }`}
                        >
                            <div className="flex-1">
                                {step === 1 && (
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
                                                    <div
                                                        className={`absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-70 transition duration-300`}
                                                    ></div>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="size-20 text-gray-400" />
                                                </>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-5">
                                {step === 1 && (
                                    <>
                                        <input
                                            type="text"
                                            className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
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
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            placeholder="Event Description"
                                        />
                                    </>
                                )}
                            </div>
                            {step === 2 && (
                                <div
                                    className={`flex w-full h-full flex-col sm:flex-row gap-5 transition-transform duration-300 ${
                                        step === 2
                                            ? "translate-x-full"
                                            : "-translate-x-0"
                                    }`}
                                >
                                    <div className="flex-1">
                                        {step === 2 && (
                                            <div className="md:flex gap-2 justify-between">
                                                <div className="flex-1">
                                                    <button
                                                        className="w-full rounded-md hover:bg-secondary px-5 py-3"
                                                        onClick={() => {
                                                            setCategorys(typeOne);
                                                        }}
                                                    >
                                                        Standard
                                                    </button>

                                                    <button
                                                        className="w-full rounded-md hover:bg-secondary px-5 py-3 mt-2"
                                                        onClick={() => {
                                                            setCategorys(typeTwo);
                                                        }}
                                                    >
                                                        New
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-5">
                                        {step === 2 && (
                                            <div className="w-full flex-1 space-y-3">
                                                {categorys.map((category, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-input rounded-[25px] p-4 shadow-custom"
                                                    >
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
                                                            className="text-red-500 mt-2"
                                                            onClick={() =>
                                                                handleRemoveCategory(
                                                                    index
                                                                )
                                                            }
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
                                    {step === 2 && (
                                        <div className="flex flex-col space-y-4">
                                            <input
                                                type="text"
                                                className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                                placeholder="Promo Code"
                                                value={promoCode}
                                                onChange={(e) =>
                                                    setPromoCode(e.target.value)
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                                placeholder="Promo Code Discount (%)"
                                                value={promoCodeDiscount}
                                                onChange={(e) =>
                                                    setPromoCodeDiscount(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <input
                                                type="date"
                                                className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                                placeholder="Expiry Date"
                                                value={expiryDate}
                                                onChange={(e) =>
                                                    setExpiryDate(e.target.value)
                                                }
                                            />
                                            <input
                                                type="number"
                                                className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                                                placeholder="Max Uses"
                                                value={maxUses}
                                                onChange={(e) =>
                                                    setMaxUses(e.target.value)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventTitle;
