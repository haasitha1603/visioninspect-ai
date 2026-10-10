const isLocalhost = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

let rawApiUrl = import.meta.env.VITE_API_URL;
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}

const defaultBaseUrl = isLocalhost ? "http://127.0.0.1:8000" : "";

export const API_BASE_URL = rawApiUrl !== undefined && rawApiUrl !== ""
  ? rawApiUrl 
  : defaultBaseUrl;
