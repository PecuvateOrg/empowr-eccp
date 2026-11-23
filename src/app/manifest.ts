import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  id: "/dashboard",
  name: "Empowr Coaching Hub",
  short_name: "Empowr ECCP",
  description: "Empowr Certified Coaching Programme",
  start_url: "/dashboard",
  scope: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#000000",
  icons: [
   { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
   { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
   { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
   { src: "/eccp-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
 };
}
