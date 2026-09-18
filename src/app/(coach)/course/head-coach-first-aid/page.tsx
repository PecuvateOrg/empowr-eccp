import type { Metadata } from "next";
import { ComingSoonCourse } from "../ComingSoonCourse";

export const metadata: Metadata = {
  title: "Head Coach First Aid — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default function HeadCoachFirstAidPage() {
  return <ComingSoonCourse slug="head-coach-first-aid" />;
}
