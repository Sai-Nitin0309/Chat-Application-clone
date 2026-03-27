import React, { useState, useRef, useEffect } from 'react'; // Added useEffect for timer
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOtpService } from '../services/userService';

const styles = `
@keyframes gradientBG {
  0% { background-position: 0% 0%;}
  25% { background-position: 100% 0%;}
  50% { background-position: 100% 100%;}
  75% { background-position: 0% 100%;}
  100% { background-position: 0% 0%;}
}

.animated-bg {
  background: linear-gradient(135deg, #a8edea, #fed6e3, #c9b8f5, #89c4e1, #f9a8d4, #b9d4f5, #a8edea);
  background-size: 400% 400%;
  animation: gradientBG 10s ease infinite;
}

.tilt-card {
  transition: transform .15s ease, box-shadow .15s ease;
  will-change: transform;
}
`;

export default function OTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [timer, setTimer] = useState(30); // 30-second cooldown for Resend

    const navigate = useNavigate();
    const location = useLocation();

    // 1. Try to get email from navigation state
    // 2. Fallback to localStorage (on refresh)
    const [email, setEmail] = useState(location.state?.email || localStorage.getItem('userEmailForOtp'));

    // Save email to localStorage if it's available from navigation state
    useEffect(() => {
        if (location.state?.email) {
            localStorage.setItem('userEmailForOtp', location.state.email);
            setEmail(location.state.email);
        }
    }, [location.state?.email]);

    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const cardRef = useRef(null);

    // Timer logic for Resend OTP
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10;
        const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) inputRefs[index + 1].current.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalOtpCode = otp.join('');
        if (finalOtpCode.length === 6) {
            if (!email) {
                alert("User email not found. Please register again.");
                return;
            }
            setIsLoading(true);
            try {
                await verifyOtpService(email, finalOtpCode);
                alert("Verification Successful!");
                navigate('/');
            } catch (error) {
                alert(error.response?.data?.message || "Invalid OTP. Please try again.");
            } finally {
                setIsLoading(false);
            }
        } else {
            alert('Please enter all 6 digits.');
        }
    };


    return (
        <>
            <style>{styles}</style>
            <div className="animated-bg min-h-screen flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

                <div
                    ref={cardRef}
                    className="tilt-card relative z-10 w-full max-w-md mx-4"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="backdrop-blur-3xl bg-white/40 rounded-3xl shadow-2xl border border-white/50 p-10">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-bold tracking-wider mb-2 text-gray-800">VERIFICATION</h1>
                            <p className="text-gray-600 font-medium">
                                Enter the 6-digit code sent to <br />
                                <span className="text-cyan-700 font-bold">{email || "your email"}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex justify-center gap-2 sm:gap-4 py-4">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        ref={inputRefs[index]}
                                        disabled={isLoading}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 text-gray-800 focus:outline-none focus:ring-4 focus:ring-cyan-300/40 transition-all duration-300 shadow-md focus:scale-110"
                                        required
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="w-full py-4 rounded-full bg-gradient-to-r from-[#1a9bbf] to-cyan-500 text-white font-bold text-xl transition-all duration-300 hover:scale-105 disabled:grayscale"
                            >
                                {isLoading ? "Verifying..." : "Verify Code"}
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </>
    );
}
