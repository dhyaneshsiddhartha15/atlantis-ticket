import React, { useState, useEffect } from "react";
import TicketBox from "./TicketBox";
import PaymentSummary from "./PaymentSummary";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";

const BookEvents = () => {
    const [ticketCounts, setTicketCounts] = useState({});
    const [email, setEmail] = useState("");
    const [types, setTypes] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [originalTotalCost, setOriginalTotalCost] = useState(0);
    const [code, setCode] = useState("");
    const [originalPrices, setOriginalPrices] = useState({});
    const [discountInfo, setDiscountInfo] = useState(null);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((state) => state.user);
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const { toast } = useToast();
    const { eventId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const getTicketTypes = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/tickets/types/${eventId}`);
                const ticketTypes = res.data.ticketTypes;
                setTypes(ticketTypes);

                const initialCounts = ticketTypes.reduce((acc, { _id }) => {
                    acc[_id] = 0;
                    return acc;
                }, {});
                setTicketCounts(initialCounts);

                const prices = ticketTypes.reduce((acc, { _id, price }) => {
                    acc[_id] = price;
                    return acc;
                }, {});
                setOriginalPrices(prices);
            } catch (error) {
                console.error("Error fetching ticket types:", error);
                toast({
                    title: "Error",
                    description: "Unable to fetch ticket types. Please try again later.",
                    variant: "destructive",
                });
            }
        };

        getTicketTypes();
    }, [eventId, BASE_URL, toast]);

    useEffect(() => {
        calculateTotalCost(ticketCounts, discountInfo);
    }, [ticketCounts, discountInfo]);

    const calculateTotalCost = (counts, discount) => {
        let total = 0;
        for (const [typeId, count] of Object.entries(counts)) {
            total += originalPrices[typeId] * count;
        }
        setOriginalTotalCost(total);

        if (discount) {
            if (discount.discountType === "percentage") {
                total *= 1 - discount.discountValue / 100;
            } else {
                total -= discount.discountValue;
            }
        }

        setTotalCost(Math.max(total, 0));
    };

    const handleApplyPromoCode = async () => {
        if (!code) {
            return toast({
                title: "Promo Code Error",
                description: "Please enter a promo code.",
                variant: "destructive",
            });
        }

        // const selectedTicketTypes = Object.keys(ticketCounts).filter(
        //     (typeId) => ticketCounts[typeId] > 0
        // );
        const selectedTicketTypes = types
        .filter((ticketType) => ticketCounts[ticketType._id] > 0)
        .map((ticketType) => ticketType.category);
        
        if (selectedTicketTypes.length === 0) {
            return toast({
                title: "Promo Code Error",
                description: "Please select at least one ticket type.",
                variant: "destructive",
            });
        }
        try {
            const response = await axios.post(`${BASE_URL}/events/apply-promo/${eventId}`, {
                promoCode: code,
                ticketType: selectedTicketTypes,
            });

            if (response.data.success) {
                setDiscountInfo(response.data.discountInfo);
                calculateTotalCost(ticketCounts, response.data.discountInfo);
                toast({
                    title: "Promo Code Applied",
                    description: response.data.message,
                    variant: "success",
                });
            } else {
                toast({
                    title: "Promo Code Error",
                    description: response.data.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error applying promo code:", error);
            toast({
                title: "Promo Code Error",
                description: error.response?.data?.message || "An error occurred while applying the promo code.",
                variant: "destructive",
            });
        }
    };

    const handleBookTicket = async () => {
        setLoading(true);
        try {
            const tickets = Object.entries(ticketCounts)
                .filter(([_, quantity]) => quantity > 0)
                .map(([type, quantity]) => ({ type, quantity }));

            if (tickets.length === 0) {
                setLoading(false);
                return toast({
                    title: "Booking Incomplete",
                    description: "Please select at least one ticket before proceeding.",
                    variant: "destructive",
                });
            }

            const response = await axios.post(`${BASE_URL}/tickets/bookings`, {
                emailId: email,
                eventId: eventId,
                tickets,
                promoCode: code,
            });

            if (response.status === 201) {
                const { payUrl } = response.data;
                setPaymentInitiated(true);
                window.location.href = payUrl;
                toast({
                    title: "Tickets Booked",
                    description: "Your tickets have been booked. Please proceed to payment.",
                    variant: "success",
                });
            } else {
                toast({
                    title: "Booking Failed",
                    description: response.data.message || "There was an issue with booking your tickets. Please try again later.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error booking tickets:", error);
            toast({
                title: "Booking Failed",
                description: error.response?.data?.message || "There was an issue with booking your tickets. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="book-events-container">
            <div className="flex flex-wrap gap-5 mb-5">
                {types.map((type) => (
                    <TicketBox
                        key={type._id}
                        id={type._id}
                        type={type.category}
                        ticketCount={ticketCounts}
                        setTicketCount={setTicketCounts}
                        price={type.price}
                        setTotalCost={setTotalCost}
                    />
                ))}
            </div>

            <PaymentSummary
                totalCost={totalCost}
                originalTotalCost={originalTotalCost}
                code={code}
                setCode={setCode}
                setEmail={setEmail}
                email={email}
                handleApplyPromoCode={handleApplyPromoCode}
                handleBookTicket={handleBookTicket}
                paymentInitiated={paymentInitiated}
                loading={loading}
            />
        </div>
    );
};

export default BookEvents;