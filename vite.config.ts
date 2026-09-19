import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

// Relative base so the built site runs from any subpath, including a GitHub Pages
// project site at https://<user>.github.io/<repo>/.
export default defineConfig({
  base: "./",
  // Bake the package version in so the title screen shows the real build.
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Rapier's wasm and Three are each a single large chunk by design.
  build: { chunkSizeWarningLimit: 3000 },
  plugins: [
    // Installable, offline-capable: the whole game is a static site, so the service
    // worker precaches every build asset (the physics wasm, Richie's GLB, the fonts and
    // the venue textures included).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Runtime Rumble",
        short_name: "Rumble",
        description:
          "Five robots. Zero supervision. A 2.5D arcade robot fighter after hours at Devoxx.",
        start_url: "./",
        scope: "./",
        display: "fullscreen",
        orientation: "landscape",
        background_color: "#10131b",
        theme_color: "#10131b",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,glb,wasm,png,jpg,svg,woff2,webmanifest}",
        ],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
