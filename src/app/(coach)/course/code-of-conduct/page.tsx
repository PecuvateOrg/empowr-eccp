import type { Metadata } from "next";
import { ComingSoonCourse } from "../ComingSoonCourse";

export const metadata: Metadata = {
  title: "Code of Conduct — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default function CodeOfConductPage() {
  return <ComingSoonCourse slug="code-of-conduct" />;
}
