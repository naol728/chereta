import { ThemeProvider } from "@/components/theme-provider"
import { Route, Routes } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Home from "./pages/user/Home"
import MyBids from "./pages/user/MyBids"
import Bids from "./pages/user/Bids"
import Profile from "./pages/user/Profile"
import Bid from "./pages/user/Bid"

function App() {

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
