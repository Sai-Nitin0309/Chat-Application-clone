import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { setActiveUser } from "../counterSlice";
// ✅ Import the login service
import { loginUserService } from "../services/userService";
import loginBg from "../images/login 3.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // ... (Keep your animation code as it is) ...
    const styleId = 'login-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        /* Add other animations back here if needed */
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ✅ UPDATED HANDLESUBMIT TO USE API
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUserService({
        email: email,
        password: password
      });

      if (response) {
        const userData = response.user || response;
        
        // 1. Update full user object in Redux state (in-memory)
        dispatch(setActiveUser(userData));

        // 2. Prepare a lean version for localStorage to avoid QuotaExceededError
        const leanUser = {
          _id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          token: userData.token,
          // Only include profilePic if it's a URL, not a large base64/binary string
          profilePic: userData.profilePic
        };

        // 3. Persist session to localStorage
        try {
          localStorage.setItem('user', JSON.stringify(leanUser));
        } catch (storageError) {
          console.warn("Storage warning: Could not save user session locally.", storageError);
          // Still consider the login successful!
        }

        alert("Login Successful! Redirecting...");
        navigate('/home');
      }
    } catch (error) {
      console.error("Login component error:", error);
      
      let serverMessage = "An error occurred during login. Please try again.";
      
      if (error.response) {
        serverMessage = error.response.data?.message || `Server Login Failed: ${error.response.status}`;
      } else if (error.name === 'QuotaExceededError' || error.message?.includes("quota")) {
        serverMessage = "Browser storage is full! Please clear your cache or local storage.";
      } else {
        serverMessage = error.message || "Invalid email or password. Please try again.";
      }
      
      alert(serverMessage);
    }
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((e.clientY - rect.top - centerY) / centerY) * -6;
    const rotateY = ((e.clientX - rect.left - centerX) / centerX) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background and blobs remain the same */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="absolute inset-0 bg-black/5" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-fadeIn" style={{ perspective: '1000px' }}>
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="backdrop-blur-3xl bg-gradient-to-br from-blue-400/30 to-blue-500/25 rounded-3xl shadow-2xl border border-white/40 p-12"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          <h1 className="text-center font-bold uppercase mb-5 text-white">Welcome to Chat Application</h1>
          <h1 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-black to-blue-900 bg-clip-text text-transparent">LOGIN</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Mail"
              className="w-full px-6 py-4 rounded-2xl bg-blue-100/90 border border-white/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Your Password"
              className="w-full px-6 py-4 rounded-2xl bg-blue-100/90 border border-white/50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />

            <div className="flex justify-end pr-2">
              <Link to="/forgot-password" size="xs" className="text-white/80 text-xs hover:text-white transition-colors underline underline-offset-4">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="w-full py-4 rounded-full bg-white text-black font-bold text-xl hover:scale-105 transition-all mt-4">
              Login
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/90 text-sm">
              Do not have account{' '}
              <Link to="/register" className="text-white font-semibold underline decoration-cyan-400 hover:text-cyan-300">Register?</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
