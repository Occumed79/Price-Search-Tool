import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env["API_TARGET_URL"] ?? "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3001,
    host: "0.0.0.0",
  },
});
