import React, { useEffect, useState } from "react";
import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import EventTitle from "./EventTitile";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";

const Events = () => {
    const typeOne = [
        { category: "First class", price: "0" },
        { category: "Second class", price: "0" },
        { category: "Third class", price: "0" },
    ];

    const typeTwo = [
        { category: "", price: "0" },
    ];

    const [event, setEvent] = useState("Upcoming");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [categorys, setCategorys] = useState(typeOne);

    const [showTitleField, setShowTitleField] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [date, setDate] = useState(null);
    const [tempDate, setTempDate] = useState({ from: null, to: null });
    const { toast } = useToast();

    useEffect(() => {
        if (!tempDate.from || !tempDate.to) return;

        function normalizeToUTC(date) {
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        }

        const fromDate = normalizeToUTC(new Date(tempDate.from));
        const toDate = normalizeToUTC(new Date(tempDate.to));

        function formatUTCISO(date) {
            return date.toISOString().split(".")[0] + "Z";
        }

        const dates = [];
        for (let dt = new Date(fromDate); dt <= toDate; dt.setDate(dt.getDate() + 1)) {
            dates.push(formatUTCISO(new Date(dt)));
        }

        setDate(dates);
        toast({
            title: "Date selected",
            description: `From: ${dates[0].split("T")[0]} || To: ${dates[dates.length - 1].split("T")[0]}`,
        });
    }, [tempDate, toast]);

    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();

    const handleCreateEvent = async () => {
        try {
            // Handle response
            navigate("/users/events");
        } catch (error) {
            console.error("Error creating event:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (setLoadingInBox, promoDetails) => {
        try {
            console.log('Promo Details:', promoDetails); // Debugging
            setLoadingInBox(true);
            setLoading(true);
           console.log("user from redux",user)
            const eventDetails = {
                name: title,
                description: description,
                images: [image],
                dates: date,
                promoDetails: promoDetails,
                userId:user.id
            };
    
            const res = await axios.post(`${BASE_URL}/events`, {
                event: eventDetails,
                categorys,
            });
    
            setEvents({ Upcoming: res.data.Upcoming, Past: res.data.Past });
            setShowTitleField(false);
        } catch (error) {
            console.log(error);
            toast({
                description: "Something went wrong, please try again later",
            });
        } finally {
            setLoading(false);
            setLoadingInBox(false);
        }
    };
    

    useEffect(() => {
        const getEvents = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${BASE_URL}/events`);
                setEvents({ Upcoming: res.data.Upcoming, Past: res.data.Past });
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        getEvents();
    }, [BASE_URL]);

    return (
        <div>
            {showTitleField && (
                <EventTitle
                    setShowTitleField={setShowTitleField}
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    image={image}
                    setImage={setImage}
                    date={tempDate}
                    setDate={setTempDate}
                    iosdate={date}
                    handleConfirm={handleConfirm}
                    typeOne={typeOne}
                    typeTwo={typeTwo}
                    setCategorys={setCategorys}
                    categorys={categorys}
                />
            )}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0">
                <div className="flex-1"></div>

                {user && (
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setShowTitleField(!showTitleField)}
                    >
                        <Plus /> &nbsp; Create
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 mt-10">
                {!loading ? (
                    events[event]?.map(({ item }) => (
                        <EventCard
                            key={item?._id}
                            id={item?._id}
                            image={item?.images}
                            title={item?.name}
                            date={item?.dates}
                        />
                    ))
                ) : (
                    <>
                        <Skeleton className="rounded-2xl h-[250px]" />
                        <Skeleton className="rounded-2xl h-[250px]" />
                        <Skeleton className="rounded-2xl h-[250px]" />
                    </>
                )}
            </div>
        </div>
    );
};

export default Events;
