import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Inject animations into the page
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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-shimmer { animation: shimmer 2s ease-in-out; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', { email, password });
    // Add your login logic here
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Reduced from 15 to 6 for subtler tilt effect
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/src/images/login 3.jpg')" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Animated Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow animation-delay-2000" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-pulse-glow animation-delay-4000" />

      {/* Login Card with 3D Perspective */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fadeIn" style={{ perspective: '1000px' }}>
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="backdrop-blur-3xl bg-gradient-to-br from-blue-400/30 to-blue-500/25 rounded-3xl shadow-2xl border border-white/40 p-12"
          style={{
            boxShadow: '0 25px 70px rgba(0, 100, 200, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Dynamic Light Reflection */}
          <div
            className="absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
              opacity: Math.abs(tilt.x) > 0 || Math.abs(tilt.y) > 0 ? 1 : 0
            }}
          />

          {/* Welcome Heading */}
          <h1 
            className="text-center font-bold uppercase tracking-wide mb-5 text-white text-lg"
            style={{ transform: 'translateZ(25px)' }}
          >
            Welcome to Chat Application
          </h1>
          
          {/* Title */}
          <h1
            className="text-4xl font-bold text-center mb-10 tracking-wider animate-slideDown"
            style={{
              background: 'linear-gradient(to right, #000000, #1e3a8a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              transform: 'translateZ(30px)'
            }}
          >
            LOGIN
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative group" style={{ transform: 'translateZ(20px)' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Mail"
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-100/90 to-cyan-100/85 backdrop-blur-sm border border-white/50 text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 shadow-lg text-base font-light focus:scale-105 focus:shadow-2xl"
                style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)' }}
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none" />
            </div>

            {/* Password Input */}
            <div className="relative group" style={{ transform: 'translateZ(20px)' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-100/90 to-cyan-100/85 backdrop-blur-sm border border-white/50 text-gray-700 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 shadow-lg text-base font-light focus:scale-105 focus:shadow-2xl"
                style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)' }}
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none" />
            </div>

            {/* Login Button */}
            <div style={{ transform: 'translateZ(40px)' }}>
              <button
                type="submit"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full py-4 rounded-full bg-gradient-to-r from-gray-100 to-white text-black font-bold text-xl tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-2xl mt-8 animate-pulse-slow"
                style={{
                  boxShadow: isHovered
                    ? '0 12px 40px rgba(255, 255, 255, 0.5), 0 0 25px rgba(200, 200, 255, 0.4)'
                    : '0 8px 25px rgba(0, 0, 0, 0.25)'
                }}
              >
                Login
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div
            className="mt-8 text-center animate-fadeIn"
            style={{
              animationDelay: '0.3s',
              opacity: 0,
              animationFillMode: 'forwards',
              transform: 'translateZ(15px)'
            }}
          >
            <p className="text-white/90 text-sm">
              Do not have account{' '}
              <Link
                to="/register"
                className="text-white font-semibold underline decoration-cyan-400 decoration-2 underline-offset-4 hover:text-cyan-300 transition-all duration-200 hover:decoration-cyan-300 hover:scale-105 inline-block"
              >
                Register?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}