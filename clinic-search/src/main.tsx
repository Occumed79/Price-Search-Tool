import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Point the API client at the backend URL when deployed separately.
// Set VITE_API_URL in Vercel environment variables to your Render backend URL.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
