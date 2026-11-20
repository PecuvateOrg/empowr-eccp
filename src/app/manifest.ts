import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  name: "Empowr Coaching Hub",
  short_name: "Empowr ECCP",
  description: "Empowr Certified Coaching Programme",
  start_url: "/dashboard",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#153e75",
  icons: [{ src: "/logo.png", sizes: "any", type: "image/png", purpose: "any" }],
 };
}
