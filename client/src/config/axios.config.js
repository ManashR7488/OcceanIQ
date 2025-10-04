import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "https://occean-iq.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
});

export default axiosInstance;
