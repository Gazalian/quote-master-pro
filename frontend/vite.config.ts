import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Stamped into the bundle so the profile screen (and therefore any support
// email) can name the exact build a user is on.
const appVersion =
  process.env.APP_VERSION ??
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  "dev";

// Absolute URLs are required for canonical + Open Graph tags (OG scrapers do
// not run JS, so this can't be resolved at runtime). Override per-deployment
// with SITE_URL; the default matches the support address already used in-app.
const siteUrl = (process.env.SITE_URL ?? "https://otoquote.ai").replace(/\/+$/, "");

// `order: "pre"` matters: the token has to be gone before Vite's own HTML
// pass walks href/src attributes, or it tries to resolve the placeholder as a
// local asset.
const htmlSiteUrl = () => ({
  name: "html-site-url",
  transformIndexHtml: {
    order: "pre" as const,
    handler: (html: string) => html.replaceAll("__SITE_URL__", siteUrl),
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    htmlSiteUrl(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        id: "/",
        name: "OtoQuote AI",
        short_name: "OtoQuote",
        description: "AI-powered quotation app for Nigerian tradespeople",
        theme_color: "#0056D2",
        background_color: "#f5f7f9",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "browser"],
        orientation: "portrait",
        start_url: "/auth",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @react-pdf/renderer ships ESM + CJS internals — Vite's dep pre-bundler
  // sometimes mishandles it on first import. Forcing inclusion here makes
  // dynamic-import('@/lib/pdf') reliable.
  optimizeDeps: {
    include: ["@react-pdf/renderer"],
  },
}));
