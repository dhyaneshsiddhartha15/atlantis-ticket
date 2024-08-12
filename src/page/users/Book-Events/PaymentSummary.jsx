import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const PaymentSummary = ({
    code,
    setCode,
    totalCost,
    handlePayment,
    setEmail,
    email,
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleApplyPromoCode = () => {
        // Assuming you have a way to verify the promo code validity
        // You may want to call an API here or have a function to check the promo code
        return toast({
            title: "Promo Code Applied",
            description: `Promo code "${code}" has been successfully applied.`,
            variant: "success",
        });
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
                    disabled={!code}
                    className="h-[3.2rem] rounded-md"
                    onClick={handleApplyPromoCode}
                >
                    Apply
                </Button>
            </div>
            <div>
                <p>
                    <span className="text-xl">Sub Total :</span> {totalCost}
                </p>
                <p>
                    <span className="text-2xl">Total:</span> {totalCost}
                </p>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full md:w-1/2" disabled={loading}>
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Proceed to Payment"
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Complete Your Booking</DialogTitle>
                        <DialogDescription>
                            To finalize your booking, please enter your email
                            address. A confirmation email with the booking
                            details will be sent to you.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <input
                                type="email"
                                className="bg-input rounded-md p-3 pl-5 w-full shadow-custom"
                                placeholder="Your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <DialogClose asChild>
                            <Button
                                onClick={() => {
                                    if (!email || email.trim().length === 0) {
                                        return toast({
                                            title: "Payment Failed",
                                            description:
                                                "Please enter a valid email address.",
                                            variant: "destructive",
                                        });
                                    }
                                    if (!emailRegex.test(email.trim())) {
                                        return toast({
                                            title: "Payment Failed",
                                            description:
                                                "The email address you entered is invalid. Please enter a valid email address.",
                                            variant: "destructive",
                                        });
                                    }

                                    handlePayment(setLoading);
                                }}
                            >
                                Confirm Payment
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentSummary;
