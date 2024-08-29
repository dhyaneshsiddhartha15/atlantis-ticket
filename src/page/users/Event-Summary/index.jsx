import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { Calendar } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";

const EventSummary = () => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const { eventId } = useParams();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const { toast } = useToast(); // Importing toast
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);
    const loggedInUserId = user?.id 
    console.log("evnet --------",event)
    const currentUser = event?.creatorId._id
    const handleDelete = async () => {
        try {
            setLoading(true);
            const res = await axios.delete(`${BASE_URL}/events/delete-event/${eventId}`);

            if (res.status === 200) {
                toast({
                    description: "Event deleted successfully",
                });
                navigate("/");
            } else {
                toast({
                    description: "Failed to delete event",
                });
            }
        } catch (error) {
            console.log(error);
            toast({
                description: "Error deleting event",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getData = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/events/single-event/${eventId}`);
                setEvent(res?.data?.data?.event?.details);
            } catch (error) {
                console.log(error);
            }
        };
        getData();
    }, [eventId]);

    return (
        <div>
            {event ? (
                <>
                {/* this need to show only for the admin not for all user  */}

                    <div
                        className="relative min-h-[30vh] max-h-[40vh] w-full bg-cover bg-center rounded-lg"
                        style={{ backgroundImage: `url(${event?.images[0]})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black opacity-50">
                            <div className="absolute bottom-5 right-10 flex gap-4">
                                {/* <h1>{loggedInUserId}</h1>
                                <h1>{currentUser}</h1>
                                <h1>{currentUser}</h1>  */}
                               {loggedInUserId === currentUser && (                               
                                 <>
                                <Button 
                                    variant="outline" 
                                    color="danger"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Delete Events'}
                                </Button>
                                <Button 
                                    variant="outline"
                                    color="primary"
                                    asChild
                                >
                                    <Link to={`/events/update-event/${eventId}`}>
                                        Edit Event
                                    </Link>
                                </Button>
                                </>
                     )} 
                            </div>
                        </div>
                    </div>
                    {/* upto here */}
                    <div className="flex justify-between items-center py-5 bg-secondary mt-5 rounded-lg p-5 flex-wrap">
                        <div className="flex justify-center items-center gap-3">
                            <Calendar className="w-8 h-8 " />
                            <div>
                                Starts at: {event?.dates[0]?.split("T")[0]} <br />
                                Ends at: {event?.dates[event?.dates?.length - 1]?.split("T")[0]}
                            </div>
                        </div>
                        <Button asChild>
                            <Link to={`/ticket-booking/${eventId}`}>
                                Book Now
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-5">
                        <h2 className="text-xl">
                            <b>Title: {event?.name}</b>
                        </h2>
                        <h3 className="text-xl mt-2">Description:</h3>
                        <p className="indent-8 mt-2 text-justify">
                            {event?.description}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <Skeleton className={"w-full h-[35vh]"} />
                    <Skeleton className={"w-full h-[8vh] mt-10"} />
                    <Skeleton className={"w-full md:w-1/2 h-10 mt-5"} />
                    <Skeleton className={"w-full md:w-1/3 h-10 mt-5"} />
                </>
            )}
        </div>
    );
};

export default EventSummary;
