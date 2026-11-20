import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  name: "Empowr Coaching Hub",
  short_name: "Empowr ECCP",
  description: "Empowr Certified Coaching Programme",
  start_url: "/dashboard",
  scope: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#000000",
  icons: [{ src: "/eccp-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
 };
}
