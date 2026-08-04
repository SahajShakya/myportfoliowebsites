import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite copies /public into dist/, so the PHP backend (public/api), the uploaded
// files (public/uploads) and the hosting .htaccess all land in dist/ automatically.
// dist/ is therefore a complete deployable: upload its contents to htdocs/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: [
    "**/*.glb",
    "**/*.gltf",
    "**/*.jpg",
    "**/*.png",
    "**/*.svg",
    "**/*.mp3",
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
