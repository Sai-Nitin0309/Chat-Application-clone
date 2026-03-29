import { Routes, Route } from "react-router-dom"
import Login from "../components/Login"
import Register from "../components/Register"
import OTP from "../components/Otp"
import HomePage from "../components/HomePage";
import Chat from "../components/Chat";


// import Chat from "../Chat"   // future

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  )
}

export default AppRoutes