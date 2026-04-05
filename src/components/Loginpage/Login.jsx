import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { setActiveUser } from "../../counterSlice";
import { loginUserService } from "../../services/userService";
import loginBg from "../../images/login 3.jpg";

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // ✅ NEW STATE
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const styleId = 'login-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ✅ UPDATED HANDLE SUBMIT WITH LOADER
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true); // 🔥 start loader

      const response = await loginUserService({
        email: email,
        password: password
      });

      if (response) {
        const userData = response.user || response;

        dispatch(setActiveUser(userData));

        const leanUser = {
          _id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          token: userData.token,
          profilePic: userData.profilePic
        };

        try {
          localStorage.setItem('user', JSON.stringify(leanUser));
        } catch (storageError) {
          console.warn("Storage warning:", storageError);
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
        serverMessage = "Browser storage is full!";
      } else {
        serverMessage = error.message || "Invalid email or password.";
      }

      alert(serverMessage);

    } finally {
      setLoading(false); // 🔥 stop loader
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

          <h1 className="text-center font-bold uppercase mb-5 text-white">
            Welcome to Chat Application
          </h1>

          <h1 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-black to-blue-900 bg-clip-text text-transparent">
            LOGIN
          </h1>

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
              <Link to="/forgot-password" className="text-white/80 text-xs hover:text-white underline">
                Forgot Password?
              </Link>
            </div>

            {/* ✅ UPDATED BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-white text-black font-bold text-xl flex items-center justify-center gap-2 hover:scale-105 transition-all mt-4 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Login"
              )}
            </button>

          </form>

          <div className="mt-8 text-center">
            <p className="text-white/90 text-sm">
              Do not have account{' '}
              <Link to="/register" className="text-white font-semibold underline decoration-cyan-400 hover:text-cyan-300">
                Register?
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}