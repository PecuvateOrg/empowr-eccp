import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { can, getCurrentCoach } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Coach sign in — Empowr ECCP",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const coach = await getCurrentCoach();
  if (coach) redirect(can(coach, "view_management") ? "/management" : "/course");

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <LoginForm />
    </main>
  );
}
