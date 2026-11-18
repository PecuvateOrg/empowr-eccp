import { StaffAssignmentsList } from "@/components/StaffAssignmentsList";
export default function StaffAssignmentsPage() {
 return <main className="py-10">
  <h1 className="text-3xl font-bold">Coach assignments</h1>
  <p className="mt-2 text-muted">Review session offers, decisions and withdrawals.</p>
  <StaffAssignmentsList />
 </main>;
}
