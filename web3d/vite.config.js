import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync, cpSync, existsSync, rmSync } from "fs";
import { resolve } from "path";

// Shared copy logic for monolithic dist/ build (dev/preview)
function copyBackendToDist(dist) {
  const root = resolve(__dirname);

  cpSync(resolve(root, "api"), resolve(dist, "api"), { recursive: true });
  copyFileSync(resolve(root, ".htrouter.php"), resolve(dist, ".htrouter.php"));

  if (existsSync(resolve(root, ".env"))) {
    copyFileSync(resolve(root, ".env"), resolve(dist, ".env"));
  }
  if (existsSync(resolve(root, "uploads"))) {
    cpSync(resolve(root, "uploads"), resolve(dist, "uploads"), { recursive: true });
  }
  if (existsSync(resolve(root, "scripts"))) {
    cpSync(resolve(root, "scripts"), resolve(dist, "scripts"), { recursive: true });
  }

  console.log("\n✅ Backend copied to dist/");
}

// Split build for InfinityFree: dist/frontend/ + dist/backend/
function buildForProduction() {
  const root = resolve(__dirname);
  const dist = resolve(__dirname, "dist");
  const frontendDir = resolve(dist, "frontend");
  const backendDir = resolve(dist, "backend");

  // Clean previous build
  if (existsSync(resolve(dist, "frontend"))) rmSync(resolve(dist, "frontend"), { recursive: true });
  if (existsSync(resolve(dist, "backend"))) rmSync(resolve(dist, "backend"), { recursive: true });

  // --- Frontend ---
  mkdirSync(frontendDir, { recursive: true });

  // Copy compiled assets
  const assetsSrc = resolve(dist, "assets");
  if (existsSync(assetsSrc)) {
    cpSync(assetsSrc, resolve(frontendDir, "assets"), { recursive: true });
  }

  // Copy index.html and static root files
  const indexHtml = resolve(dist, "index.html");
  if (existsSync(indexHtml)) {
    copyFileSync(indexHtml, resolve(frontendDir, "index.html"));
  }

  // Copy static assets that sit at root level
  for (const file of ["mypic.png", "favicon.ico"]) {
    const src = resolve(root, file);
    if (existsSync(src)) {
      copyFileSync(src, resolve(frontendDir, file));
    }
  }

  // Copy frontend .htaccess
  copyFileSync(resolve(root, "deploy", "frontend", ".htaccess"), resolve(frontendDir, ".htaccess"));

  console.log("✅ Frontend built to dist/frontend/");

  // --- Backend ---
  mkdirSync(backendDir, { recursive: true });

  // Copy API directory
  cpSync(resolve(root, "api"), resolve(backendDir, "api"), { recursive: true });

  // Copy uploads directory structure
  if (existsSync(resolve(root, "uploads"))) {
    cpSync(resolve(root, "uploads"), resolve(backendDir, "uploads"), { recursive: true });
  } else {
    mkdirSync(resolve(backendDir, "uploads"), { recursive: true });
  }

  // Copy scripts
  if (existsSync(resolve(root, "scripts"))) {
    cpSync(resolve(root, "scripts"), resolve(backendDir, "scripts"), { recursive: true });
  }

  // Copy backend entry point and .htaccess
  copyFileSync(resolve(root, "deploy", "backend", "index.php"), resolve(backendDir, "index.php"));
  copyFileSync(resolve(root, "deploy", "backend", ".htaccess"), resolve(backendDir, ".htaccess"));

  // Copy .env (production)
  const envProd = resolve(root, ".env.backend.production");
  if (existsSync(envProd)) {
    copyFileSync(envProd, resolve(backendDir, ".env"));
  } else if (existsSync(resolve(root, ".env"))) {
    copyFileSync(resolve(root, ".env"), resolve(backendDir, ".env"));
    console.log("⚠️  No .env.backend.production found — copied .env instead. Create .env.backend.production with SETUP_TOKEN before deploying.");
  }

  console.log("✅ Backend built to dist/backend/");
  console.log("\n📦 Deployment ready!");
  console.log("   → Upload dist/frontend/* to htdocs/ (sahajshakya.com.np)");
  console.log("   → Upload dist/backend/* to backend.sahajshakya.com.np/");
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [
      react(),
      {
        name: "copy-backend",
        closeBundle() {
          if (isProd && process.env.BUILD_TARGET === "infinityfree") {
            buildForProduction();
          } else {
            copyBackendToDist(resolve(__dirname, "dist"));
          }
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
  };
});
