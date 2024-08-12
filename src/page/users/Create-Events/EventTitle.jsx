import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/DatePicker";
import useFirebaseUpload from "@/hooks/use-firebaseUpload";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios'; // Ensure you have axios installed or use fetch

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
}) => {
    const [loading, setLoading] = useState(false);
    const [img, setImg] = useState(image);
    const [promoCode, setPromoCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [isActive, setIsActive] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { progress, error, downloadURL, fileName } = useFirebaseUpload(img);

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

    const handleSave = async () => {
        if (loading) return;

        if (iosdate?.length < 1) {
            return toast({
                variant: "destructive",
                title: "Date is missing",
                description: "Select date properly",
            });
        }

        if (title.trim() && description.trim() && image) {
            setShowTitleField(false);

            // Save event logic goes here

            // Example of saving promo code
            try {
                await axios.post('http://localhost:8081/api/v1/events/add-promo', {
                    code: promoCode,
                    discountPercentage,
                    expiresAt,
                    isActive
                });
                toast({
                    variant: "success",
                    title: "Promo code added successfully",
                });
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error adding promo code",
                    description: error.response?.data?.message || "An error occurred.",
                });
            }
        } else {
            return toast({
                variant: "destructive",
                title: "All the fields are required",
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[900px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                <div className="flex justify-between items-center">
                    <h1 className="text-center text-xl font-bold">
                        Create Event
                    </h1>
                    <div>
                        <Button
                            onClick={() => {
                                if (loading) return;
                                return navigate("/users/events");
                            }}
                        >
                            Close
                        </Button>{" "}
                        &nbsp;&nbsp;&nbsp;
                        <Button
                            onClick={handleSave}
                        >
                            {loading ? (
                                <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1 ">
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
                        {/* Promo Code Details */}
                        <input
                            type="text"
                            className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Promo Code"
                        />
                        <input
                            type="number"
                            className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(e.target.value)}
                            placeholder="Discount Percentage"
                        />
                        <input
                            type="date"
                            className="bg-input rounded-[25px] p-2 w-full shadow-custom"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            placeholder="Expires At"
                        />
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                Active
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventTitle;
