import { Routes, Route } from "react-router-dom"
import Login from "../Login"
import Register from "../Register"
// import Chat from "../Chat"   // future

function AppRoutes(){
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* <Route path="/chat" element={<Chat />} /> */}
    </Routes>
  )
}

export default AppRoutes