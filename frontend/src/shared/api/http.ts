import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "../../app/config/env";
import { getStoredToken } from "../utils/auth";

export const http = axios.create({
  baseURL: env.apiUrl,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
