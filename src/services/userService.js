import axios from "axios"

const BASE_URL = "http://192.168.0.24:5000"

export const registerUserService = async (user) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, user)
    return response.data
  } catch (error) {
    console.log("Register Error:", error)
    throw error
  }
}

export const loginUserService = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, credentials)
    return response.data
  } catch (error) {
    console.log("Login Error:", error)
    throw error
  }
}