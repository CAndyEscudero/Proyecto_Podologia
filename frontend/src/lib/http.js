import axios from "axios";
import { getStoredToken } from "../utils/auth";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
