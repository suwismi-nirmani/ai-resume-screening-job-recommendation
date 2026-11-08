import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development, requests to /api are forwarded to the FastAPI server,
// so the browser sees one origin and no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
