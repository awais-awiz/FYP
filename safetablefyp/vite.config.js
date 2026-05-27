import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // This ensures it points to your Python backend at port 8000
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

  return {
    server: {
      host: "127.0.0.1",
      port: 8080,
      proxy: {
        // Redirects frontend /api calls to the backend
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        // Redirects WebSocket calls (crucial for real-time updates)
        "/ws": {
          target: apiTarget,
          ws: true,
          changeOrigin: true,
        },
        // Proxy static files (3D models, images) from backend
        "/static": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/health": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: { host: "127.0.0.1", port: 8080 },
    plugins: [
      react(), 
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: false,
    },
  };
});