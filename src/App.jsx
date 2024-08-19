import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import UserEvents from "@/page/users/Events";

import { ThemeProvider } from "@/components/theme-provider";

import UserLayout from "./layouts/UserLayout";

import Signin from "./page/auth/Signin";
import { Toaster } from "@/components/ui/toaster";
import { useSelector } from "react-redux";
import Signup from "./page/auth/Signup";
import BookEvents from "./page/users/Book-Events";
import EventSummary from "./page/users/Event-Summary";

import { Edit } from "lucide-react";
import { EditEvent } from "./page/users/Events/EditEvent";

const App = () => {
    const { user } = useSelector((state) => state.user);

    return (
        <div>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Toaster />
                <Router>
                    <Routes>
                        <Route path="/signin" element={<Signin />} />

                        <Route path="/signup" element={<Signup />} />

                        <Route path="/" element={<UserLayout />}>
                            <Route path="/" element={<UserEvents />} />
                            <Route
                                path="event-summary/:eventId"
                                element={<EventSummary />}
                            />
 <Route
                                path="events/update-event/:eventId"
                                element={<EditEvent/>}
                            />

                            <Route
                                path="ticket-booking/:eventId"
                                element={<BookEvents />}
                            />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </div>
    );
};

export default App;
