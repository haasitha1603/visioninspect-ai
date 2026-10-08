const isLocalhost = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const defaultBaseUrl = isLocalhost ? "http://127.0.0.1:8000" : "";

export const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : defaultBaseUrl;
