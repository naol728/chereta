/*eslint-disable*/

import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import MainLayout from "./layout/MainLayout";
import Home from "./pages/user/Home";
import MyBids from "./pages/user/MyBids";
import Bids from "./pages/user/Bids";
import Profile from "./pages/user/Profile";
import Bid from "./pages/user/Bid";

import { useAppDispatch, useAppSelector } from "./store/hook";
import { initAuth } from "./store/slice/auth";

import PhoneNumberSetup from "./components/PhoneNumberSetup";
import Loading from "./components/Loading";
import PaymentPage from "./pages/user/PaymentPage";

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {

      try {
        const result = await dispatch(initAuth()).unwrap();

      } catch (error: unknown) {

        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Initialization failed";

        toast.error(message);
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <Loading />;
  }

  if (!user?.phone) {
    return (
      <PhoneNumberSetup
        onComplete={async () => {
          try {
            await dispatch(initAuth()).unwrap();
          } catch (error) {
            toast.error("Failed to refresh your profile.");
          }
        }}
      />
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/bids" element={<Bids />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/bids/:id" element={<Bid />} />
      <Route path="/payment/:orderId" element={<PaymentPage />} />
      <Route path="/payment/:paymentid" element={<PaymentPage />} />
    </Routes>
  );
}

export default App;
