import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-backend",
      closeBundle() {
        const dist = resolve(__dirname, "dist");
        const root = resolve(__dirname);

        // Copy PHP backend
        cpSync(resolve(root, "api"), resolve(dist, "api"), { recursive: true });

        // Copy router
        copyFileSync(resolve(root, ".htrouter.php"), resolve(dist, ".htrouter.php"));

        // Copy env
        if (existsSync(resolve(root, ".env"))) {
          copyFileSync(resolve(root, ".env"), resolve(dist, ".env"));
        }

        // Copy uploads folder (structure only, not heavy media ideally)
        if (existsSync(resolve(root, "uploads"))) {
          cpSync(resolve(root, "uploads"), resolve(dist, "uploads"), { recursive: true });
        }

        // Copy scripts
        if (existsSync(resolve(root, "scripts"))) {
          cpSync(resolve(root, "scripts"), resolve(dist, "scripts"), { recursive: true });
        }

        console.log("\n✅ Backend copied to dist/");
      },
    },
  ],
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
