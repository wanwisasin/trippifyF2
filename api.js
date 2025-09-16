import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://trippifyb2-production.up.railway.app";

export default axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
