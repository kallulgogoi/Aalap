import axios from "axios";
import { useAuthStore } from "../store/authStore";

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return url.endsWith("/api") ? url : `${url}/api`;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// --- RESPONSE INTERCEPTOR ---
// Runs AFTER the backend replies, but BEFORE your React components see the data
axiosInstance.interceptors.response.use(
  (response) => {
    // If the request was successful, just pass the data through
    return response;
  },
  (error) => {
    // If the backend says "401 Unauthorized" (e.g., token is fake or expired)
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or invalid token. Logging out...");

      // Instantly wipe the Zustand store and localStorage
      useAuthStore.getState().logout();

      // Force a redirect to the login page (only if running in the browser)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
