import { ThemeProvider } from "@/components/theme-provider"
import { Route, Routes } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Home from "./pages/user/Home"
import MyBids from "./pages/user/MyBids"
import Bids from "./pages/user/Bids"
import Profile from "./pages/user/Profile"
import Bid from "./pages/user/Bid"
import { useAppDispatch, useAppSelector } from "./store/hook"
import { useEffect, useState } from "react"
import { initAuth } from "./store/slice/auth"
import PhoneNumberSetup from "./components/PhoneNumberSetup"
import Loading from "./components/Loading"
import { toast } from "sonner"

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    async function init() {
      try {
        await dispatch(initAuth()).unwrap();

      } catch (err: unknown) {
        let message = "Initialization failed";
        if (err instanceof Error) {
          message = err.message;
        }
        toast.error(message);
      } finally {
        setReady(true);
      }
    }

    init();
  }, []);


  if (!ready) {
    return (
      <Loading />
    );
  }
  if (!user?.phone) {
    return (
      <PhoneNumberSetup
        onComplete={async () => {
          try {
            await dispatch(initAuth()).unwrap();
          } catch (error) {
            console.error("Failed to refresh user:", error);
          }
        }}
      />
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/bids" element={<Bids />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/bids/:id" element={<Bid />} />
      </Routes>

    </ThemeProvider>
  )
}

export default App
