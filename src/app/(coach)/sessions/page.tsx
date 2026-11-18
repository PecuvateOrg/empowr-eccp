import { CoachSessionsList } from "@/components/CoachSessionsList";
export default function CoachSessionsPage() {
 return <main className="py-10">
  <h1 className="text-3xl font-bold">My Sessions</h1>
  <p className="mt-2 text-muted">Review offered sessions, accept or decline, and request withdrawal with a reason.</p>
  <CoachSessionsList />
 </main>;
}
