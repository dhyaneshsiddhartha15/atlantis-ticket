import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const PaymentSummary = ({
    code,
    setCode,
    originalTotalCost,
    totalCost,
    handlePayment,
    setEmail,
    email,
    handleApplyPromoCode,
    handleBookTicket,  
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [booking, setBooking] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const onApplyPromoCode = async () => {
        setApplyingPromo(true);
        try {
            await handleApplyPromoCode(code);
        } catch (error) {
            console.error("Error applying promo code:", error);
            toast({
                title: "Promo Code Error",
                description: "An error occurred while applying the promo code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setApplyingPromo(false);
        }
    };
    const onBookTicket = async () => {
        if (!email || !emailRegex.test(email.trim())) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }

        setBooking(true);
        try {
            await handleBookTicket(); 
            toast({
                title: "Ticket Booked",
                description: "Your ticket has been successfully booked.",
                variant: "default",
            });
        } catch (error) {
            console.error("Booking error:", error);
            toast({
                title: "Booking Error",
                description: "An error occurred while booking your ticket. Please try again.",
                variant: "destructive",
            });
        } finally {
            setBooking(false);
        }
    };

    const onPayWithSkipCash = async () => {
        if (!email || !emailRegex.test(email.trim())) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await handlePayment(setLoading); 
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment Error",
                description: "An error occurred while processing your payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-secondary rounded-lg p-5 w-full lg:w-1/2 space-y-3 shadow-lg">
            <h1 className="text-xl">Payment Summary</h1>
            <p>Please review the details below and proceed with your payment.</p>
            <div className="p-1 flex shadow-custom rounded-sm overflow-hidden dark:border border-background dark:border-[1px]">
                <input
                    type="text"
                    placeholder="Voucher Code / Promo Code"
                    className="bg-secondary border-none p-3 pl-5 w-full outline-none flex-1"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <Button
                    variant="outline"
                    disabled={!code || applyingPromo}
                    className="h-[3.2rem] rounded-md"
                    onClick={onApplyPromoCode}
                >
                    {applyingPromo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "Apply"
                    )}
                </Button>
            </div>
            <div>
                <p>
                    <span className="text-xl">Sub Total:</span> {originalTotalCost}
                </p>
                {originalTotalCost !== totalCost && (
                    <p>
                        <span className="text-xl">Discounted Total:</span> {totalCost}
                    </p>
                )}
                <p>
                    <span className="text-2xl">Total:</span> {totalCost}
                </p>
            </div>
            <div className="space-y-2">
                <input
                    type="email"
                    className="bg-input rounded-md p-3 pl-5 w-full shadow-custom"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                    className="w-full md:w-1/2" 
                    disabled={booking}
                    onClick={onBookTicket}
                >
                    {booking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "Book Ticket"
                    )}
                </Button>
                {/* <Button 
                    className="w-full md:w-1/2 mt-3" 
                    disabled={loading || booking}
                    onClick={onPayWithSkipCash}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        "Pay with SkipCash"
                    )}
                </Button> */}
            </div>
        </div>
    );
};

export default PaymentSummary;
