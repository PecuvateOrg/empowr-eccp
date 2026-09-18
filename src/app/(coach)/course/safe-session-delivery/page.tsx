import type { Metadata } from "next";
import { ComingSoonCourse } from "../ComingSoonCourse";

export const metadata: Metadata = {
  title: "Safe Session Delivery — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default function SafeSessionDeliveryPage() {
  return <ComingSoonCourse slug="safe-session-delivery" />;
}
