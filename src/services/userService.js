
import axios from "axios";

// const BASE_URL = "http://localhost:5000";
// export const BASE_URL = "https://mes-ioa3.onrender.com";
const SOCKET_URL = "http://192.168.0.226:5000";


export const registerUserService = async (user) => {

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, user, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  } catch (error) {
    console.log("Register Error:", error);
    throw error;
  }
};

export const verifyOtpService = async (email, otp) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      email: email,
      otp: otp
    });
    return response.data;
  } catch (error) {
    console.log("OTP Verification Error:", error);
    throw error;
  }
};



export const loginUserService = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials);
    console.log("Login Response:", response);
    return response.data;
  } catch (error) {
    console.log("Login Error:", error);
    throw error;
  }
};


