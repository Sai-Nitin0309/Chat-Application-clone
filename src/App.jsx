import { BrowserRouter as Router } from "react-router-dom"
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setActiveUser } from "./counterSlice"
import AppRoutes from "./routes/AppRoutes"

// Restores login state from localStorage on every page load / refresh
function AuthRehydrator({ children }) {
  const dispatch = useDispatch()
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user')
      if (saved) dispatch(setActiveUser(JSON.parse(saved)))
    } catch (_) {}
  }, [dispatch])
  return children
}

function App() {
  return (
    <Router>
      <AuthRehydrator>
        <AppRoutes />
      </AuthRehydrator>
    </Router>
  )
}

export default App